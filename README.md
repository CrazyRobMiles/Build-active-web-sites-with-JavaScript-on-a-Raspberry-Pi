# Build Active Web Sites with JavaScript

This repository contains resources for a series of articles in Raspberry Pi Magazine. They were written as a follow on from the [Custard Cream Camera](https://github.com/CrazyRobMiles/custard-cream-camera) and [Custard Cream Server](https://github.com/CrazyRobMiles/custard-cream-server) applications in [issue 170](https://magazine.raspberrypi.com/issues/170) and [issue 171](https://magazine.raspberrypi.com/issues/171) respectively. 

## 1 - Image Storage

* Start by installing JavaScript and node by following the steps [here](/doc/01%20Install%20Node.md)
* Then make your first tiny server by following the steps [here](/doc/02%20Make%20a%20tiny%20server%20application.md)

The **code** folder contains **tiny_server** which holds the example server programs. It also contains the **python** folder which holds the **image_upload** program and the sample duck image. 

## 2 - Databases

We are going to use the MongoDB database manager, running inside a Docker container. 

* To install Docker follow the steps [here](/doc/03%20Install%20Docker.md)
* To install MongoDB follow the steps [here](/doc/04%20Install%20MongoDB.md)
* Then find out how a JavaScript program uses the database with Mongoose by following the steps [here](/doc/05%20Use%20Mongoose.md)
* Then make a server that stores pictures in the database by following the steps [here](/doc/06%20Make%20a%20database%20server.md)
* Then add a view counter to each picture by following the steps [here](/doc/07%20Update%20a%20database.md)
* Finally, use Express to organise the site and render its pages by following the steps [here](/doc/08%20Use%20Express%20to%20render%20pages.md)

The **code** folder contains **address_book**, which holds two command line programs that use Mongoose to store and list names and addresses. It also contains **tiny_db_server** which holds the **db_image_server** program. This stores each picture it receives under a three word name, in the same way as the Custard Cream Server. It also holds **db_counter_server**, which adds a view counter to each picture. The **express_server** folder holds the same picture server organised as a proper Express application, with pages made from templates. All these servers use the same database, and store their picture files in the **code/pictures** folder. The **python** folder contains **db_image_upload**, which uploads the duck picture to a server and prints the name it was given. 

Have fun!

Rob Miles