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
   
   app.listen(3000, () => {
       console.log('Server running on port 3000');
   });
    ```

5. Run it:

    ```
   node app.js
    ```

This gives you an empty Express server listening on port 3000. If you browse to it with your browser (localhost:3000) you won't see anything. But you won't get an error either. 
#