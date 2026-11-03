# Use Express to render pages

The servers in **tiny_db_server** work, but they wouldn't be much fun to look after as they grow. Everything is in one file, and each web page is a string of HTML in the middle of the JavaScript, with values from the database dropped into it. That's fine for a page with one picture and a view count. But a real site has lots of pages, and each page shows lots of information. Imagine a single file with dozens of routes, each building a big page out of strings, and you can see the problem:

* It's hard to find the code you want to change, because everything is in one place.
* HTML in a JavaScript string is hard to read, and your editor can't help you with it.
* If one of the values you put into a page contains HTML, it becomes part of the page. Someone could store a value that adds their own content (or their own programs) to your site.

Express has a better way to manage a site. In this howto we'll build the picture server again as a properly organised Express application. Each part of the site will be in its own file, and pages will be made from **templates**. A template is a web page with gaps in it, and Express fills the gaps with values from the database.

## The application

The finished application is in the **code/express_server** folder. It uses the same database as the earlier examples, and the same **pictures** folder, so all the pictures you've already uploaded will appear in it.

```
express_server
├── server.js              starts the server and connects the parts together
├── config.js              settings used by the different parts of the server
├── schemas
│   └── picture.js         the information we store about each picture
├── helpers
│   └── threeWordPhrase.js makes the three word names
├── pages
│   ├── home.js            the home page, which lists all the pictures
│   ├── upload.js          receives pictures
│   ├── view.js            the page that shows a picture
│   └── picture.js         sends picture files
├── views
│   ├── index.ejs          the template for the home page
│   ├── view.ejs           the template for the picture page
│   ├── notFound.ejs       the template for the "picture not found" page
│   └── partials
│       └── head.ejs       the part of the page head that every page shares
├── public
│   └── site.css           the style sheet for the site
└── wordlist.json          the words that the three word names are made from
```

There's a lot more files than before, but each one is small and does one job. If you want to change the way a picture is shown, you know to look in **views/view.ejs**. If you want to change what we store about pictures, you go to **schemas/picture.js**. The Custard Cream Server is organised in much the same way.

Install the libraries it needs:

```bash
cd code/express_server
npm install
```

As well as **express** and **mongoose**, this installs **ejs**, which stands for "Embedded JavaScript". This is the template library we'll use.

## The schema

```javascript
const pictureSchema = new mongoose.Schema({
    phrase: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 }
});

// All the example servers use the examplepictures collection
module.exports = mongoose.model("Picture", pictureSchema, "examplepictures");
```

This is the same schema as the counter server, but it is now in a file of its own. The last line uses `module.exports` to make the `Picture` model available to the rest of the program. Any file that wants to use the database gets the model like this:

```javascript
const Picture = require("../schemas/picture");
```

Because the schema is only in one place, there is only one place to change if we want to store something new about a picture.

## The pages

Each file in the **pages** folder holds a **router**. A router is a little piece of an Express application that looks after one part of the site. This is the router for the view page, in **pages/view.js**:

```javascript
router.get("/:phrase", async (req, res) => {
    const picture = await Picture.findOne({ phrase: req.params.phrase });

    if (picture === null) {
        res.status(404).render("notFound", { phrase: req.params.phrase });
        return;
    }

    picture.views = picture.views + 1;
    await picture.save();

    res.render("view", { picture });
});
```

This works just like the view page in the counter server. It finds the picture, adds one to the view count and saves it. The difference is at the end. Instead of building a page out of a string, the router calls `res.render`. This tells Express to make a page from the template called **view**, and gives the template the picture document to work with. If the picture isn't found, the router renders the **notFound** template instead.

The routers are connected together in **server.js**:

```javascript
app.use("/", home);
app.use("/upload", upload);
app.use("/view", view);
app.use("/picture", picture);
```

Each `app.use` tells Express which router looks after which addresses. The view router is connected to **/view**, and the route inside it is **/:phrase**, so together they handle addresses like **/view/copper-storm-warbler**. If you want to add a new part to the site, you write a new router and add a line here.

**server.js** also sets up the templates and the **public** folder:

```javascript
// Pages are made from the templates in the views folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Files in the public folder (such as the style sheet) are sent as they are
app.use("/public", express.static(path.join(__dirname, "public")));
```

The first two lines tell Express to use **ejs** for templates, and to find them in the **views** folder. The last line uses **express.static** to send files from the **public** folder without changing them. This is where the style sheet that sets the look of the site lives.

## The templates

This is the template for the view page, in **views/view.ejs**:

```html
<!DOCTYPE html>
<html>
<head>
    <%- include("partials/head", { title: picture.phrase }) %>
</head>
<body>
    <h1><%= picture.phrase %></h1>
    <img src="/picture/<%= picture.phrase %>" alt="The picture called <%= picture.phrase %>">
    <p>Uploaded: <%= picture.uploadedAt.toLocaleString() %></p>
    <p>Views: <%= picture.views %></p>
    <p><a href="/">All pictures</a></p>
</body>
</html>
```

This is an HTML file, so your editor can help you with it. The gaps are marked with special tags:

* `<%= picture.views %>` is replaced with the value inside the tag. The router passed the picture document to the template, so the template can use any of its fields. This is how the information in a document is mapped onto the page: **phrase** goes in the heading and the address of the image, **uploadedAt** goes in the upload date and **views** goes in the view count.
* `<%- include("partials/head", ...) %>` is replaced with the contents of another template. Every page uses **views/partials/head.ejs** to set the title of the page and load the style sheet. If you want to add something to the head of every page, there's only one file to change.

The `<%=` tag makes the page safe. Before a value is put into the page, any characters that have a special meaning in HTML are changed so that they are shown as text. You can see this by asking for a picture called **&lt;b&gt;hello&lt;/b&gt;**:

```
http://localhost:3000/view/<b>hello</b>
```

The "Picture not found" page shows **&lt;b&gt;hello&lt;/b&gt;** exactly as you typed it, rather than the word **hello** in bold. Whatever is in the database or the address, it can't change your page. The `<%-` tag doesn't do this, so only use it for things you trust, such as your own templates.

The home page template, **views/index.ejs**, shows how a template can contain JavaScript:

```html
    <% if (pictures.length === 0) { %>
        <p>No pictures have been uploaded yet.</p>
    <% } else { %>
        <ul>
            <% for (const picture of pictures) { %>
                <li>
                    <a href="/view/<%= picture.phrase %>"><%= picture.phrase %></a>
                    (views: <%= picture.views %>)
                </li>
            <% } %>
        </ul>
    <% } %>
```

Code inside `<% %>` tags is run, but nothing is put into the page. The router for the home page gives the template a list of all the pictures in the database. If the list is empty, the template shows a message. Otherwise a `for` loop makes a link for each picture.

## Run the server

Stop any of the other servers that are running, and start the Express server. You'll need to set the database address if you are using a new terminal:

```bash
export DATABASE_URL='mongodb://custardCreamApp:<password>@localhost:27017/custardcream'
npm start
```

`npm start` runs the start command in **package.json**, which is `node server.js`. You should see:

```
Database connected
Server listening on port 3000
```

Open **http://localhost:3000** in your browser. You'll see a list of all the pictures you uploaded with the earlier servers, newest first. Click on a picture to view it. The view count carries on from where the counter server left off, because it's the same database.

The upload address hasn't changed, so you can still use **db_image_upload.py** to add pictures. Upload one and refresh the home page to see it appear at the top of the list.

## Try it yourself

Here are some changes you could make to the application. Each one only needs changes to one or two files:

* Show the date each picture was uploaded in the list on the home page. You only need to change **views/index.ejs**.
* Change the look of the site by editing **public/site.css**.
* Add a page at **/random** that shows a random picture. Make a new router in **pages/random.js** and connect it in **server.js**. The router could use `Picture.countDocuments()` to find out how many pictures there are, and `Picture.findOne().skip(n)` to get the picture at position **n**. Then it can render the **view** template, just like the view page does.

## What next?

At the moment anyone who can reach the server can upload pictures. In the next section we'll add logins and sessions, so that only people (and cameras) that you trust can upload pictures.

[home](/README.md)
