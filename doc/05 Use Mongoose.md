# Use Mongoose

You now have a MongoDB database running on your Pi. Before we connect it to a web server, let's find out how a JavaScript program can store and find information in it. In this howto we'll make two small programs that you run from the command line. Together they make a very simple address book. One program adds a name and address to the database, and the other one lists the addresses that are stored there.

## What is Mongoose?

MongoDB stores information as **documents**. A document is a collection of named values, called **fields**, which looks a lot like a JavaScript object:

```javascript
{
  name: 'Rob Miles',
  address: '1 Main Street, Hull'
}
```

Documents are grouped together in **collections**. If you've used a spreadsheet, you can think of a collection as a table, with one row for each document. Our address book will have a collection called **addresses**, with one document for each entry.

A JavaScript program can talk to MongoDB using a library called **Mongoose**. Mongoose makes it easy to work with documents from JavaScript, and it also adds some useful features:

* A **schema** describes the fields that a document should have, and the type of information in each field. MongoDB will store any document you give it, even if it is missing fields or has fields with the wrong type of information. Mongoose uses the schema to check each document before it is stored.
* A **model** is the object that a program uses to work with a collection. You use the model to add documents to the collection, and to find documents in it.

## Install Mongoose

Mongoose is a library, so you add it to a Node project with npm, in the same way as Express. Let's make a project for the address book:

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

If you give someone a copy of your project without the **node_modules** folder, they can run `npm install` to get all the libraries that **package.json** lists. That's how the example projects in this repository work. The finished address book programs are in the **code/address_book** folder, so you can install the libraries for them like this:

```bash
cd code/address_book
npm install
```

## Describe an address book entry

Both programs need to know what an address book entry looks like, so the schema and model are in a file of their own, called **address.js**:

```javascript
const mongoose = require("mongoose");

// The schema describes the information we store about each entry
const addressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true }
});

// The third argument is the name of the collection in the database
module.exports = mongoose.model("Address", addressSchema, "addresses");
```

The schema says that each entry has two fields, **name** and **address**, which both hold text (a **String**). `required: true` means that Mongoose won't store an entry unless both fields have a value.

`mongoose.model` makes a model called **Address**, which uses the schema and stores its documents in a collection called **addresses**. Setting `module.exports` makes the model available to other files. A program gets the model by using `require` with the name of the file:

```javascript
const Address = require("./address");
```

The **./** at the start tells Node to look for the file **address.js** in the same folder as the program, rather than in **node_modules**.

## Add an address

This is the program **add_address.js**:

```javascript
async function addAddress(name, address) {
    await mongoose.connect(databaseUrl);

    const entry = await Address.create({ name, address });
    console.log(`Added ${entry.name} with id ${entry._id}`);

    // The program won't end while it is still connected to the database
    await mongoose.disconnect();
}
```

The `addAddress` function does three things:

1. `mongoose.connect` connects the program to the database.
2. `Address.create` makes a new document from the name and address, checks it against the schema and stores it in the **addresses** collection. It gives back the document that was stored. MongoDB has added a field called **_id**, which holds a value that is different for every document in the collection.
3. `mongoose.disconnect` closes the connection to the database. A Node program keeps running as long as it has a connection open, so if we forgot this, the program would never finish.

Each of these steps sends a message to the database and has to wait for a reply. This takes time, so the function is marked as `async`, and uses `await` to wait for each reply before it moves on.

The rest of the program gets everything ready and then calls the function:

```javascript
const name = process.argv[2];
const address = process.argv[3];

if (!name || !address) {
    console.log('Use this program like this: node add_address.js "name" "address"');
    process.exit(1);
}

addAddress(name, address);
```

`process.argv` holds the words that were typed on the command line to run the program. `process.argv[0]` is **node** and `process.argv[1]` is the name of the program, so the name and address are in `process.argv[2]` and `process.argv[3]`. If either of them is missing, the program explains how to use it and stops.

The program gets the address of the database from the **DATABASE_URL** environment variable, in the same way that the web servers will. It also checks that this has been set before it does anything else.

## Run the program

Make sure that **DATABASE_URL** is set to the address of your database, as described at the end of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#5-store-the-database-address-in-an-environment-variable) or [Install Local MongoDB](/doc/04%20Install%20Local%20MongoDB.md#7-store-the-database-address-in-an-environment-variable) howto. Then add some addresses. Put quotes around the name and the address, so that each one is treated as a single item, even though it contains spaces:

```bash
node add_address.js "Rob Miles" "1 Main Street, Hull"
node add_address.js "Jane Smith" "22 Acacia Avenue, York"
node add_address.js "Rob Miles" "The Office, Hull University"
```

```
Added Rob Miles with id 6ae9eaa70adfb38ef0acacc4
Added Jane Smith with id 6ae9eaa74cbac64c3892f1fe
Added Rob Miles with id 6ae9eaa82cfe63f3865ebabc
```

If the program waits for about 30 seconds and then stops with an error that contains **MongooseServerSelectionError**, it couldn't reach the database. If you are using a database on your Pi, check that MongoDB is running, as described in step 4 of the [Install Local MongoDB](/doc/04%20Install%20Local%20MongoDB.md#4-start-it-and-confirm-its-healthy) howto. If you are using Atlas, check that the address of your home network is in the Network Access list, as described in step 3 of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#3-let-your-pi-connect) howto.

Your ids will be different. Notice that Rob Miles is in the address book twice, with two different addresses. Nothing in the schema says that names must be different, so this is allowed. Each entry has its own id, so the database can tell them apart.

## List the addresses

This is the function in **list_addresses.js** that finds and prints the addresses:

```javascript
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
```

`Address.find` asks the database for all the documents that match a **filter**. A filter is an object that holds the values we are looking for. The filter `{ name: "Rob Miles" }` matches every document with the name **Rob Miles**. The empty filter `{}` doesn't ask for anything in particular, so it matches every document in the collection.

`.sort({ name: 1 })` asks the database to sort the documents into order by name. The 1 means smallest first, so the names are in alphabetical order. If you use -1, they are sorted the other way.

`find` gives back a list of documents, and the program uses a `for` loop to print the name and address in each one.

The program calls the function with whatever was typed after the program name:

```javascript
listAddresses(process.argv[2]);
```

If nothing was typed, `process.argv[2]` is `undefined`, the function uses the empty filter and every address is listed:

```bash
node list_addresses.js
```

```
Jane Smith: 22 Acacia Avenue, York
Rob Miles: 1 Main Street, Hull
Rob Miles: The Office, Hull University
```

If you give a name, you only get the addresses for that name:

```bash
node list_addresses.js "Rob Miles"
```

```
Rob Miles: 1 Main Street, Hull
Rob Miles: The Office, Hull University
```

The name has to match exactly. If you search for **rob miles** (without capital letters) you'll get the message **No addresses found**.

## Look inside the database

You can see the documents that the programs have made by logging in to the database:

```bash
docker exec -it mongodb mongosh --username custardCreamApp --authenticationDatabase custardcream custardcream
```

If you are using Atlas, log in with `mongosh "$DATABASE_URL"` instead, as described in step 6 of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#6-check-the-connection) howto.

```javascript
db.addresses.find()
```

You'll see the three documents. As well as the name and address, each one has the **_id** field that MongoDB added, and a field called **__v**, which Mongoose uses to keep track of changes to a document. Type `exit` to leave.

The programs use the same database as all the other examples in this series. Each example uses its own collection, so they don't get in each other's way.

## Try it yourself

* Add a **phone** field to the schema in **address.js**, and change the programs to store and print phone numbers. What happens when you list the addresses that were stored before you added the phone field?
* Write a program called **delete_address.js** that deletes all the entries for a name. `Address.deleteMany({ name: name })` deletes all the documents that match a filter.

## What next?

Now that you know how a program can use a database, you can [make a server that stores pictures in the database](/doc/06%20Make%20a%20database%20server.md).

[home](/README.md)
