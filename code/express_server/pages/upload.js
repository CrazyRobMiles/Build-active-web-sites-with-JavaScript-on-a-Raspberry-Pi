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

    const newPhrase = await makeUniquePhrase();
    const newFilename = `${crypto.randomUUID()}.jpg`;

    fs.writeFileSync(path.join(config.picturesFolder, newFilename), req.body);
    await Picture.create({ phrase: newPhrase, filename: newFilename });

    console.log(`Stored ${newFilename} as ${newPhrase}`);
    res.send(newPhrase);
});

module.exports = router;
