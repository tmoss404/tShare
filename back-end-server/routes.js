const testRoutes = require("./routes/tests");
const accountRoutes = require("./routes/account");
const fileRoutes = require("./routes/file");

module.exports.init = function(app) {
    testRoutes.setupRoutes(app);
    accountRoutes.setupRoutes(app);
    fileRoutes.setupRoutes(app);
    app.all("*", (req, res) => {
        res.send("The requested API route could not be found.");
    });
};
module.exports.sendResponse = function(res, message) {
    var response = res.status(message.httpStatus);
    delete message.httpStatus;
    response.send(message);
};
