# Make a database browser

So far we've looked inside the database by logging in with **mongosh** and typing commands. That works, but it's a bit fiddly. MongoDB makes a program called **Compass**, which lets you look at a database in a window, but there isn't a version of Compass that runs on a Raspberry Pi. So in this howto we'll make our own tiny version. It's a web app that shows the collections in the database, the documents in each collection and the fields in each document.

You already know everything you need to build it. It is organised in the same way as the Express server from the previous howto, and it uses templates to make its pages. The new idea is that it uses the database **without a schema**, so it can show any collection, even ones it knows nothing about.

The browser only reads the database. It can't change or delete anything, so you can't lose any data by using it.

## The application

The finished application is in the **code/db_browser** folder:

```
db_browser
├── server.js              starts the browser and connects the parts together
├── config.js              settings used by the different parts of the browser
├── helpers
│   ├── database.js        reads from the database without using a schema
│   └── format.js          turns documents into text for the pages
├── pages
│   ├── collections.js     the home page, which lists the collections
│   └── documents.js       the pages that show documents
├── views
│   ├── collections.ejs    the template for the list of collections
│   ├── documents.ejs      the template for a page of documents
│   ├── document.ejs       the template for a single document
│   ├── notFound.ejs       the template for the "not found" page
│   └── partials
│       └── head.ejs       the part of the page head that every page shares
└── public
    └── site.css           the style sheet for the browser
```

Install the libraries it needs:

```bash
cd code/db_browser
npm install
```

## Using the database without a schema

In the earlier programs, each collection had a schema and a model. The model for pictures knows that a picture has a **phrase**, a **filename**, an **uploadedAt** date and a **views** count. That's very useful when you are writing a program that works with pictures, but our browser has to work with every collection in the database, and it can't know in advance what they will contain.

Underneath Mongoose is the **MongoDB driver**, the library that actually talks to the database. Mongoose installs it for you. Once Mongoose is connected, `mongoose.connection.db` gives you the database object from the driver, which you can use directly. This is the function in **helpers/database.js** that gets the names of the collections:

```javascript
async function getCollections() {
    const db = mongoose.connection.db;
    const list = await db.listCollections().toArray();

    const result = [];
    for (const item of list) {
        const count = await db.collection(item.name).countDocuments();
        result.push({ name: item.name, count });
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
}
```

`listCollections` asks the database for a list of its collections. The driver sends back the answer a piece at a time, so that a long list doesn't have to be loaded all at once. `toArray` collects all the pieces into an ordinary array. For each collection, `db.collection(item.name)` gets an object for working with that collection, and `countDocuments` asks how many documents it holds. Finally the list is sorted into alphabetical order.

The driver doesn't use a schema, so it doesn't check anything. It will give you any document in a collection, whatever fields it has. That's what we want for a browser, but it's why the other programs use Mongoose. When your program is storing information, you want it to be checked.

## A page of documents

This is the router in **pages/documents.js** that shows the documents in a collection:

```javascript
router.get("/:name", async (req, res) => {
    const name = req.params.name;

    if (!(await collectionExists(name))) {
        res.status(404).render("notFound", { message: `There is no collection called ${name}.` });
        return;
    }

    // Use page 1 if the page number is missing or isn't sensible
    let page = parseInt(req.query.page);
    if (isNaN(page) || page < 1) {
        page = 1;
    }

    const collection = mongoose.connection.db.collection(name);
    const count = await collection.countDocuments();
    const pageCount = Math.max(1, Math.ceil(count / config.pageSize));

    const found = await collection.find()
        .sort({ _id: 1 })
        .skip((page - 1) * config.pageSize)
        .limit(config.pageSize)
        .toArray();

    // The page only needs the id of each document and a short summary of it
    const documents = found.map(document => ({
        id: String(document._id),
        summary: summarise(document)
    }));

    res.render("documents", { name, documents, count, page, pageCount });
});
```

The router handles addresses like **/collection/addresses**. A collection might hold thousands of documents, which would make a very long page, so the browser shows them a page at a time. The page number goes on the end of the address, like this: **/collection/addresses?page=2**. Express puts everything after the **?** into `req.query`, so the page number is in `req.query.page`. It is text, so `parseInt` turns it into a number. If there isn't a page number, or someone types something that isn't a sensible page number, the router uses page 1.

The database does the work of finding the right documents:

* `sort({ _id: 1 })` puts the documents in order of their ids, so they are in the same order every time. Ids made by MongoDB start with the time the document was made, so this is also the order they were added.
* `skip` jumps over the documents on the earlier pages. On page 3, with 20 documents on each page, it skips 40.
* `limit` asks for no more than one page of documents.

The page only shows the id of each document and the start of its contents, so the router uses the `summarise` function from **helpers/format.js** to make a short line of text from each document.

## A single document

The other router in **pages/documents.js** shows a single document, at an address like **/collection/addresses/6ae9eaa70adfb38ef0acacc4**:

```javascript
router.get("/:name/:id", async (req, res) => {
    const name = req.params.name;
    const collection = mongoose.connection.db.collection(name);
    // $in matches a document whose id is any of the values in the list
    const document = await collection.findOne({ _id: { $in: possibleIds(req.params.id) } });

    if (document === null) {
        res.status(404).render("notFound", { message: `There is no document ${req.params.id} in ${name}.` });
        return;
    }

    res.render("document", { name, document, text: showDocument(document) });
});
```

There's a problem with ids. The id in the address is always text, but in the database it could be something else. The ids that MongoDB makes are **ObjectIds**. An ObjectId is written as 24 hexadecimal digits, but it's not the same as the text, so searching for the text won't find it. And some programs use numbers as ids. The `possibleIds` function in **helpers/database.js** makes a list of all the values that the text could stand for:

```javascript
function possibleIds(text) {
    const ids = [text];
    // Most ids are ObjectIds, which are written as 24 hexadecimal digits
    if (/^[0-9a-f]{24}$/i.test(text)) {
        ids.push(new mongoose.Types.ObjectId(text));
    }
    // Some programs use numbers as ids
    if (text.trim() !== "" && !isNaN(Number(text))) {
        ids.push(Number(text));
    }
    return ids;
}
```

The `$in` in the search asks for a document whose id is **in** the list. So whatever kind of id the document has, the search finds it.

To show the document, the router uses the `showDocument` function from **helpers/format.js**. This uses `JSON.stringify` to turn the document into text, with each field on a line of its own:

```javascript
function showDocument(document) {
    return JSON.stringify(document, null, 2);
}
```

The template puts the text inside a `<pre>` element, which shows text exactly as it is laid out, line breaks and all:

```html
<pre><%= text %></pre>
```

Remember that the `<%=` tag makes sure that anything in the text that looks like HTML is shown as text. That's very important here. The browser shows everything in the database, and some of it might have come from people you don't know.

## Keeping the database private

The browser shows everything in the database, so you don't want just anyone to be able to use it. This is why **config.js** contains a **host** setting:

```javascript
module.exports = {
    // A different port from the picture servers, so they can run at the same time
    port: 3001,
    // Only accept connections from this Pi, because the browser shows everything in the database
    host: "127.0.0.1",
    databaseUrl: process.env.DATABASE_URL,
    // The number of documents shown on each page of a collection
    pageSize: 20
};
```

**server.js** passes the host to `app.listen`:

```javascript
app.listen(config.port, config.host);
```

The address **127.0.0.1** always means "this computer". When a server listens on 127.0.0.1, it only accepts connections that come from the same computer. The picture servers don't give a host, so they accept connections from anywhere on your network. The database browser only accepts connections from the Pi itself. This is the same thing we did with the database in the [Install Local MongoDB](/doc/04%20Install%20Local%20MongoDB.md) howto.

## Run the browser

Make sure that **DATABASE_URL** is set to the address of your database, as described in the [Use Mongoose](/doc/05%20Use%20Mongoose.md#store-the-connection-string) howto. Then start the browser:

```bash
npm start
```

You should see:

```
Connected to the custardcream database
Browser listening on http://127.0.0.1:3001
```

The browser uses port 3001, so you can leave a picture server running on port 3000 at the same time.

If you are using the Pi's desktop, open **http://localhost:3001** in the browser on the Pi. You'll see the collections that the earlier examples made, such as **addresses** and **examplepictures**, and the number of documents in each one. Click on a collection to see its documents, and click on the id of a document to see all its fields.

### Using the browser from another computer

Because the browser only accepts connections from the Pi, typing the address of the Pi into the browser on another computer won't work. Instead you can use **ssh** to make a **tunnel**. This connects a port on your computer to a port on the Pi, through your ssh login. Open a terminal on your computer (on Windows you can use PowerShell) and enter this, with your own user name and the name of your Pi:

```bash
ssh -L 3001:localhost:3001 yourname@yourpi.local
```

Log in as usual, and leave the window open. While it is open, anything that connects to port 3001 on your computer is sent through ssh to port 3001 on the Pi. So you can open **http://localhost:3001** in the browser on your computer. As far as the database browser is concerned, the connection comes from the Pi itself.

If you are working on the Pi using Visual Studio Code with the Remote - SSH extension, it makes the tunnel for you. When the browser starts, Visual Studio Code notices the new port and offers to open it in your browser.

## Try it yourself

* Show the total number of documents in the database on the home page. The list of collections already contains the number of documents in each one.
* Show the date that each document was made on the page of documents. The `getTimestamp` function of an ObjectId gives the time it was made, so `document._id.getTimestamp()` works for any document with an id made by MongoDB.
* Add a search box to the page of documents, which finds the documents where a field has a particular value. The page could send the name of the field and the value as part of the address, like the page number, and the router could use them to make a filter for `find`, like the one in the address book.

## What next?

The database browser can only be used from the Pi, because it has no way of knowing who is using it. The picture servers have the same problem the other way round: anyone on your network can upload pictures to them. In the next section we'll add logins and sessions, so that a server knows who is using it, and only lets in the people (and cameras) that you trust.

[home](/README.md)
