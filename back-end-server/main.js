// Require statements:
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const appConstants = require("./config/appConstants");
const database = require("./config/database");

var app = express();

// Middleware:
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("forceSSLOptions", {
    httpsPort: appConstants.serverPort
});

// Setting up various systems:
database.init();
routes.init(app);

app.listen(appConstants.serverPort, () => {
    console.log("The server has started listening on port " + appConstants.serverPort + ".");
});
