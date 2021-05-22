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
    app.get("/account/test", (req, res) => {
        res.status(200).send({
            message: msg,
            success: true
        });
    });
};
