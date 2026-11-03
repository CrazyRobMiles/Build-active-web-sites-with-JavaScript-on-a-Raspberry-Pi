// The schema and model for an entry in the address book
// Both of the address book programs use this file

const mongoose = require("mongoose");

// The schema describes the information we store about each entry
const addressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true }
});

// The third argument is the name of the collection in the database
module.exports = mongoose.model("Address", addressSchema, "addresses");
