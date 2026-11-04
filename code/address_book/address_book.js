// Address book
// Stores a name and address in the database, then searches for a name
// Use it like this: node address_book.js

const mongoose = require("mongoose");
const readline = require("readline/promises");

async function addressBook() {
    // Step 1: connect to the database
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.log("Set DATABASE_URL to the address of your database first");
        return;
    }

    await mongoose.connect(databaseUrl);

    // The connection object represents the database inside the program
    const db = mongoose.connection;
    console.log(`Connected to the ${db.name} database on ${db.host}`);

    // Step 2: describe an address book entry
    // The schema describes the information we store about each entry
    const addressSchema = new mongoose.Schema({
        name: { type: String, required: true },
        address: { type: String, required: true }
    });

    // The model is the object we use to work with the addresses collection
    const AddressBook = mongoose.model("AddressBook", addressSchema, "addresses");

    // The terminal object lets the program ask questions and read the answers
    const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });

    // Step 3: ask what the user wants to do
    const choice = await terminal.question("Type a to add an entry or s to search for a name: ");

    if (choice === "a") {
        // Step 4: store a new entry
        const nameInput = await terminal.question("Name to add: ");
        const addressInput = await terminal.question("Address: ");

        try {
            const entry = await AddressBook.create({ name: nameInput, address: addressInput });
            console.log(`Added ${entry.name} with id ${entry._id}`);
        } catch (error) {
            // The schema has found something wrong with the entry
            console.log(`The entry was not stored: ${error.message}`);
        }
    } else if (choice === "s") {
        // Step 5: search for a name
        const searchInput = await terminal.question("Name to search for: ");
        const entries = await AddressBook.find({ name: searchInput });

        if (entries.length === 0) {
            console.log(`There are no addresses for ${searchInput}`);
        }

        for (const entry of entries) {
            console.log(`${entry.name}: ${entry.address}`);
        }
    } else {
        console.log("Please run the program again and type a or s");
    }

    // The program won't end while the terminal and the database connection are open
    terminal.close();
    await db.close();
}

addressBook();
