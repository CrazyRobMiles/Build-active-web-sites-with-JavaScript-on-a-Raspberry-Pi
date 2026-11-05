// Makes the three word names that pictures are stored under

const words = require("../wordlist.json");
const Picture = require("../schemas/picture");

function randomPhrase() {
    const pick = () => words[Math.floor(Math.random() * words.length)];
    return [pick(), pick(), pick()].join("-");
}

// Keep picking phrases until we find one that isn't in the database
async function makeUniquePhrase() {
    for (let attempt = 0; attempt < 10; attempt++) {
        const phrase = randomPhrase();
        const existing = await Picture.findOne({ phrase: phrase });
        if (existing === null) {
            return phrase;
        }
    }
    throw new Error("Could not find a free three word phrase");
}

module.exports = makeUniquePhrase;
