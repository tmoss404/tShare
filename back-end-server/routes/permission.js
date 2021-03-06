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
        permissionModel.acceptOrDenyRequest(req.body, true).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/deny", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.acceptOrDenyRequest(req.body, false).then((msg) => {
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
    app.post("/permission/list-files", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.listFiles(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/list-shared", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.listShared(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/grant", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.grantAccess(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/list-users-access", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.listUsersAccessForFile(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/update-access", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.updateAccess(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/remove-all", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.removeAll(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/get-access", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.getAccess(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/permission/download", accountMiddleware.checkAuth, (req, res) => {
        permissionModel.downloadFile(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
