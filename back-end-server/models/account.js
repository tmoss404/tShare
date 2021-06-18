const bcrypt = require("bcryptjs");
const request = require("request");
const jsonWebToken = require("jsonwebtoken");
const objUtil = require("../objectUtil");
const accountUtil = require("./accountUtil");
const appConstants = require("../config/appConstants");
const database = require("../config/database");

var dbConnectionPool;

module.exports.resetPassword = function(resetPwdInfo, resetPwdId_) {
    var info = resetPwdInfo;
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(info) || objUtil.isNullOrUndefined(resetPwdId_) || resetPwdId_.length == 0 || objUtil.isNullOrUndefined(info.newPassword) || 
            info.newPassword.length == 0 || !accountUtil.isPasswordValid(info.newPassword)) {
                reject({
                    message: "Password is invalid.",
                    httpStatus: 400,
                    success: false
                });
                return;
            }
            info = {
                newPassword: info.newPassword,
                resetPwdId: resetPwdId_
            }
            dbConnectionPool.getConnection((err, connection) => {
                if (err) {
                    reject({
                        message: "Failed to establish a connection to the database.",
                        httpStatus: 500,
                        success: false,
                        connectionToDrop: connection
                    });
                    return;
                }
                const dbConnection = connection;
                database.selectFromTable("Password_Reset_Link", "sub_link='" + info.resetPwdId + "'", connection).then((results) => {
                    var currentTime = Date.now();
                    if (results.length == 0 || currentTime - results[0].creation_date.getTime() >= appConstants.pwdRecoveryLinkExp) {
                        if (results.length != 0 && currentTime - results[0].creation_date.getTime() >= appConstants.pwdRecoveryLinkExp) {
                            database.deleteFromTable("Password_Reset_Link", "email='" + pwdResetResult.email + "'", dbConnection).then((success) => {});
                        }
                        reject({
                            message: "Your password reset link is no longer valid.",
                            httpStatus: 401,
                            success: false,
                            connectionToDrop: dbConnection
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
                                httpStatus: 200,
                                success: true,
                                connectionToDrop: dbConnection
                            });
                        }).catch((resultFalse) => {
                            reject({
                                message: "An internal error has occurred while deleting the password reset sub-link.",
                                success: false,
                                httpStatus: 500,
                                connectionToDrop: dbConnection
                            });
                        });
                    }).catch((resultFalse) => {
                        reject({
                            message: "An internal error has occurred while updating the user's password.",
                            success: false,
                            httpStatus: 500,
                            connectionToDrop: dbConnection
                        });
                    });
                }).catch((resultsNull) => {
                    reject({
                        message: "An internal error has occurred while retrieving a sub-link.",
                        success: false,
                        httpStatus: 500,
                        connectionToDrop: dbConnection
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
                success: false,
                httpStatus: 400
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject({
                    message: "Failed to establish a connection to the database.",
                    httpStatus: 500,
                    success: false
                });
                return;
            }
            const dbConnection = connection;
            database.selectFromTable("Account", "email='" + info.email + "'", connection).then((results) => {
                if (results.length == 0) {
                    reject({
                        message: "No account with email \"" + info.email + "\" could be found.",
                        httpStatus: 401,
                        success: false,
                        connectionToDrop: dbConnection
                    });
                    return;
                }
                var randomId = objUtil.getRandomInt(1, 99999);
                var resetLink = appConstants.frontEndUrl + "/reset-password/" + randomId;
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
                            httpStatus: 500,
                            connectionToDrop: dbConnection,
                            success: false
                        });
                        return;
                    }
                    database.insertIntoTable("Password_Reset_Link", "sub_link, email", "'" + randomId + "', '" + info.email + "'", connection).then((result) => {
                        resolve({
                            message: "A password reset email has been sent to " + info.email,
                            httpStatus: 200,
                            success: true,
                            connectionToDrop: dbConnection
                        });
                    }).catch((result) => {
                        reject({
                            message: "Failed to send a password reset email to " + info.email,
                            success: false,
                            httpStatus: 500,
                            connectionToDrop: dbConnection
                        });
                    });
                });
            }).catch((resultsNull) => {
                reject({
                    message: "An error has occurred while sending the password reset email.",
                    success: false,
                    httpStatus: 500,
                    connectionToDrop: dbConnection
                });
            });
        });
    });
}
module.exports.logout = function(loginInfo) {
    return new Promise((resolve, reject) => {
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject({
                    message: "Failed to establish a connection to the database.",
                    httpStatus: 500,
                    success: false
                });
                return;
            }
            var successResponse = {
                message: "Token has been invalidated successfully.",
                httpStatus: 200,
                success: true,
                connectionToDrop: connection
            };
            database.deleteFromTable("Invalid_Token", Date.now() + " - UNIX_TIMESTAMP(invalidated_date)*1000 > " + appConstants.jwtTokenExpiresInAsMillis, connection).then((success) => {
                try {
                    var decodedToken = jsonWebToken.verify(loginInfo.loginToken, appConstants.jwtSecretKey);
                    var whereClause = "'" + JSON.stringify(decodedToken) + "'";
                    database.selectFromTable("Invalid_Token", whereClause, connection).then((results) => {
                        if (results.length == 0) {
                            database.insertIntoTable("Invalid_Token", "token", whereClause, connection).then((success) => {
                                resolve(successResponse);
                            });
                        } else {
                            resolve(successResponse);
                        }
                    });
                } catch(err) {
                    resolve(successResponse);
                }
            });
        });
    });
};
module.exports.checkLogin = function(loginInfo) {
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(loginInfo) || objUtil.isNullOrUndefined(loginInfo.loginToken) || loginInfo.loginToken.length == 0) {
            reject({
                message: "Malformed request. Trying to hack the server?",
                httpStatus: 400,
                success: false
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject({
                    message: "Failed to establish a connection to the database.",
                    httpStatus: 500,
                    success: false
                });
                return;
            }
            var invalidTokenResponse = {
                message: "Token is invalid. Please re-login.",
                httpStatus: 401,
                success: false,
                connectionToDrop: connection
            };
            try {
                var decodedToken = jsonWebToken.verify(loginInfo.loginToken, appConstants.jwtSecretKey);
                database.selectFromTable("Invalid_Token", "token='" + JSON.stringify(decodedToken) + "'", connection).then((results) => {
                    if (results.length == 0) {
                        resolve({
                            message: "Your login token is still valid.",
                            httpStatus: 200,
                            success: true,
                            connectionToDrop: connection
                        });
                    } else {
                        reject(invalidTokenResponse);
                    }
                }).catch((resultsNull) => {
                    reject({
                        message: "Failed to query the database for invalid tokens.",
                        httpStatus: 500,
                        success: false,
                        connectionToDrop: connection
                    });
                });
            } catch(err) {
                reject(invalidTokenResponse);
            }
        });
    });
};
module.exports.login = function(reqData) {
    const accountObj = reqData;
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(accountObj) || !accountUtil.areLoginInputsValid(accountObj.email, accountObj.password)) {
            reject({
                message: "Invalid email/password combination.",
                success: false,
                httpStatus: 400
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject({
                    message: "Failed to establish a connection to the database.",
                    httpStatus: 500,
                    success: false
                });
                return;
            }
            database.selectFromTable("Account", "email='" + accountObj.email + "'", connection).then((results) => {
                if (results.length != 0 && bcrypt.compareSync(accountObj.password, results[0].password_hash)) {
                    try {
                        var theLoginToken = jsonWebToken.sign({
                            accountId: results[0].account_id,
                            email: results[0].email
                        }, appConstants.jwtSecretKey, {
                            expiresIn: appConstants.jwtTokenExpiresIn
                        });
                        resolve({
                            message: "Logged in successfully.",
                            success: true,
                            httpStatus: 200,
                            loginToken: theLoginToken,
                            connectionToDrop: connection
                        });
                    } catch (theError) {
                        console.log(theError);
                        reject({
                            message: "Failed to sign your web token.",
                            success: false,
                            httpStatus: 500,
                            connectionToDrop: connection
                        });
                    }
                } else {
                    reject({
                        message: "The specified email/password combination is invalid.",
                        success: false,
                        httpStatus: 401,
                        connectionToDrop: connection
                    });
                }
            }).catch((resultsNull) => {
                reject({
                    message: "An error has occurred while logging in.",
                    httpStatus: 500,
                    success: false,
                    connectionToDrop: connection
                });
            });
        });
    });
};
module.exports.registerAccount = function(account) {
    const accountObj = account;
    return new Promise((resolve, reject) => {
        if (objUtil.isNullOrUndefined(account) || !accountUtil.areLoginInputsValid(account.email, account.password)) {
            reject({
                message: "Invalid email/password combination.",
                httpStatus: 400,
                success: false
            });
            return;
        }
        if (!accountUtil.isEmailValid(account.email)) {
            reject({
                message: "Email is invalid.",
                httpStatus: 400,
                success: false
            });
            return;
        }
        if (!accountUtil.isPasswordValid(account.password)) {
            reject({
                message: "Password is invalid.",
                httpStatus: 400,
                success: false
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject({
                    message: "Failed to establish a connection to the database.",
                    httpStatus: 500,
                    success: false
                });
                return;
            }
            database.selectFromTable("Account", "email='" + accountObj.email + "'", connection).then((results) => {
                if (results.length != 0) {
                    reject({
                        message: "Account already exists.",
                        httpStatus: 401,
                        success: false,
                        connectionToDrop: connection
                    });
                } else {
                    var salt = bcrypt.genSaltSync(10);
                    var hash = bcrypt.hashSync(accountObj.password, salt);
                    accountObj.password = hash;
                    database.insertIntoTable("Account", "email, password_hash, permissions_lvl", "'" + accountObj.email + "', '" + accountObj.password + "', 0", connection).then((result) => {
                        resolve({
                            message: "Created your account successfully.",
                            httpStatus: 200,
                            success: true,
                            connectionToDrop: connection
                        });
                    }).catch((result) => {
                        reject({
                            message: "Failed to create your account.",
                            httpStatus: 500,
                            success: false,
                            connectionToDrop: connection
                        })
                    });
                }
            }).catch((results) => {
                reject({
                    message: "An error occurred while creating an account.",
                    httpStatus: 500,
                    success: false,
                    connectionToDrop: connection
                });
            });
        });
    });
}
module.exports.init = function(connectionPool) {
    dbConnectionPool = connectionPool;
}