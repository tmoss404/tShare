const fileModel = require("../models/file");
const routes = require("../routes");
const accountMiddleware = require("../models/accountMiddleware");

module.exports.setupRoutes = function(app) {
    app.post("/file/upload", accountMiddleware.checkAuth, (req, res) => {
        fileModel.getSignedUrl(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/file/make-directory", accountMiddleware.checkAuth, (req, res) => {
        fileModel.makeDir(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/file/list", accountMiddleware.checkAuth, (req, res) => {
        fileModel.listFiles(req.body, false).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/file/recycle/list", accountMiddleware.checkAuth, (req, res) => {
        fileModel.listFiles(req.body, true).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/file/delete", accountMiddleware.checkAuth, (req, res) => {
        fileModel.deleteFile(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/file/move", accountMiddleware.checkAuth, (req, res) => {
        fileModel.moveFile(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
