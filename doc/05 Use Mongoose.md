# Use Mongoose

You now have a MongoDB database, either on your Pi or on Atlas. Before we connect it to a web server, let's find out how a JavaScript program can store and find information in it. In this howto we'll make a very simple address book program that you run from the command line. It connects to the database and asks what you want to do. You can add a name and address to the address book, or search for a name and see the addresses that are stored for it.

## Store the connection string

At the end of the last howto you had a **connection string** for your database. It looks like one of these:

```
mongodb+srv://custardCreamApp:<password>@cluster0.ab1cd.mongodb.net/custardcream?retryWrites=true&w=majority&appName=Cluster0
mongodb://custardCreamApp:<password>@localhost:27017/custardcream
```

The connection string is the most important thing you need to use the database. It says where the database is, which database to use, and the name and password of the account to log in with. As far as a program is concerned, the connection string *is* the database. The program works in exactly the same way whether the string points at Atlas or at your Pi. And anyone who has the string can read, change and delete everything in the database.

That means the connection string shouldn't be written into the program code. If it were, anyone you gave a copy of the program to (or anyone who saw it on GitHub) would have your password. And if you wanted to move to a different database, you'd have to change every program that uses it.

Instead, we store the connection string in an **environment variable** on the Pi. An environment variable is a named value that the terminal passes to every program you start from it. All the example programs in this series get the connection string from an environment variable called **DATABASE_URL**. The programs only contain the name of the variable, not the string itself. To move to a different database, you just change the variable.

To set the variable in the terminal you are using, enter this, using your own connection string:

```bash
export DATABASE_URL='mongodb+srv://custardCreamApp:<password>@cluster0.ab1cd.mongodb.net/custardcream?retryWrites=true&w=majority&appName=Cluster0'
```

The single quotes stop the terminal from doing anything with the special characters in the string, such as the `&` characters. You can check the value like this:

```bash
echo $DATABASE_URL
```

Make sure you include the word `export`. It tells the terminal to pass the variable to the programs you start. Without it, `echo` still shows the value, but your programs can't see it.

This only lasts until you close the terminal. When you open a new one (or log in to the Pi again), the variable has gone. To have it set every time you open a terminal, add the same `export` line to the end of the file `.bashrc` in your home folder. The terminal runs the commands in this file each time it starts:

```bash
nano ~/.bashrc
```

Add the `export` line at the very end of the file, then save it and exit. The change takes effect in new terminals. To use it in the current terminal straight away, enter:

```bash
source ~/.bashrc
```

Things worth noting:

- `.bashrc` now contains your database password as plain text. Make sure that only you can read the file with `chmod 600 ~/.bashrc`.
- Only programs started from your terminals get the variable. A program that is started in some other way, for example by the Pi when it boots, doesn't read `.bashrc`, so it has to be given the connection string in its own settings.

## Check the connection string

Before we use the connection string in a program, it's worth checking that it works. Then if something goes wrong later, you know the problem is in the program, not the connection string.

The **MongoDB Shell**, `mongosh`, is a program that lets you type commands to a database. Later howtos use it to look inside the database. You can install it on your Pi with npm:

```bash
npm install -g mongosh
```

The `-g` means that the program is installed for the whole Pi, rather than into a project, so you can use it from any folder. Now connect to your database using the connection string in the environment variable:

```bash
mongosh "$DATABASE_URL"
```

This works with any MongoDB database, wherever it is running, because everything `mongosh` needs to know is in the connection string. After some messages, you should see a prompt that ends with `custardcream>`. This shows that you have logged in, and that you are using the **custardcream** database. Try storing, finding and deleting a document:

```javascript
db.connectionCheck.insertOne({ checkedAt: new Date() })
db.connectionCheck.find()
db.connectionCheck.drop()
exit
```

`insertOne` returns `acknowledged: true`, `find` shows the document you just stored, and `drop` returns `true`. So a program that uses this connection string can write, read and delete.

If it doesn't work:

* If `mongosh` says that the address is invalid, check that **DATABASE_URL** is set with `echo $DATABASE_URL`.
* If the prompt ends with `test>` instead of `custardcream>`, the name of the database is missing from the end of the connection string.
* If you see `bad auth` or `Authentication failed`, check the username and password in the connection string.
* If `mongosh` waits for a while and then reports that it couldn't connect, it can't reach the database. If you are using Atlas, check that the address of your home network is in the Network Access list. If MongoDB is running on your Pi, check that it is running with `docker ps`.

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

If you give someone a copy of your project without the **node_modules** folder, they can run `npm install` to get all the libraries that **package.json** lists. That's how the example projects in this repository work. The finished programs for this howto are in the **code/address_book** folder, so you can install the libraries for them like this:

```bash
cd code/address_book
npm install
```

## A first example

Before we make the address book, let's look at the smallest program that stores something in the database and then finds it again. It is in the file **address_demo.js**:

```javascript
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
```

The program does four things:

1. It connects to the database whose connection string is in **DATABASE_URL**.
2. It describes what an address book entry looks like: a name and an address, which are both strings.
3. It stores an entry with the name **Rob** and the address **Hull**.
4. It finds all the entries with the name **Rob**, and prints each one.

Then it closes the connection, so that the program can finish. Run it:

```bash
node address_demo.js
```

```
Connected to the custardcream database
Added Rob with id 6aec5bb673eb5a42bd577ae8
Found Rob: Hull
```

Your id will be different. Run the program again and you'll see that it finds two entries for **Rob**. Each time the program runs it stores another entry, and the entries from earlier runs are still in the database.

That's all a program needs to do to use a database. But a program that can only store **Rob** isn't very useful. The address book program uses exactly the same steps, but asks the user what to store and what to look for. We'll work through it step by step, and look at each part in more detail.

## The address book program

The address book program is in the file **address_book.js**. This is how it starts:

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

Make sure that **DATABASE_URL** is set to the address of your database, as described in [Store the connection string](#store-the-connection-string). Then run the program, type **a** and add an entry:

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

* If the program says **Set DATABASE_URL to the address of your database first**, but `echo $DATABASE_URL` shows the connection string, you've left out the word `export` when you set the variable. Without `export`, the terminal keeps the variable to itself and doesn't pass it to the programs it starts. Set it again with `export` at the start of the line, and check the line in your `.bashrc` file too.
* If the program waits for about 30 seconds and then stops with an error that contains **MongooseServerSelectionError**, it couldn't reach the database. If you are using a database on your Pi, check that MongoDB is running, as described in step 4 of the [Install Local MongoDB](/doc/04%20Install%20Local%20MongoDB.md#4-start-it-and-confirm-its-healthy) howto. If you are using Atlas, check that the address of your home network is in the Network Access list, as described in step 3 of the [Connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md#3-let-your-pi-connect) howto.
* If you see **Authentication failed** or **bad auth**, check the name and password in the connection string.

## Look inside the database

You can see the documents that the program has made by logging in to the database:

```bash
docker exec -it mongodb mongosh --username custardCreamApp --authenticationDatabase custardcream custardcream
```

If you are using Atlas, log in with `mongosh "$DATABASE_URL"` instead, as described in [Check the connection string](#check-the-connection-string).

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
