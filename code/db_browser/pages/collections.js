// The home page - a list of the collections in the database

const express = require("express");
const mongoose = require("mongoose");
const { getCollections } = require("../helpers/database");

const router = express.Router();

router.get("/", async (req, res) => {
    const collections = await getCollections();
    res.render("collections", {
        databaseName: mongoose.connection.db.databaseName,
        collections
    });
});

module.exports = router;
