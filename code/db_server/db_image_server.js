// Database image server
// Receives a picture, gives it a three word name and stores it
// The picture file goes in the pictures folder and its name goes in the database

const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const words = require("./wordlist.json");

const databaseUrl = process.env.DATABASE_URL;
const picturesFolder = path.join(__dirname, "pictures");
const port = 3000;

// The schema describes the information we store about each picture
const pictureSchema = new mongoose.Schema({
    phrase: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
});

// The third argument is the name of the collection in the database
const Picture = mongoose.model("Picture", pictureSchema, "examplepictures");

function randomPhrase() {
    const pick = () => words[Math.floor(Math.random() * words.length)];
    return [pick(), pick(), pick()].join("-");
}

// Keep picking phrases until we find one that isn't in the database
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

const app = express();

const imageMiddleware = express.raw({
    type: "image/jpeg",
    limit: "20mb"
});

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

app.get("/", async (req, res) => {
    const pictures = await Picture.find().sort({ uploadedAt: -1 });

    const links = pictures.map(picture =>
        `<li><a href="/view/${picture.phrase}">${picture.phrase}</a></li>`
    );

    res.send(`
        <html>
            <body>
                <h1>Stored pictures</h1>
                <ul>${links.join("")}</ul>
            </body>
        </html>
    `);
});

app.get("/view/:phrase", async (req, res) => {
    const picture = await Picture.findOne({ phrase: req.params.phrase });

    if (picture === null) {
        res.status(404).send("Picture not found");
        return;
    }

    res.send(`
        <html>
            <body>
                <h1>${picture.phrase}</h1>
                <img src="/picture/${picture.phrase}">
                <p>Uploaded ${picture.uploadedAt.toString()}</p>
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

start();
