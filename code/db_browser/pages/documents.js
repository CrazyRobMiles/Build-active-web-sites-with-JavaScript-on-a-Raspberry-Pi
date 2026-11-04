// The pages that show the documents in a collection, and a single document

const express = require("express");
const mongoose = require("mongoose");
const config = require("../config");
const { collectionExists, possibleIds } = require("../helpers/database");
const { showDocument, summarise } = require("../helpers/format");

const router = express.Router();

// A page of the documents in a collection, such as /collection/addresses?page=2
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

// A single document, such as /collection/addresses/6ae9eaa70adfb38ef0acacc4
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

module.exports = router;
