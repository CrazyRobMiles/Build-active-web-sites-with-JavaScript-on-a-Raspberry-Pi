// Express server
// The picture server organised as a proper Express application
// Each part of the site is in its own file, and pages are made from templates

const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const config = require("./config");

const home = require("./pages/home");
const upload = require("./pages/upload");
const view = require("./pages/view");
const picture = require("./pages/picture");

const app = express();

// Pages are made from the templates in the views folder
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Files in the public folder (such as the style sheet) are sent as they are
app.use("/public", express.static(path.join(__dirname, "public")));

// Each part of the site is handled by its own router
app.use("/", home);
app.use("/upload", upload);
app.use("/view", view);
app.use("/picture", picture);

async function start() {
    if (!config.databaseUrl) {
        console.log("Set DATABASE_URL to the address of your database before starting the server");
        process.exit(1);
    }

    fs.mkdirSync(config.picturesFolder, { recursive: true });

    await mongoose.connect(config.databaseUrl);
    console.log("Database connected");

    app.listen(config.port);
    console.log(`Server listening on port ${config.port}`);
}

start();
