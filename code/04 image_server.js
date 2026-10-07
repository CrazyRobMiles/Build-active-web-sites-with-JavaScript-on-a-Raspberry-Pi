const express = require("express");
const fs = require("fs");

const app = express();

const imageMiddleware = express.raw({
    type: "image/jpeg",
    limit: "20mb"
});

app.use('/upload', imageMiddleware);

app.post("/upload", (req, res) => {
    fs.writeFileSync("picture.jpg", req.body);
    res.send("Picture received");
    console.log("Image saved");
});

app.get('/view', (req, res) => {
    res.send(`
        <html>
            <body>
                <img src="/picture">
            </body>
        </html>
    `);
});

app.get('/picture', (req, res) => {
    const picture = fs.readFileSync('picture.jpg');
    res.type('jpg');
    res.send(picture);
});

const port=3000
app.listen(port);