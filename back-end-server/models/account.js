const bcrypt = require("bcryptjs");
const request = require("request");
const jsonWebToken = require("jsonwebtoken");
const objUtil = require("../objectUtil");
const accountUtil = require("./account_util");
const appConstants = require("../config/appConstants");
const database = require("../config/database");

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
                database.selectFromTable("Password_Reset_Link", "sub_link='" + info.resetPwdId + "'", connection).then((results) => {
                    var currentTime = Date.now();
                    if (results.length == 0 || currentTime - results[0].creation_date.getTime() >= appConstants.pwdRecoveryLinkExp) {
                        if (results.length != 0 && currentTime - results[0].creation_date.getTime() >= appConstants.pwdRecoveryLinkExp) {
                            database.deleteFromTableSync("Password_Reset_Link", "email='" + pwdResetResult.email + "'", dbConnection);
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
                    database.updateTable("Account", "password_hash='" + info.newPassword + "'", "email='" + pwdResetResult.email + "'", connection).then((result) => {
                        database.deleteFromTable("Password_Reset_Link", "email='" + pwdResetResult.email + "'", connection).then((result) => {
                            resolve({
                                message: "Your password has been reset successfully.",
                                success: true
                            });
                        }).catch((resultFalse) => {
                            reject({
                                message: "An internal error has occurred while deleting the password reset sub-link.",
                                success: false
                            });
                        });
                    }).catch((resultFalse) => {
                        reject({
                            message: "An internal error has occurred while updating the user's password.",
                            success: false
                        });
                    });
                }).catch((resultsNull) => {
                    reject({
                        message: "An internal error has occurred while retrieving a sub-link.",
                        success: false
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
            database.selectFromTable("Account", "email='" + info.email + "'", connection).then((results) => {
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
                    database.insertIntoTable("Password_Reset_Link", "sub_link, email", "'" + randomId + "', '" + info.email + "'", connection).then((result) => {
                        resolve({
                            message: "A password reset email has been sent to " + info.email,
                            success: true
                        });
                    }).catch((result) => {
                        reject({
                            message: "Failed to send a password reset email to " + info.email,
                            success: false
                        });
                    });
                });
            }).catch((resultsNull) => {
                reject({
                    message: "An error has occurred while sending the password reset email.",
                    success: false
                });
            });
        });
    });
}
module.exports.logout = function(loginInfo) {
    return new Promise((resolve, reject) => {
        dbConnectionPool.getConnection((err, connection) => {
            database.deleteFromTableSync("Invalid_Token", Date.now() + " - UNIX_TIMESTAMP(invalidated_date)*1000 > " + appConstants.jwtTokenExpiresInAsMillis, connection);
            module.exports.checkLogin(loginInfo).then((responseData) => {
                try {
                    var decodedToken = jsonWebToken.verify(loginInfo.loginToken, appConstants.jwtSecretKey);
                    var whereClause = "'" + JSON.stringify(decodedToken) + "'";
                    database.selectFromTable("Invalid_Token", whereClause, connection).then((results) => {
                        if (results.length == 0) {
                            database.insertIntoTableSync("Invalid_Token", "token", whereClause, connection);
                        }
                    }).catch((resultsNull) => {});
                    resolve({
                        message: "Token has been invalidated successfully.",
                        success: true
                    });
                } catch(err) {
                    resolve({
                        message: "Token has been invalidated successfully.",
                        success: true
                    });
                }
            }).catch((err) => {
                resolve({
                    message: "Token has been invalidated successfully.",
                    success: true
                });
            });
        });
    });
};
module.exports.checkLogin = function(loginInfo) {
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(loginInfo) || objUtil.isNullOrUndefined(loginInfo.loginToken) || loginInfo.loginToken.length == 0) {
            reject({
                message: "Malformed request. Trying to hack the server?",
                success: false
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            try {
                var decodedToken = jsonWebToken.verify(loginInfo.loginToken, appConstants.jwtSecretKey);
                database.selectFromTable("Invalid_Token", "token='" + JSON.stringify(decodedToken) + "'", connection).then((results) => {
                    if (results.length == 0) {
                        resolve({
                            message: "Your login token is still valid.",
                            success: true
                        });
                    } else {
                        reject({
                            message: "Token is invalid. Please re-login.",
                            success: false
                        });
                    }
                }).catch((resultsNull) => {
                    reject({
                        message: "Failed to query the database for invalid tokens.",
                        success: false
                    });
                });
            } catch(err) {
                reject({
                    message: "Token is invalid. Please re-login.",
                    success: false
                });
            }
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
            database.selectFromTable("Account", "email='" + accountObj.email + "'", connection).then((results) => {
                if (results.length != 0 && bcrypt.compareSync(accountObj.password, results[0].password_hash)) {
                    var theLoginToken = jsonWebToken.sign({
                        accountId: results[0].account_id,
                        email: results[0].email
                    }, appConstants.jwtSecretKey, {
                        expiresIn: appConstants.jwtTokenExpiresIn
                    });
                    resolve({
                        message: "Logged in successfully.",
                        success: true,
                        loginToken: theLoginToken
                    });
                } else {
                    reject({
                        message: "The specified email/password combination is invalid.",
                        success: false,
                        loginToken: null
                    });
                }
            }).catch((resultsNull) => {
                reject({
                    message: "An error has occurred while logging in.",
                    success: false,
                    loginToken: null
                });
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
            database.selectFromTable("Account", "email='" + accountObj.email + "'", connection).then((results) => {
                if (results.length != 0) {
                    reject({
                        message: "Account already exists.",
                        success: false
                    });
                } else {
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(accountObj.password, salt);
                    accountObj.password = hash;
                    database.insertIntoTable("Account", "email, password_hash, permissions_lvl", "'" + accountObj.email + "', '" + accountObj.password + "', 0", connection).then((result) => {
                        resolve({
                            message: "Created your account successfully.",
                            success: true
                        });
                    }).catch((result) => {
                        reject({
                            message: "Failed to create your account.",
                            success: false
                        })
                    });
                }
            }).catch((results) => {
                reject({
                    message: "An error occurred while creating the account: " + error,
                    success: false
                });
            });
        });
    });
}
module.exports.init = function(connectionPool) {
    dbConnectionPool = connectionPool;
}