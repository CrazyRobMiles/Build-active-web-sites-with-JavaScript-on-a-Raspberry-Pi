// The information we store about each picture

const mongoose = require("mongoose");

const pictureSchema = new mongoose.Schema({
    phrase: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 }
});

// All the example servers use the examplepictures collection
module.exports = mongoose.model("Picture", pictureSchema, "examplepictures");
