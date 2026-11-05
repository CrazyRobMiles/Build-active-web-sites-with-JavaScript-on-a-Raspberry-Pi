# Build Active Web Sites with JavaScript

This repository contains resources for a series of articles in Raspberry Pi Magazine. They were written as a follow on from the [Custard Cream Camera](https://github.com/CrazyRobMiles/custard-cream-camera) and [Custard Cream Server](https://github.com/CrazyRobMiles/custard-cream-server) applications in [issue 170](https://magazine.raspberrypi.com/issues/170) and [issue 171](https://magazine.raspberrypi.com/issues/171) respectively. 

## 1 - Image Storage

* Start by installing JavaScript and node by following the steps [here](/doc/01%20Install%20Node.md)
* Then make your first tiny server by following the steps [here](/doc/02%20Make%20a%20tiny%20server%20application.md)

The **code** folder contains **tiny_server** which holds the example server programs. It also contains the **python** folder which holds the **image_upload** program and the sample duck image. 

## 2 - Databases

We are going to use the MongoDB database which is a bit like a web server, but rather than responding to requests for web pages, it responds to database commands. The database application is accessed via a **connection string**. The connection string is super-important. It contains the network address of the server and credentials to access the database on it. The connection string acts as the "key" to the database. If you have that key, you can send the database commands to read, write and delete database entries. 

We don't want to embed this in our program code so we create an environment variable on the host computer and then use this in our code. We call the environment variable **DATABASE_URL**. As far as the software is concerned, that address *is* the database. Where the database is running makes no difference to how the programs work, so you can choose whichever kind of database suits your Pi. Do one of these:

* **If you have a Raspberry Pi 4 or older, or you don't want to run the database yourself**, use MongoDB Atlas, which runs the database on the internet for you. The free version is plenty for this series. To connect to Atlas follow the steps [here](/doc/03%20Connect%20to%20MongoDB%20Atlas.md)
* **If you have a Raspberry Pi 5** (ideally with an SSD), you can run MongoDB on the Pi itself, inside a Docker container. To install Docker and MongoDB follow the steps [here](/doc/04%20Install%20Local%20MongoDB.md)

Current versions of MongoDB need an ARMv8.2-A processor, which means a Pi 5. They won't run on a Pi 4 or older, but those models can run all the example programs perfectly well with Atlas. Each howto ends with a connection string for your database. From then on the rest of the series is exactly the same:

* Then store the connection string in the **DATABASE_URL** environment variable and find out how a JavaScript program uses the database with Mongoose by following the steps [here](/doc/05%20Use%20Mongoose.md)
* Then make a server that stores pictures in the database by following the steps [here](/doc/06%20Make%20a%20database%20server.md)
* Then add a view counter to each picture by following the steps [here](/doc/07%20Update%20a%20database.md)
* Then use Express to organise the site and EJS to render its pages by following the steps [here](/doc/08%20Use%20EJS%20to%20render%20pages.md)
* Finally, make a web app that shows everything in the database by following the steps [here](/doc/09%20Make%20a%20database%20browser.md)

The **code** folder contains **address_book**, which holds **address_demo**, a tiny program that stores one entry in the database and then finds it, and a command line program that uses Mongoose to connect to the database, store a name and address, and search for a name. It also contains **tiny_db_server** which holds the **db_image_server** program. This stores each picture it receives under a three word name, in the same way as the Custard Cream Server. It also holds **db_counter_server**, which adds a view counter to each picture. The **express_server** folder holds the same picture server organised as a proper Express application, with pages made from templates. All these servers use the same database, and store their picture files in the **code/pictures** folder. The **db_browser** folder holds a tiny web app, a bit like MongoDB Compass, that shows the collections and documents in the database. The **python** folder contains **db_image_upload**, which uploads the duck picture to a server and prints the name it was given. 

Have fun!

Rob Miles