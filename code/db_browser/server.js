// Database browser
// A tiny web app for looking at the collections and documents in a database
// It only reads the database - it can't change anything

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const config = require("./config");

const collections = require("./pages/collections");
const documents = require("./pages/documents");

const app = express();

// Pages are made from the templates in the views folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Files in the public folder (such as the style sheet) are sent as they are
app.use("/public", express.static(path.join(__dirname, "public")));

// Each part of the site is handled by its own router
app.use("/", collections);
app.use("/collection", documents);

async function start() {
    if (!config.databaseUrl) {
        console.log("Set DATABASE_URL to the address of your database before starting the browser");
        process.exit(1);
    }

    await mongoose.connect(config.databaseUrl);
    console.log(`Connected to the ${mongoose.connection.db.databaseName} database`);

    app.listen(config.port, config.host);
    console.log(`Browser listening on http://${config.host}:${config.port}`);
}

start();
