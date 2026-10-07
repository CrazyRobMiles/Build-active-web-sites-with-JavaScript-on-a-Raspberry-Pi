# 02 Make a tiny server

When you install node.js you also get the Node Package Manager (npm) which looks after the separate components in a solution and provides access to the npm package registry. 

## Make a folder

The first thing you do when making a new package is create a folder to put it in. We are going to make a tiny server, so lets make a folder with that name:

```
mkdir tiny_server
cd tiny_server
```

![Screenshot of making a tiny_server folder and then navigating into this folder](/images/Tiny%20server%2001%20Make%20folder.png)

## Make a project

 Now that we have our shiny new folder, the first thing we do is initialise a new project in it:

```
npm init -y
```

This command runs the npm program and gives it the command **init** with the option **-y**. This means "initialise a package and answer yes to every question" (we can use all the npm defaults for this exercise)

![Screenshot of npm making a new package.json file](/images/Tiny%20server%2002%20Make%20package.png)

The npm program creates a file called **package.json**. This is a file of structured data which describes the solution that we are making. It gives the name, the version, space for a description, the main source file of the application (which is not frequently used), keywords you can use to tag the application, space for the author name, licence and the type of the application. We don't need to worry about the contents of this file, but we do need to remember that the file is central to the management of the application. However, we don't actually need to edit the contents of the file, this editing is performed by npm. 

# Express Exercises

Use these exercises to understand how an Express site works and inform your exploration of the server. 

## 1. Tiny Server

The tiny server doesn't actually serve out a page, but it does show how to get started with node and express. On a Raspberry Pi/Linux system, the  process is:

1. Install Node.js and npm:

    ```
   sudo apt update
   sudo apt install nodejs npm
    ```
2. Create a project and initialise it:

    ```
   mkdir myapp
   cd myapp
   npm init -y
    ```
3. Install Express:

    ```
   npm install express
    ```

4. Create app.js:

    ```
   const express = require('express');
   const app = express();
   
   app.listen(3000);
    ```

5. Run it:

    ```
   node app.js
    ```

This gives you an empty Express server listening on port 3000. If you browse to it with your browser (localhost:3000) you won't see anything. But you won't get an error either. 
#