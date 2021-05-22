const testRoutes = require("./routes/tests");
const accountRoutes = require("./routes/account");

module.exports.init = function(app) {
    testRoutes.setupRoutes(app);
    accountRoutes.setupRoutes(app);
    app.all("*", (req, res) => {
        res.send("The requested API route could not be found.");
    });
};
