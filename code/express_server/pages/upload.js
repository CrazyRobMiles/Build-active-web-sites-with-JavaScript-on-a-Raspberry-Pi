// Receives a picture, gives it a three word name and stores it

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const config = require("../config");
const Picture = require("../schemas/picture");
const makeUniquePhrase = require("../helpers/threeWordPhrase");

const router = express.Router();

const imageMiddleware = express.raw({
    type: "image/jpeg",
    limit: "20mb"
});

router.post("/", imageMiddleware, async (req, res) => {
    // req.body is only a Buffer if a JPEG image was sent
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).send("Send a JPEG image with Content-Type image/jpeg");
        return;
    }

    const phrase = await makeUniquePhrase();
    const filename = `${crypto.randomUUID()}.jpg`;

    fs.writeFileSync(path.join(config.picturesFolder, filename), req.body);
    await Picture.create({ phrase, filename });

    console.log(`Stored ${filename} as ${phrase}`);
    res.send(phrase);
});

module.exports = router;
