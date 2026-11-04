# Use Mongoose

You now have a MongoDB database, either on your Pi or on Atlas. Before we connect it to a web server, let's find out how a JavaScript program can store and find information in it. In this howto we'll make a very simple address book program that you run from the command line. It connects to the database and asks what you want to do. You can add a name and address to the address book, or search for a name and see the addresses that are stored for it.

## Install Mongoose

A JavaScript program can talk to MongoDB using a library called **Mongoose**. Mongoose is a library, so you add it to a Node project with npm, in the same way as Express. Let's make a project for the address book:

```bash
mkdir address_book
cd address_book
npm init -y
npm install mongoose
```

The `npm install` command downloads Mongoose (and the libraries that Mongoose uses) into the **node_modules** folder of the project. It also adds Mongoose to the list of dependencies in **package.json**:

```json
  "dependencies": {
    "mongoose": "^8.24.8"
  }
```

If you give someone a copy of your project without the **node_modules** folder, they can run `npm install` to get all the libraries that **package.json** lists. That's how the example projects in this repository work. The finished address book program is in the **code/address_book** folder, so you can install the libraries for it like this:

```bash
cd code/address_book
npm install
```

## The program

The program is in the file **address_book.js**. This is how it starts:

```javascript
const mongoose = require("mongoose");
const readline = require("readline/promises");

async function addressBook() {
    // Step 1: connect to the database
```

The first two lines load the libraries that the program uses. **mongoose** is the library we just installed. **readline** is built into Node. It lets a program ask questions in the terminal and read the answers.

Everything else happens inside a function called `addressBook`, which works through the steps one after the other. The function is marked as `async`. Each time the program uses the database, it sends a message over the network and has to wait for a reply, and an `async` function can use `await` to wait for each reply before it moves on. The last line of the program calls the function:

```javascript
addressBook();
```

Let's work through the steps.

## Step 1: connect to the database

Before a program can do anything with the database, it has to connect to it:

```javascript
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.log("Set DATABASE_URL to the address of your database first");
    return;
}

await mongoose.connect(databaseUrl);

// The connection object represents the database inside the program
const db = mongoose.connection;
console.log(`Connected to the ${db.name} database on ${db.host}`);
```

The program gets the address of the database from the **DATABASE_URL** environment variable. `process.env` holds all the environment variables that the terminal passed to the program. If the variable hasn't been set, there's no database to connect to, so the program explains what is wrong and stops.

`mongoose.connect` uses the address to connect to the database, and `await` waits until the connection has been made. Then `mongoose.connection` gives us the **connection object**. This object represents the database inside the program. It holds the connection to the database server, and everything the program does with the database goes through it. The program puts it in a variable called `db`, and uses it to print the name of the database and the computer it is on. These both come from the address of the database.

## Step 2: describe an address book entry

MongoDB stores information as **documents**. A document is a collection of named values, called **fields**, which looks a lot like a JavaScript object:

```javascript
{
  name: 'Rob Miles',
  address: '1 Main Street, Hull'
}
```

Documents are grouped together in **collections**. If you've used a spreadsheet, you can think of a collection as a table, with one row for each document. Our address book will have a collection called **addresses**, with one document for each entry.

Mongoose makes it easy to work with documents from JavaScript, and it also adds two useful things:

* A **schema** describes the fields that a document should have, and the type of information in each field. MongoDB will store any document you give it, even if it is missing fields or has fields with the wrong type of information. Mongoose uses the schema to check each document before it is stored.
* A **model** is the object that a program uses to work with a collection. You use the model to add documents to the collection, and to find documents in it. The model sends its commands to the database through the connection.

This is the code that makes the schema and the model for the address book:

```javascript
// The schema describes the information we store about each entry
const addressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true }
});

// The model is the object we use to work with the addresses collection
const AddressBook = mongoose.model("AddressBook", addressSchema, "addresses");
```

The schema says that each entry has two fields, **name** and **address**, which both hold text (a **String**). `required: true` means that Mongoose won't store an entry unless both fields have a value.

`mongoose.model` makes a model called **AddressBook**, which uses the schema and stores its documents in a collection called **addresses** (the third argument). You don't need to create the collection. MongoDB makes it the first time a document is stored in it.

## Step 3: ask what the user wants to do

```javascript
// The terminal object lets the program ask questions and read the answers
const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });

// Step 3: ask what the user wants to do
const choice = await terminal.question("Type a to add an entry or s to search for a name: ");

if (choice === "a") {
    // Step 4: store a new entry
    ...
} else if (choice === "s") {
    // Step 5: search for a name
    ...
} else {
    console.log("Please run the program again and type a or s");
}
```

`readline.createInterface` makes an object that reads from the keyboard (`process.stdin`) and writes to the screen (`process.stdout`). The program calls it `terminal`. `terminal.question` prints a question and waits for the user to type an answer and press **Enter**. Waiting for the user takes time, just like waiting for the database, so the program uses `await`.

The answer is a tiny menu. If the user types **a**, the program does step 4 and adds an entry. If they type **s**, it does step 5 and searches for a name. If they type anything else, the program tells them what it was expecting. Each time you run the program it does one of these things, and then it finishes.

## Step 4: store a new entry

```javascript
const nameInput = await terminal.question("Name to add: ");
const addressInput = await terminal.question("Address: ");

try {
    const entry = await AddressBook.create({ name: nameInput, address: addressInput });
    console.log(`Added ${entry.name} with id ${entry._id}`);
} catch (error) {
    // The schema has found something wrong with the entry
    console.log(`The entry was not stored: ${error.message}`);
}
```

The program asks for the name and the address, and puts the answers in the variables `nameInput` and `addressInput`. Then `AddressBook.create` makes a new document from them. The object `{ name: nameInput, address: addressInput }` says which value goes in which field: the **name** field gets the value in `nameInput`, and the **address** field gets the value in `addressInput`. `AddressBook.create` checks the document against the schema and stores it in the **addresses** collection. It gives back the document that was stored. MongoDB has added a field called **_id**, which holds a value that is different for every document in the collection.

If the document doesn't match the schema, `AddressBook.create` doesn't store it. Instead it **throws an error**, which would normally stop the program. The `try` and `catch` catch the error. If anything inside the `try` part throws an error, the program jumps to the `catch` part, which prints a message that explains what was wrong.

## Step 5: search for a name

```javascript
const searchInput = await terminal.question("Name to search for: ");
const entries = await AddressBook.find({ name: searchInput });

if (entries.length === 0) {
    console.log(`There are no addresses for ${searchInput}`);
}

for (const entry of entries) {
    console.log(`${entry.name}: ${entry.address}`);
}
```

`AddressBook.find` asks the database for all the documents that match a **filter**. A filter is an object that holds the values we are looking for. The filter `{ name: "Rob Miles" }` matches every document with the name **Rob Miles**. The program uses the filter `{ name: searchInput }`, so it finds the documents whose name matches the name the user typed. `find` gives back a list of the documents that match, and the program uses a `for` loop to print the name and address in each one. If the list is empty, the program says so.

## Finish

Whichever thing the program did, it ends by closing the terminal and the connection to the database:

```javascript
// The program won't end while the terminal and the database connection are open
terminal.close();
await db.close();
```

A Node program keeps running as long as it has something open that might send it information, so if we forgot to close these, the program would never finish.

## Run the program

Make sure that **DATABASE_URL** is set to the address of your database, as described at the end of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#5-store-the-database-address-in-an-environment-variable) or [Install Local MongoDB](/doc/04%20Install%20Local%20MongoDB.md#7-store-the-database-address-in-an-environment-variable) howto. Then run the program, type **a** and add an entry:

```bash
node address_book.js
```

```
Connected to the custardcream database on localhost
Type a to add an entry or s to search for a name: a
Name to add: Rob Miles
Address: 1 Main Street, Hull
Added Rob Miles with id 6ae9eaa70adfb38ef0acacc4
```

Your id will be different. If you are using Atlas, you'll see the name of one of the Atlas computers instead of **localhost**. If the name of the database is **test**, the name of the database is missing from the end of the address.

Run the program a few more times to add some more entries. Try adding a second address for the same name. Nothing in the schema says that names must be different, so this is allowed. Each entry has its own id, so the database can tell them apart.

Now run the program again and type **s** to search for a name:

```
Connected to the custardcream database on localhost
Type a to add an entry or s to search for a name: s
Name to search for: Rob Miles
Rob Miles: 1 Main Street, Hull
Rob Miles: The Office, Hull University
```

The program finds all the entries for the name, including the ones you added when you ran it before. The entries are stored in the database, not in the program, so they are still there each time the program runs. You can search for any name that has been added.

The name has to match exactly when you search. If you search for **rob miles** (without capital letters) you'll get the message **There are no addresses for rob miles**.

Now try adding an entry, but press **Enter** without typing an address. The schema says that an address is required, so the entry isn't stored:

```
Type a to add an entry or s to search for a name: a
Name to add: Fred
Address:
The entry was not stored: AddressBook validation failed: address: Path `address` is required.
```

### If it doesn't work

* If the program waits for about 30 seconds and then stops with an error that contains **MongooseServerSelectionError**, it couldn't reach the database. If you are using a database on your Pi, check that MongoDB is running, as described in step 4 of the [Install Local MongoDB](/doc/04%20Install%20Local%20MongoDB.md#4-start-it-and-confirm-its-healthy) howto. If you are using Atlas, check that the address of your home network is in the Network Access list, as described in step 3 of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#3-let-your-pi-connect) howto.
* If you see **Authentication failed** or **bad auth**, check the name and password in the address.

## Look inside the database

You can see the documents that the program has made by logging in to the database:

```bash
docker exec -it mongodb mongosh --username custardCreamApp --authenticationDatabase custardcream custardcream
```

If you are using Atlas, log in with `mongosh "$DATABASE_URL"` instead, as described in step 6 of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#6-check-the-connection) howto.

```javascript
db.addresses.find()
```

You'll see a document for each entry you added. As well as the name and address, each one has the **_id** field that MongoDB added, and a field called **__v**, which Mongoose uses to keep track of changes to a document. Type `exit` to leave.

## Try it yourself

* Add a **phone** field to the schema, and change the program to ask for a phone number and print it. What happens when you search for an entry that was stored before you added the phone field?
* At the moment the menu only works with small letters, so typing **S** doesn't search. Change the program so that capital letters work too. `choice.toLowerCase()` gives you a copy of the answer with any capital letters changed to small ones.
* Change the program so that it keeps showing the menu until you type **q** to quit.
* Add a **d** choice to the menu, which asks for a name and deletes all the entries for it. `AddressBook.deleteMany({ name: nameInput })` deletes all the documents that match a filter.

## One database, many collections

The schema in this program describes one kind of thing, an address book entry, and the model stores those entries in one collection, **addresses**. If you think of a collection as a table, the schema describes the columns of the table, and each document is a row.

A database can hold lots of collections, and each one can hold a different kind of thing. If the address book also needed to remember birthdays, we wouldn't put them in the **addresses** collection. Instead we would make a second schema and a second model, which store their documents in a collection of their own:

```javascript
const birthdaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true }
});

const Birthday = mongoose.model("Birthday", birthdaySchema, "birthdays");
```

The program would use `AddressBook` to work with addresses and `Birthday` to work with birthdays. Both models send their commands through the same connection, to the same database. A program can have as many models as it needs, and the database makes each collection the first time something is stored in it.

That's how all the examples in this series share one database. The address book uses the **addresses** collection, and the picture servers in the next howtos use a collection called **examplepictures**. Each example has its own collection, so they don't get in each other's way. A real application usually has several collections in its database, one for each kind of thing it stores, such as users and pictures.

## What next?

Now that you know how a program can use a database, you can [make a server that stores pictures in the database](/doc/06%20Make%20a%20database%20server.md).

[home](/README.md)
