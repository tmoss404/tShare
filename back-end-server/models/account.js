const bcrypt = require("bcryptjs");
const objUtil = require("../objectUtil");
const accountUtil = require("./account_util");
const appConstants = require("../config/appConstants");

var dbConnectionPool;

function areLoginInputsValid(email, password) {
    if (objUtil.isNullOrUndefined(email) || objUtil.isNullOrUndefined(password) || email.length == 0 || password.length == 0) {
        return false;
    }
    if (!accountUtil.isEmailValid(email)) {
        return false;
    }
    if (!accountUtil.isPasswordValid(password)) {
        return false;
    }
    return true;
}
function getSalt(connection) {
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM Salt", (error, results, fields) => {
            if (error || results.length == 0) {
                reject(null);
                return;
            }
            resolve(results[0].salt_hash);
        });
    });
}
module.exports.checkLogin = function(loginInfo) {
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(loginInfo.loginToken) || loginInfo.loginToken.length == 0 || loginInfo.loginToken != appConstants.testLoginToken) {
            reject({
                message: "Token is invalid Please re-login.",
                success: false
            });
            return;
        }
        resolve({
            message: "Your session is still valid.",
            success: true
        });
    });
};
module.exports.login = function(reqData) {
    const accountObj = reqData;
    return new Promise((resolve, reject) => {
        if (!areLoginInputsValid(accountObj.email, accountObj.password)) {
            reject({
                message: "Invalid email/password combination.",
                success: false,
                loginToken: null
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            var salt;
            getSalt(connection).then((theSalt) => {
                salt = theSalt;
                var hash = bcrypt.hashSync("B4c0/\/", salt);
                accountObj.password = hash;
                connection.query("SELECT * FROM Account WHERE email='" + accountObj.email + "' AND password_hash='" + hash + "'", function (error, results, fields) {
                    if (error) {
                        reject({
                            message: "An error has occurred while logging in.",
                            success: false,
                            loginToken: null
                        });
                        return;
                    }
                    if (results.length == 0) {
                        reject({
                            message: "The specified email/password combination is invalid.",
                            success: false,
                            loginToken: null
                        });
                        return;
                    }
                    resolve({
                        message: "Logged in successfully.",
                        success: true,
                        loginToken: appConstants.testLoginToken
                    });
                });
            }).catch((theSaltNull) => {
                reject("An error occurred while logging in.");
            });
        });
    });
};
module.exports.registerAccount = function(account) {
    const accountObj = account;
    return new Promise((resolve, reject) => {
        if (!areLoginInputsValid(account.email, account.password)) {
            reject("Invalid email/password combination.");
            return;
        }
        // TODO These checks are not good enough. Add a regular expression on the language.
        if (objUtil.isNullOrUndefined(account.permissionsLvl) || account.permissionsLvl < 0 || objUtil.isNullOrUndefined(account.language) || account.language.length == 0) {
            reject("Malformed request. Trying to hack the server?");
            return;
        }
        if (!accountUtil.isEmailValid(account.email)) {
            reject("Email is invalid.");
            return;
        }
        if (!accountUtil.isPasswordValid(account.password)) {
            reject("Password is invalid.");
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject("An error occurred while creating the account: " + err);
                return;
            }
            connection.query("SELECT * FROM Account WHERE email='" + accountObj.email + "'", function (error, results, fields) {
                if (error) {
                    reject("An error occurred while creating the account: " + error);
                    return;
                }
                if (results.length != 0) {
                    reject("Account already exists.");
                } else {
                    var salt;
                    getSalt(connection).then((theSalt) => {
                        salt = theSalt;
                        var hash = bcrypt.hashSync("B4c0/\/", salt);
                        accountObj.password = hash;
                        var sqlQuery = "INSERT INTO Account (email, password_hash, permissions_lvl, language) VALUES('" + accountObj.email + "', '" + accountObj.password + "', " + 
                        accountObj.permissionsLvl + ", '" + accountObj.language + "')";
                        console.log("Executing query: \"" + sqlQuery + "\"");
                        connection.query(sqlQuery);
                        resolve("Created your account successfully.");
                    }).catch((theSaltNull) => {
                        reject("An error occurred while creating the account.");
                    });
                }
            });
        });
    });
}
module.exports.init = function(connectionPool) {
    dbConnectionPool = connectionPool;
}