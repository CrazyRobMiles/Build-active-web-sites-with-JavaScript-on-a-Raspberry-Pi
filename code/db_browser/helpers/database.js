// Functions that read from the database without using a schema
// They work with any collection, because they don't need to know what is in it

const mongoose = require("mongoose");

// Gets the names of the collections, with the number of documents in each one
async function getCollections() {
    const db = mongoose.connection.db;
    const list = await db.listCollections().toArray();

    const result = [];
    for (const item of list) {
        const count = await db.collection(item.name).countDocuments();
        result.push({ name: item.name, count });
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
}

// Returns true if the database contains a collection with this name
async function collectionExists(name) {
    const list = await mongoose.connection.db.listCollections({ name: name }).toArray();
    return list.length > 0;
}

// The id in the address is always text, but the id in the database might not be
// Makes a list of all the values that the text could stand for
function possibleIds(text) {
    const ids = [text];
    // Most ids are ObjectIds, which are written as 24 hexadecimal digits
    if (/^[0-9a-f]{24}$/i.test(text)) {
        ids.push(new mongoose.Types.ObjectId(text));
    }
    // Some programs use numbers as ids
    if (text.trim() !== "" && !isNaN(Number(text))) {
        ids.push(Number(text));
    }
    return ids;
}

module.exports = { getCollections, collectionExists, possibleIds };
