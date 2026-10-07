// time and dice server

const express = require('express');
const app = express();

const port = 3000;

app.get('/time', (req, res) => {

     console.log("Received time request");
     
    const time = new Date().toString();
    

    res.send(`
        <h1>Tiny Time Server</h1>
        <p>The time is ${time}</p>
    `);
});

app.get('/dice', (req, res) => {
    console.log("Received dice request");

    const roll = Math.floor(Math.random() * 6) + 1;

    res.send(`
        <h1>Dice Server</h1>
        <p>You rolled a ${roll}</p>
    `);
});

app.listen(port);
