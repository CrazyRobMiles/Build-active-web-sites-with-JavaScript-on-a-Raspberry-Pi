# Make a database server

The image server in **tiny_server** can store one picture. Every time you upload a new one it overwrites **picture.jpg**, so only the latest picture survives. The Custard Cream Server does better than that. It gives every picture a three word name, such as **copper-storm-warbler**, and anyone who knows the name can go back and look at the picture. In this howto we are going to build a server that does the same thing, using the MongoDB database and the Mongoose library that you've met in the previous howtos.

We won't worry about logins here. Anyone can upload a picture to this server. We will cover logins and sessions later in this series.

## How it works

Each picture is stored in two pieces:

* The picture itself is saved as a file in the **pictures** folder inside the **code** folder. All the database examples share this folder, in the same way that they share the database. The file is given a random name, such as **8ccde564-f829-43e3-adaa-8f11bd88db28.jpg**.
* A **document** is added to the database. It records the three word name of the picture and the name of the file that holds it.

When someone asks for **copper-storm-warbler**, the server looks up that name in the database, finds the file name and sends back the file. Databases are very good at finding things quickly, so this works just as well with ten thousand pictures as it does with ten.

The file name has nothing to do with the three word name. So even if someone could see the contents of the **pictures** folder, they wouldn't be able to tell which three words go with which picture. This is how the Custard Cream Server keeps its pictures private.

## Make the project

The finished program is in the **code/tiny_db_server** folder. If you have a copy of this repository on your Pi, go into that folder and install the libraries it needs:

```bash
cd code/tiny_db_server
npm install
```

If you are building it yourself, make a new project and add the two libraries it uses:

```bash
mkdir tiny_db_server
cd tiny_db_server
npm init -y
npm install express mongoose
```

You already know **express**, and you used **mongoose** to make the address book. You'll also need a copy of the file **wordlist.json** from **code/tiny_db_server**. This holds the 200 words that the three word names are made from.

## The program

Open the file **db_image_server.js**. Let's work through it a piece at a time.

### Describe what we store

```javascript
const pictureSchema = new mongoose.Schema({
    phrase: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

const Picture = mongoose.model("Picture", pictureSchema, "examplepictures");
```

This works in the same way as the address book. The schema describes the information that we store about each picture: the three word phrase, the name of the file and the date it was uploaded. There are two new settings. The `unique: true` setting tells the database that no two pictures may have the same phrase. If the date isn't given, `default: Date.now` fills in the current date and time.

The model called `Picture` stores its documents in a collection called **examplepictures**. We use the name **examplepictures** so that this example doesn't get mixed up with the **pictures** collection of a Custard Cream Server using the same database.

### Make a three word name

```javascript
function randomPhrase() {
    const pick = () => words[Math.floor(Math.random() * words.length)];
    return [pick(), pick(), pick()].join("-");
}
```

The `pick` function picks a random word from the word list. We pick three words and join them together with dashes. With 200 words to choose from there are 200 x 200 x 200 = 8,000,000 different phrases, so it would take someone a very long time to find a picture by guessing.

But it is possible for the same phrase to come up twice. So before we use a phrase, we check that no other picture has it:

```javascript
async function makeUniquePhrase() {
    for (let attempt = 0; attempt < 10; attempt++) {
        const phrase = randomPhrase();
        const existing = await Picture.findOne({ phrase });
        if (existing === null) {
            return phrase;
        }
    }
    throw new Error("Could not find a free three word phrase");
}
```

`Picture.findOne` asks the database for a picture with this phrase. If it finds nothing, it returns `null` and the phrase is free to use. Asking the database takes time, so the function is marked `async` and we `await` the answer. If we fail ten times in a row, something is badly wrong, so we give up with an error.

### Receive a picture

```javascript
app.post("/upload", imageMiddleware, async (req, res) => {
    // req.body is only a Buffer if a JPEG image was sent
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).send("Send a JPEG image with Content-Type image/jpeg");
        return;
    }

    const phrase = await makeUniquePhrase();
    const filename = `${crypto.randomUUID()}.jpg`;

    fs.writeFileSync(path.join(picturesFolder, filename), req.body);
    await Picture.create({ phrase, filename });

    console.log(`Stored ${filename} as ${phrase}`);
    res.send(phrase);
});
```

This works like the upload in **image_server.js**, with three changes:

1. If the request doesn't contain a JPEG image, the server sends back an error (status 400 means "bad request") instead of saving an empty file.
2. Each picture gets its own file. `crypto.randomUUID()` makes a random name that is (for all practical purposes) never repeated.
3. `Picture.create` adds a document to the database that connects the phrase to the file. Then the server sends the phrase back to whoever uploaded the picture.

### Find a picture

The server shows pictures in the same way as **image_server.js**. The **/view** address sends back a web page that contains the picture, and the **/picture** address sends the picture file that goes in the page. The only change is that the server uses the database to find the picture file.

```javascript
app.get("/view/:phrase", async (req, res) => {
    const picture = await Picture.findOne({ phrase: req.params.phrase });

    if (picture === null) {
        res.status(404).send("Picture not found");
        return;
    }

    res.send(`
        <html>
            <body>
                <img src="/picture/${picture.phrase}">
            </body>
        </html>
    `);
});

app.get("/picture/:phrase", async (req, res) => {
    const picture = await Picture.findOne({ phrase: req.params.phrase });

    if (picture === null) {
        res.status(404).send("Picture not found");
        return;
    }

    res.sendFile(path.join(picturesFolder, picture.filename));
});
```

The `:phrase` part of each address tells Express to put whatever is in that part of the address into `req.params.phrase`. So a request for **/view/copper-storm-warbler** looks up **copper-storm-warbler** in the database. If the picture is found, the server sends back a page with an image in it. The browser then asks for the image at **/picture/copper-storm-warbler**, which looks up the phrase again and sends back the picture file. If the phrase isn't in the database, the server sends status 404, which means "not found".

### Connect to the database

```javascript
async function start() {
    if (!databaseUrl) {
        console.log("Set DATABASE_URL to the address of your database before starting the server");
        process.exit(1);
    }

    fs.mkdirSync(picturesFolder, { recursive: true });

    await mongoose.connect(databaseUrl);
    console.log("Database connected");

    app.listen(port);
    console.log(`Server listening on port ${port}`);
}
```

The program gets the address of the database from an **environment variable** called **DATABASE_URL**. The address contains the database password, so it's best to keep it out of the program. That way you can share the program without sharing the password. The `start` function makes the **pictures** folder (next to the **tiny_db_server** folder) if it isn't there yet, connects to the database and then starts the server.

## Run the server

Make sure that **DATABASE_URL** is set to the address of your database, as described at the end of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#5-store-the-database-address-in-an-environment-variable) or [Install Local MongoDB](/doc/04%20Install%20Local%20MongoDB.md#7-store-the-database-address-in-an-environment-variable) howto. Then start the server:

```bash
node db_image_server.js
```

You should see:

```
Database connected
Server listening on port 3000
```

If you see **Set DATABASE_URL to the address of your database before starting the server** instead, the environment variable isn't set in this terminal. If the server waits and then stops with a **MongooseServerSelectionError**, it can't reach the database. Check that MongoDB is running on your Pi or, if you are using Atlas, that your home network is in the Network Access list.

## Upload some pictures

The **code/python** folder contains **db_image_upload.py**. This sends the duck picture to the server and prints the name the server gives it. Open another terminal and run it:

```bash
cd code/python
python db_image_upload.py
```

```
The picture is stored as: copper-storm-warbler
```

Run it again and you'll get a different name, because each upload is stored as a separate picture. The server prints a message each time it stores one:

```
Stored 8ccde564-f829-43e3-adaa-8f11bd88db28.jpg as copper-storm-warbler
```

Now open a browser and go to **http://localhost:3000/view/copper-storm-warbler**, using the name your picture was given. If you are browsing from another computer, use the address of your Pi instead of **localhost**. You should see the duck. If you make a mistake in the name you'll see the message **Picture not found**.

## Look inside the database

You can see the documents the server has made by logging in to the database:

```bash
docker exec -it mongodb mongosh --username custardCreamApp --authenticationDatabase custardcream custardcream
```

If you are using Atlas, log in with `mongosh "$DATABASE_URL"` instead, as described in step 6 of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#6-check-the-connection) howto.

Then ask for the contents of the collection:

```javascript
db.examplepictures.find()
```

You'll see one document for each picture, something like this:

```javascript
{
  _id: ObjectId('6727a1b8f0c4e2a1d3b5c7e9'),
  phrase: 'copper-storm-warbler',
  filename: '8ccde564-f829-43e3-adaa-8f11bd88db28.jpg',
  uploadedAt: ISODate('2026-11-03T12:01:28.512Z'),
  __v: 0
}
```

The database added the **_id** field, which identifies each document. Mongoose added the **__v** field, which it uses to keep track of changes to a document. Type `exit` to leave.

If you stop the server and start it again, all the pictures are still there. The files are in the **pictures** folder and the database remembers which phrase goes with which file.

## What next?

Once a picture is stored, the server never changes it. Next we'll [update the database](/doc/07%20Update%20a%20database.md) by adding a view counter to each picture.

Anyone who can reach the server can also upload pictures to it. Later in this series we'll add logins and sessions, so that only people (and cameras) that you trust can upload pictures.

[home](/README.md)
