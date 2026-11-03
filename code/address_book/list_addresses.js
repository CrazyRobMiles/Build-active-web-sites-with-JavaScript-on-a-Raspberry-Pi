// List addresses
// Shows every entry in the address book, or just the entries for one name
// Use it like this: node list_addresses.js
//               or: node list_addresses.js "Rob Miles"

const mongoose = require("mongoose");
const Address = require("./address");

const databaseUrl = process.env.DATABASE_URL;

async function listAddresses(name) {
    await mongoose.connect(databaseUrl);

    // An empty filter matches every entry
    let filter = {};
    if (name) {
        filter = { name: name };
    }

    const entries = await Address.find(filter).sort({ name: 1 });

    if (entries.length === 0) {
        console.log("No addresses found");
    }

    for (const entry of entries) {
        console.log(`${entry.name}: ${entry.address}`);
    }

    await mongoose.disconnect();
}

if (!databaseUrl) {
    console.log("Set DATABASE_URL to the address of your database first");
    process.exit(1);
}

listAddresses(process.argv[2]);
