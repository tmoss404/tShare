const accountModel = require("../models/account");

module.exports.setupRoutes = function(app) {
    app.post("/account/register", (req, res) => {
        accountModel.registerAccount(req.body).then((msg) => {
            res.status(200).send(msg);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
    app.post("/account/forgot-password", (req, res) => {
        accountModel.forgotPassword(req.body).then((msg) => {
            res.status(200).send(msg);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
    app.post("/account/reset-password/:resetPwdId", (req, res) => {
        accountModel.resetPassword(req.body, req.params.resetPwdId).then((msg) => {
            res.status(200).send(msg);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
    app.post("/account/login", (req, res) => {
        accountModel.login(req.body).then((responseData) => {
            res.status(200).send(responseData);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
    app.post("/account/check-login", (req, res) => {
        accountModel.checkLogin(req.body).then((responseData) => {
            res.status(200).send(responseData);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
    app.post("/account/logout", (req, res) => {
        accountModel.logout(req.body).then((responseData) => {
            res.status(200).send(responseData);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
    app.get("/account/test", (req, res) => {
        res.status(200).send({
            message: "This account route works!",
            success: true
        });
    });
};
