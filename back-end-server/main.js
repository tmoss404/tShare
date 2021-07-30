// Require statements:
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const appConstants = require("./config/appConstants");
const database = require("./config/database");
const permissionUtil = require("./models/permissionUtil");

var app = express();

// Middleware:
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setting up various systems:
database.init();
permissionUtil.init();
routes.init(app);

function handleShutdown() {
    console.log("Shutting down...");
    database.connectionPool.end((err) => {
        process.exit(err ? -1 : 0);
    });
}
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
app.listen(appConstants.serverPort, () => {
    console.log("The server has started listening on port " + appConstants.serverPort + ".");
});
