// Functions that turn documents into text that can be shown on a page

// The whole document, laid out with one field on each line
function showDocument(document) {
    return JSON.stringify(document, null, 2);
}

// A short line of text that shows the start of a document, without its id
function summarise(document, length = 100) {
    const { _id, ...fields } = document;
    const text = JSON.stringify(fields);
    if (text.length <= length) {
        return text;
    }
    return text.slice(0, length) + "...";
}

module.exports = { showDocument, summarise };
