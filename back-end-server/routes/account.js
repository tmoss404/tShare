const accountModel = require("../models/account");

module.exports.setupRoutes = function(app) {
    app.post("/account/register", (req, res) => {
        accountModel.registerAccount(req.body).then((msg) => {
            res.status(200).send({
                message: msg,
                success: true
            });
        }).catch((err) => {
            res.status(200).send({
                message: err,
                success: false
            });
        });
    });

    // TODO When it is time, Tanner will setup JSON Web Tokens that will be implemented for the following functions:
    app.post("/account/login", (req, res) => {
        accountModel.login(req.body).then((responseData) => {
            res.status(200).send(responseData);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
    app.post("/account/check_login", (req, res) => {
        accountModel.checkLogin(req.body).then((responseData) => {
            res.status(200).send(responseData);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
    
    app.get("/account/test", (req, res) => {
        res.status(200).send({
            message: msg,
            success: true
        });
    });
};
