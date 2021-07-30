const testRoutes = require("./routes/tests");
const accountRoutes = require("./routes/account");
const fileRoutes = require("./routes/file");
const utilRoutes = require("./routes/utility");
const favoritesRoutes = require("./routes/favorite");
const permissionRoutes = require("./routes/permission");

module.exports.init = function(app) {
    testRoutes.setupRoutes(app);
    accountRoutes.setupRoutes(app);
    fileRoutes.setupRoutes(app);
    utilRoutes.setupRoutes(app);
    favoritesRoutes.setupRoutes(app);
    permissionRoutes.setupRoutes(app);
    app.all("*", (req, res) => {
        res.send("The requested API route could not be found.");
    });
};
module.exports.sendResponse = function(res, message) {
    if (message.connectionToDrop) {
        message.connectionToDrop.release();
        delete message.connectionToDrop;
    }
    message = JSON.parse(JSON.stringify(message));  // So that we are not modifying the commonErrors error messages.
    var response = res.status(message.httpStatus);
    delete message.httpStatus;
    response.send(message);
};
