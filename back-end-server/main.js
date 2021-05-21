const express = require("express");
const routes = require("./routes");
const appConstants = require("./config/app_constants");

var app = express();

routes.init(app);
app.listen(appConstants.serverPort, () => {
    console.log("The server has started listening on port " + appConstants.serverPort + ".");
});
