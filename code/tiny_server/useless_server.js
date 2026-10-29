// A Useless server
// It will receive incoming requests but ignores them
// It will run forever - use CTRL+C to stop it

const express = require('express');
const app = express();

const port = 3000; 

app.listen(port);
