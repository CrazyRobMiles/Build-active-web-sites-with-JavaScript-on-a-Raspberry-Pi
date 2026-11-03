// Settings used by the different parts of the server

const path = require("path");

module.exports = {
    port: 3000,
    databaseUrl: process.env.DATABASE_URL,
    // All the example servers share the pictures folder, as they share the database
    picturesFolder: path.join(__dirname, "..", "pictures")
};
