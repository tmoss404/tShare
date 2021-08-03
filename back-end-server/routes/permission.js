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
    app.post("/permission/accept", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.acceptRequest(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/deny", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.denyRequest(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/list-pending", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.listPending(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
