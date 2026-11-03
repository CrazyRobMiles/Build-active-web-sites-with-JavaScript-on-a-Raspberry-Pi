// Sends the picture file for a three word name

const express = require("express");
const path = require("path");

const config = require("../config");
const Picture = require("../schemas/picture");

const router = express.Router();

router.get("/:phrase", async (req, res) => {
    const picture = await Picture.findOne({ phrase: req.params.phrase });

    if (picture === null) {
        res.status(404).send("Picture not found");
        return;
    }

    res.sendFile(path.join(config.picturesFolder, picture.filename));
});

module.exports = router;
