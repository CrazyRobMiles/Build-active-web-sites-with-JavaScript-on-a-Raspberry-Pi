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

You can look at your database on the Atlas website at any time. Go to your cluster and select **Browse Collections** to see the collections and documents in it. It will be empty until a program stores something in it.

You now have a database, and a connection string that a program can use to reach it. Keep a copy of the connection string somewhere safe, because it contains your password. In the next howto you'll store it on your Pi, check that it works, and find out how a JavaScript program can [use Mongoose to store information in the database](/doc/05%20Use%20Mongoose.md).

[home](/README.md)
