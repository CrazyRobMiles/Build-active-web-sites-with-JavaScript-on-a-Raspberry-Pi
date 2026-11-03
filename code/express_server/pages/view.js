// The page that shows a picture and counts the views

const express = require("express");
const Picture = require("../schemas/picture");

const router = express.Router();

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

module.exports = router;
