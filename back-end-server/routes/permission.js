const permissionModel = require("../models/permission");
const routes = require("../routes");
const accountMiddleware = require("../models/accountMiddleware");

module.exports.setupRoutes = function(app) {
    app.post("/permission/request", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.requestPermission(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
