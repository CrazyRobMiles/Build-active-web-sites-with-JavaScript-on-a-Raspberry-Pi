# Connect to MongoDB Atlas

The example programs in this series store their information in a MongoDB database. A program finds the database by using an **address**, which MongoDB calls a **connection string**. The address says where the database is, and gives the name and password of the account the program logs in with. As far as the programs are concerned, the address *is* the database. They work in exactly the same way whether the database is running on your Pi, on another computer in your house, or on the other side of the world.

This means that you have two ways to get a database for the examples:

* **Use MongoDB Atlas.** Atlas is a service run by the makers of MongoDB, which runs databases on the internet for you. There's a free version which is easily big enough for everything in this series. Atlas works with any Pi that can run Node, and the Pi doesn't need an SSD. This is the best route for a Raspberry Pi 4 or an older model, because the current version of MongoDB won't run on them. This howto shows you how to set it up.
* **Install MongoDB on your Pi.** This needs a Raspberry Pi 5, and works best with an SSD to store the data. It is described in the [Install Local MongoDB](/doc/04%20Install%20Local%20MongoDB.md) howto.

You only need to do one of them. Once you have the address of your database, the rest of the series works in exactly the same way.

## What you need to know about Atlas

* **Your Pi needs to be connected to the internet** whenever the programs are running, because each time a program uses the database it sends a message over the internet. That makes each request a little slower than a database on the Pi, but you won't notice it with these examples.
* **The free version has a limit of 512 MB of storage.** That's plenty, because only the documents are stored in the database. The picture files themselves stay on your Pi, in the **pictures** folder.
* **Your information is stored on someone else's computer.** For the examples in this series that doesn't matter, but think about it before you store anything private.
* **The Atlas website changes from time to time.** The buttons and menus you see might have slightly different names from the ones described here, but the steps will be the same.

### 1. Create an Atlas account and a free cluster

Go to the MongoDB Atlas website at **https://www.mongodb.com/cloud/atlas/register** and create an account. Once you are logged in, Atlas will ask you to create a **cluster**. A cluster is a MongoDB server running on the internet. Atlas actually runs three copies of each database on different computers, so that your data is safe even if one of them breaks.

Choose the **Free** option. You can also choose which company's computers it runs on (AWS, Google Cloud or Azure) and where they are. It doesn't really matter which company you choose, but pick a region that's close to you, so that messages don't have far to travel. You can leave the name of the cluster as **Cluster0**. It takes a few minutes for Atlas to make the cluster.

### 2. Create a database user

In the same way as a database on your Pi, an Atlas database has its own user accounts. Each program that connects to the database has to log in as one of them. The account you use to log in to the Atlas website can't be used by a program to connect to the database.

Atlas might ask you to create a database user while it makes your cluster. If it doesn't, find **Database Access** in the menu and select **Add New Database User**:

* Use **custardCreamApp** for the username. The examples follow on from the Custard Cream Server, so the database and its account are named after it.
* Choose password authentication. Atlas can make a strong password for you. Keep a copy of the password somewhere safe (such as a password manager), because you'll need it in a moment.
* The simplest privilege to give the user is **Read and write to any database**. If you'd like the account to only be able to use the database for this series, choose **Specific Privileges** instead and give it the **readWrite** role on a database called **custardcream**.

You don't need to create the **custardcream** database itself. MongoDB creates a database the first time something is stored in it.

### 3. Let your Pi connect

Atlas won't accept a connection from just anywhere. It keeps a list of the internet addresses that are allowed to connect, and refuses every other connection, even one with the right password. You need to add the address of your home network to the list.

Find **Network Access** in the menu, select **Add IP Address** and then **Add Current IP Address**. Do this using a browser on a computer that is on the same network as your Pi. Everything on your home network shares the same internet address, so this lets the Pi in too.

Things worth noting:

* Your internet provider might change your home's internet address from time to time. If your programs suddenly can't connect to Atlas, the first thing to check is whether your current address is on the list.
* There's an option to allow access from anywhere (written as **0.0.0.0/0**). This saves you from having to update the list, but then only the password is protecting your database. It's best not to use it.

### 4. Get the connection string

Go back to your cluster and select **Connect**, then **Drivers**. Choose **Node.js**. Atlas shows a connection string that looks something like this:

```
mongodb+srv://custardCreamApp:<db_password>@cluster0.ab1cd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

Your string will have a different name after **cluster0.**, because each cluster has its own name. You need to make two changes to the string:

1. Replace `<db_password>` (including the `<` and `>`) with the password of the custardCreamApp user. If your password contains any of the characters `@ : / ? # [ ] %` you'll need to replace them with codes in the address. For example, `@` becomes `%40`. Passwords that Atlas makes for you don't use any of these characters.
2. Add the name of the database, **custardcream**, between the `/` and the `?`. If you leave it out, the programs will use a database called **test** instead.

So the finished string looks like this:

```
mongodb+srv://custardCreamApp:<password>@cluster0.ab1cd.mongodb.net/custardcream?retryWrites=true&w=majority&appName=Cluster0
```

The **+srv** part tells the program to look up the addresses of the three computers that run the cluster, using the name of the cluster. The settings after the `?` tell the program how to work with the three copies of the database. You don't need to change them.

Compare this with the address of a database running on your Pi:

```
mongodb://custardCreamApp:<password>@localhost:27017/custardcream
```

Both addresses contain the name of the account, its password, where the database is and the name of the database. That's all a program needs to know.

### 5. Store the database address in an environment variable

All the example programs in this series get the address from an **environment variable** called `DATABASE_URL`. An environment variable is a named value that the terminal passes to every program you start from it. Keeping the address there, rather than in the programs, means that you can share a program without sharing your password. It also means that you can move to a different database without changing the programs at all. You just change the address.

To set the variable in the terminal you are using, enter this, using your own connection string:

```bash
export DATABASE_URL='mongodb+srv://custardCreamApp:<password>@cluster0.ab1cd.mongodb.net/custardcream?retryWrites=true&w=majority&appName=Cluster0'
```

The single quotes stop the terminal from doing anything with the special characters in the address, such as the `&` characters. You can check the value like this:

```bash
echo $DATABASE_URL
```

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
- Only programs started from your terminals get the variable. A program that is started in some other way, for example by the Pi when it boots, doesn't read `.bashrc`, so it has to be given the address in its own settings.

### 6. Check the connection

The **MongoDB Shell**, `mongosh`, is a program that lets you type commands to a database. Later howtos use it to look inside the database. You can install it on your Pi with npm:

```bash
npm install -g mongosh
```

The `-g` means that the program is installed for the whole Pi, rather than into a project, so you can use it from any folder. Now connect to your database using the address in the environment variable:

```bash
mongosh "$DATABASE_URL"
```

After some messages, you should see a prompt that ends with `custardcream>`. This shows that you have logged in, and that you are using the **custardcream** database. Try storing, finding and deleting a document:

```javascript
db.connectionCheck.insertOne({ checkedAt: new Date() })
db.connectionCheck.find()
db.connectionCheck.drop()
exit
```

`insertOne` returns `acknowledged: true`, `find` shows the document you just stored, and `drop` returns `true`. So the program can write, read and delete.

If it doesn't work:

* If the prompt ends with `test>` instead of `custardcream>`, the name of the database is missing from the address (see step 4).
* If you see `bad auth` or `Authentication failed`, check the username and password in the address.
* If `mongosh` waits for a while and then reports that it couldn't connect, check that the address of your home network is in the Network Access list (step 3).

You can also look at your database on the Atlas website. Go to your cluster and select **Browse Collections** to see the collections and documents in it.

Now that you have a database, you can find out how a JavaScript program can [use Mongoose to store information in it](/doc/05%20Use%20Mongoose.md).

[home](/README.md)
