const bcrypt = require("bcryptjs");
const objUtil = require("../objectUtil");
const accountUtil = require("./account_util");
const appConstants = require("../config/appConstants");
const request = require("request");

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
module.exports.resetPassword = function(resetPwdInfo, resetPwdId_) {
    var info = resetPwdInfo;
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(info) || objUtil.isNullOrUndefined(resetPwdId_) || resetPwdId_.length == 0 || objUtil.isNullOrUndefined(info.newPassword) || 
            info.newPassword.length == 0 || !accountUtil.isPasswordValid(info.newPassword)) {
                reject({
                    message: "Password is invalid.",
                    success: false
                });
                return;
            }
            info = {
                newPassword: info.newPassword,
                resetPwdId: resetPwdId_
            }
            dbConnectionPool.getConnection((err, connection) => {
                const dbConnection = connection;
                connection.query("SELECT * FROM Password_Reset_Link WHERE sub_link='" + info.resetPwdId + "'", function (error, results, fields) {
                    if (error) {
                        reject({
                            message: "An internal error has occurred while retrieving a sub-link.",
                            success: false
                        });
                        return;
                    }
                    var currentTime = Date.now();
                    if (results.length == 0 || currentTime - results[0].creation_date.getTime() >= 1000 * 60 * 60 * 24) {
                        if (results.length != 0 && currentTime - results[0].creation_date.getTime() >= 1000 * 60 * 60 * 24) {
                            dbConnection.query("DELETE FROM Password_Reset_Link WHERE email='" + pwdResetResult.email + "'", function (error, results, fields) {});
                        }
                        reject({
                            message: "Your password reset link is no longer valid.",
                            success: false
                        });
                        return;
                    }
                    const pwdResetResult = results[0];
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(info.newPassword, salt);
                    info.newPassword = hash;
                    dbConnection.query("UPDATE Account SET password_hash='" + info.newPassword + "' WHERE email='" + pwdResetResult.email + "'", function (error, results, fields) {
                        if (error) {
                            reject({
                                message: "An internal error has occurred while updating the user's password.",
                                success: false
                            });
                            return;
                        }
                        dbConnection.query("DELETE FROM Password_Reset_Link WHERE email='" + pwdResetResult.email + "'", function (error, results, fields) {
                            if (error) {
                                reject({
                                    message: "An internal error has occurred while deleting the password reset sub-link.",
                                    success: false
                                });
                                return;
                            }
                            resolve({
                                message: "Your password has been reset successfully.",
                                success: true
                            });
                        });
                    });
                });
            });
    });
};
module.exports.forgotPassword = function(forgotPwdInfo) {
    const info = forgotPwdInfo;
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(info) || objUtil.isNullOrUndefined(info.email) || info.email.length == 0 || !accountUtil.isEmailValid(info.email)) {
            reject({
                message: "Email is invalid.",
                success: false
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            const dbConnection = connection;
            connection.query("SELECT * FROM Account WHERE email='" + info.email + "'", function (error, results, fields) {
                if (error) {
                    reject({
                        message: "An error has occurred while sending the password reset email.",
                        success: false
                    });
                    return;
                }
                if (results.length == 0) {
                    reject({
                        message: "No account with email \"" + info.email + "\" could be found.",
                        success: false
                    });
                    return;
                }
                var randomId = accountUtil.getRandomInt(1, 99999);
                var resetLink = appConstants.frontEndUrl + "/reset-password/" + randomId;  // TODO Ask Tanner to create an Angular route that forwards to this URL?
                var trustifiOpts = {
                    'method': 'POST',
                    'url': 'https://be.trustifi.com/api/i/v1/email',
                    'headers': {
                      'x-trustifi-key': appConstants.trustifiKey,
                      'x-trustifi-secret': appConstants.trustifiSecret,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      "recipients": [
                        {
                          "email": info.email
                        }
                      ],
                      "lists": [],
                      "contacts": [],
                      "attachments": [],
                      "title": "Your Password Reset Link",
                      "html": "Hi,<br/><br/><br/>" +
                              "A link to reset your password has been requested: " + resetLink + ".<br/><br/>If you did not send this request, please contact the administrator.<br/><br/>" +
                              "Best,<br/><br/><br/>Eric McDonald - tShare",
                      "methods": {
                        "postmark": false,
                        "secureSend": false,
                        "encryptContent": false,
                        "secureReply": false
                      }
                })};
                request(trustifiOpts, function (error, response) {
                    if (error) {
                        reject({
                            message: "An internal error has occurred while trying to send the password reset email.",
                            success: false
                        });
                        return;
                    }
                    dbConnection.query("INSERT INTO Password_Reset_Link (sub_link, email) VALUES ('" + randomId + "', '" + info.email + "')");
                    resolve({
                        message: "A password reset email has been sent to " + info.email,
                        success: true
                    });
                });
            });
        });
    });
}
module.exports.checkLogin = function(loginInfo) {
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(loginInfo) || objUtil.isNullOrUndefined(loginInfo.loginToken) || loginInfo.loginToken.length == 0 || loginInfo.loginToken != appConstants.testLoginToken) {
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
        if (objUtil.isNullOrUndefined(accountObj) || !areLoginInputsValid(accountObj.email, accountObj.password)) {
            reject({
                message: "Invalid email/password combination.",
                success: false,
                loginToken: null
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            connection.query("SELECT * FROM Account WHERE email='" + accountObj.email + "'", function (error, results, fields) {
                if (error) {
                    reject({
                        message: "An error has occurred while logging in.",
                        success: false,
                        loginToken: null
                    });
                    return;
                }
                if (results.length != 0 && bcrypt.compareSync(accountObj.password, results[0].password_hash)) {
                    resolve({
                        message: "Logged in successfully.",
                        success: true,
                        loginToken: appConstants.testLoginToken
                    });
                } else {
                    reject({
                        message: "The specified email/password combination is invalid.",
                        success: false,
                        loginToken: null
                });
                }
            });
        });
    });
};
module.exports.registerAccount = function(account) {
    const accountObj = account;
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(account) || !areLoginInputsValid(account.email, account.password)) {
            reject({
                message: "Invalid email/password combination.",
                success: false
            });
            return;
        }
        if (objUtil.isNullOrUndefined(account.permissionsLvl) || account.permissionsLvl < 0) {
            reject({
                message: "Malformed request. Trying to hack the server?",
                success: false
            });
            return;
        }
        if (!accountUtil.isEmailValid(account.email)) {
            reject({
                message: "Email is invalid.",
                success: false
            });
            return;
        }
        if (!accountUtil.isPasswordValid(account.password)) {
            reject({
                message: "Password is invalid.",
                success: false
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject({
                    message: "An error occurred while creating the account: " + err,
                    success: false
                });
                return;
            }
            connection.query("SELECT * FROM Account WHERE email='" + accountObj.email + "'", function (error, results, fields) {
                if (error) {
                    reject({
                        message: "An error occurred while creating the account: " + error,
                        success: false
                    });
                    return;
                }
                if (results.length != 0) {
                    reject({
                        message: "Account already exists.",
                        success: false
                    });
                } else {
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(accountObj.password, salt);
                    accountObj.password = hash;
                    var sqlQuery = "INSERT INTO Account (email, password_hash, permissions_lvl) VALUES('" + accountObj.email + "', '" + accountObj.password + "', " + 
                        accountObj.permissionsLvl + ")";
                    connection.query(sqlQuery);
                    resolve({
                        message: "Created your account successfully.",
                        success: true
                    });
                }
            });
        });
    });
}
module.exports.init = function(connectionPool) {
    dbConnectionPool = connectionPool;
}