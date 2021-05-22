const mySql = require("mysql");
const bcrypt = require("bcryptjs");
const accountModel = require("../models/account");
const appConstants = require("../config/appConstants");

module.exports.dbConnection = mySql.createConnection(appConstants.mySqlCfg);

function connectToDb() {
    module.exports.dbConnection.connect(function(err) {
        if (err) {
            console.log("Failed to connect to the MySQL database with error " + err + ".");
        }
    });
}
module.exports.init = function() {
    module.exports.dbConnection.on("error", (err) => {
        // Eric: re-establishes the connection to the database because for some reason mysql decides to just drop it after a while...
        module.exports.dbConnection = mySql.createConnection(appConstants.mySqlCfg);
        accountModel.init(module.exports.dbConnection);
        connectToDb();
    });
    connectToDb();
    accountModel.init(module.exports.dbConnection);
};
module.exports.cleanup = function() {
    module.exports.dbConnection.close();
};
