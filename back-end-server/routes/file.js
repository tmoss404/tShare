const fileModel = require("../models/file");
const routes = require("../routes");

module.exports.setupRoutes = function(app) {
    app.post("/file/upload", (req, res) => {
        fileModel.getSignedUrl(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
