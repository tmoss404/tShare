const accountModel = require("../models/account");
const accountMiddleware = require("../models/accountMiddleware");
const routes = require("../routes");

module.exports.setupRoutes = function(app) {
    app.post("/account/register", (req, res) => {
        accountModel.registerAccount(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/account/forgot-password", (req, res) => {
        accountModel.forgotPassword(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/account/reset-password/:resetPwdId", (req, res) => {
        accountModel.resetPassword(req.body, req.params.resetPwdId).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/account/login", (req, res) => {
        accountModel.login(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/account/check-login", (req, res) => {
        accountModel.checkLogin(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/account/logout", accountMiddleware.checkAuth, (req, res) => {
        accountModel.logout(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
