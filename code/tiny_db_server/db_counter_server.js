// Database counter server
// The database image server with a view counter added to each picture
// The counter goes up by one each time the picture's page is viewed

const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const words = require("./wordlist.json");

const databaseUrl = process.env.DATABASE_URL;
// All the example servers share the pictures folder, as they share the database
const picturesFolder = path.join(__dirname, "..", "pictures");
const port = 3000;

// The schema describes the information we store about each picture
const pictureSchema = new mongoose.Schema({
    phrase: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    // New in this version - pictures stored before it was added get the default
    views: { type: Number, default: 0 }
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

app.get("/view/:phrase", async (req, res) => {
    const picture = await Picture.findOne({ phrase: req.params.phrase });

    if (picture === null) {
        res.status(404).send("Picture not found");
        return;
    }

    picture.views = picture.views + 1;
    await picture.save();

    res.send(`
        <html>
            <body>
                <img src="/picture/${picture.phrase}">
                <p>Views: ${picture.views}</p>
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
