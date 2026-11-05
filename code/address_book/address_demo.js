// Address demo
// Stores one address book entry in the database, then finds it
// Use it like this: node address_demo.js

const mongoose = require("mongoose");

async function addressDemo() {
    // Connect to the database
    await mongoose.connect(process.env.DATABASE_URL);
    const db = mongoose.connection;
    console.log(`Connected to the ${db.name} database`);

    // Describe an address book entry
    const addressSchema = new mongoose.Schema({
        name: { type: String, required: true },
        address: { type: String, required: true }
    });

    const AddressBook = mongoose.model("AddressBook", addressSchema, "addresses");

    // Store an entry
    const entry = await AddressBook.create({ name: "Rob", address: "Hull" });
    console.log(`Added ${entry.name} with id ${entry._id}`);

    // Find all the entries with the name Rob
    const entries = await AddressBook.find({ name: "Rob" });

    for (const found of entries) {
        console.log(`Found ${found.name}: ${found.address}`);
    }

    await db.close();
}

addressDemo();
