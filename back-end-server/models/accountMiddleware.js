const accountModel = require("../models/account");
const routes = require("../routes");

module.exports.checkAuth = function(req, res, next) {
    accountModel.checkLogin(req.body).then((responseData) => {
        next();
    }).catch((responseData) => {
        routes.sendResponse(res, responseData);
    });
};
