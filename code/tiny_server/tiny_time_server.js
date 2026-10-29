// A slightly more useful server
// It returns the current time as text

const express = require('express');
const app = express();

const port = 3000;

app.get('/', (req, res) => {

     console.log("Received time request");
     
    const time = new Date().toString();
    

    res.send(`
        <h1>Tiny Time Server</h1>
        <p>The time is ${time}</p>
    `);
});

app.listen(port);
