// Settings used by the different parts of the browser

module.exports = {
    // A different port from the picture servers, so they can run at the same time
    port: 3001,
    // Only accept connections from this Pi, because the browser shows everything in the database
    host: "127.0.0.1",
    databaseUrl: process.env.DATABASE_URL,
    // The number of documents shown on each page of a collection
    pageSize: 20
};
