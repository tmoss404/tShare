const mySql = require("mysql");
const bcrypt = require("bcryptjs");
const accountModel = require("../models/account");
const appConstants = require("../config/appConstants");

module.exports.connectionPool = mySql.createPool(appConstants.mySqlCfg);

module.exports.init = function() {
    accountModel.init(module.exports.connectionPool);
};
