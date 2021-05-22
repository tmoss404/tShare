const bcrypt = require("bcryptjs");
const objUtil = require("../objectUtil");

var database;

module.exports.registerAccount = function(account) {
    const accountObj = account;
    return new Promise((resolve, reject) => {
        // TODO These checks are not good enough. Add a regular expression on the email, language, and password.
        if (objUtil.isNullOrUndefined(account.email) || objUtil.isNullOrUndefined(account.password) || objUtil.isNullOrUndefined(account.permissionsLvl) || 
            account.permissionsLvl < 0 || objUtil.isNullOrUndefined(account.language) || account.email.length == 0 || account.password.length == 0 || 
                account.language.length == 0) {
                reject("Malformed request. Trying to hack the server?");
                return;
        }
        database.query("SELECT * FROM Account WHERE email='" + accountObj.email + "'", function (error, results, fields) {
            if (error) {
                reject("An error occurred while creating the account: " + error);
                return;
            }
            if (results.length != 0) {
                reject("Account already exists.");
            } else {
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync("B4c0/\/", salt);
                accountObj.password = hash;
                console.log("INSERT INTO Account (email, password_hash, permissions_lvl, language) VALUES('" + accountObj.email + "', '" + accountObj.password + "', " + 
                accountObj.permissionsLvl + ", '" + accountObj.language + "')");
                database.query("INSERT INTO Account (email, password_hash, permissions_lvl, language) VALUES('" + accountObj.email + "', '" + accountObj.password + "', " + 
                accountObj.permissionsLvl + ", '" + accountObj.language + "')");
                resolve("Created your account successfully.");
            }
        });
    });
}
module.exports.init = function(dbConnection) {
    database = dbConnection;
}