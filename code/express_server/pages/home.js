// The home page - a list of all the pictures, newest first

const express = require("express");
const Picture = require("../schemas/picture");

const router = express.Router();

router.get("/", async (req, res) => {
    const pictures = await Picture.find().sort({ uploadedAt: -1 });
    res.render("index", { pictures });
});

module.exports = router;
