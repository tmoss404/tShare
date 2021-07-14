const utilModel = require("../models/utility");

module.exports.setupRoutes = function(app) {
    app.post("/utility/log", (req, res) => {
        utilModel.logError(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
