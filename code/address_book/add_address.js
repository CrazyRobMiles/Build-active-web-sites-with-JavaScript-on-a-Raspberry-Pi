// Add an address
// Stores a name and address in the address book
// Use it like this: node add_address.js "Rob Miles" "1 Main Street, Hull"

const mongoose = require("mongoose");
const Address = require("./address");

const databaseUrl = process.env.DATABASE_URL;

async function addAddress(name, address) {
    await mongoose.connect(databaseUrl);

    const entry = await Address.create({ name, address });
    console.log(`Added ${entry.name} with id ${entry._id}`);

    // The program won't end while it is still connected to the database
    await mongoose.disconnect();
}

if (!databaseUrl) {
    console.log("Set DATABASE_URL to the address of your database first");
    process.exit(1);
}

const name = process.argv[2];
const address = process.argv[3];

if (!name || !address) {
    console.log('Use this program like this: node add_address.js "name" "address"');
    process.exit(1);
}

addAddress(name, address);
