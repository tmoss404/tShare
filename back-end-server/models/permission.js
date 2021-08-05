const objectUtil = require("../objectUtil");
const commonErrors = require("./commonErrors");
const appConstants = require("../config/appConstants");
const fileUtil = require("./fileUtil");
const permissionUtil = require("./permissionUtil");
const database = require("../config/database");
const request = require("request");

var dbConnectionPool;

function requestPermSingleFile(fileResult, decodedToken, requestPermData, errMsg, connection) {
    return new Promise((resolve, reject) => {
        var dbConnection = connection;
        database.selectFromTable("File_Permissions", "file_id=" + fileResult.id + " AND for_account_id=" + decodedToken.accountId, connection).then((resultsPerms) => {
            if (resultsPerms.length != 0) {
                reject({
                    message: "You have already requested access to this file.",
                    success: false,
                    httpStatus: 403,
                    connectionToDrop: connection
                });
                return;
            }
            database.insertIntoTable("File_Permissions", "permission_flags, file_id, for_account_id, accepted", requestPermData.permissionFlags + ", " + fileResult.id + ", " + decodedToken.accountId + ", 0", dbConnection).then((resultsInsert) => {
                resolve(resultsInsert);
            }).catch((resultsInsert) => {
                reject(errMsg);
            });
        }).catch((resultsPerms) => {
            reject(errMsg);
        });
    });
}
module.exports.listPending = function(listPendingData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(listPendingData)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = listPendingData.decodedToken;
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: "An error has occurred while listing pending file requests.",
                success: false,
                httpStatus: 500,
                connectionToDrop: connection
            };
            connection.query("SELECT file_permissions.id, permission_flags, for_account_id, path, owner_id, is_directory FROM file_permissions JOIN file ON file_permissions.file_id = file.id AND file.owner_id = " + decodedToken.accountId + " AND file_permissions.accepted = 0", function(err, results, fields) {
                if (err) {
                    reject(errMsg);
                    return;
                }
                var permissionReqs = [];
                for (var i = 0; i < results.length; i++) {
                    permissionReqs.push({
                        requestId: results[i].id,
                        permissionFlags: results[i].permission_flags,
                        forAccountId: results[i].for_account_id,
                        requestedFile: {
                            path: results[i].path,
                            ownerId: results[i].owner_id,
                            isDirectory: results[i].is_directory != 0
                        }
                    });
                }
                resolve({
                    message: "Successfully retrieved a list of your pending file requests.",
                    success: true,
                    httpStatus: 200,
                    connectionToDrop: connection,
                    permissionRequests: permissionReqs
                });
            });
        });
    });
};
module.exports.acceptOrDenyRequest = function(acceptPermsData, accepting) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(acceptPermsData) || objectUtil.isNullOrUndefined(acceptPermsData.requestId)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = acceptPermsData.decodedToken;
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: accepting ? "An error has occurred while accepting file permissions from a user." : "An error has occurred while denying file permissions from a user.",
                success: false,
                httpStatus: 500,
                connectionToDrop: connection
            };
            database.selectFromTable("File_Permissions", "id=" + acceptPermsData.requestId, connection).then((resultsPerms) => {
                if (resultsPerms.length == 0) {
                    reject({
                        message: "Failed to find a record in the File_Permissions table with id " + acceptPermsData.requestId + ".",
                        success: false,
                        httpStatus: 403,
                        connectionToDrop: connection
                    });
                    return;
                }
                database.selectFromTable("File", "id=" + resultsPerms[0].file_id, connection).then((resultsFile) => {
                    if (resultsFile.length == 0) {
                        reject({
                            message: "Failed to find a record in the File table with id " + resultsPerms[0].file_id + ".",
                            success: false,
                            httpStatus: 403,
                            connectionToDrop: connection
                        });
                        return;
                    }
                    if (resultsFile[0].owner_id != decodedToken.accountId) {
                        reject({
                            message: "You do not own this file.",
                            success: false,
                            httpStatus: 403,
                            connectionToDrop: connection
                        });
                        return;
                    }
                    if (accepting) {
                        database.updateTable("File_Permissions", "accepted=1", "id=" + acceptPermsData.requestId, connection).then((resultsUpdPerms) => {
                            resolve({
                                message: "Successfully accepted a file permissions request.",
                                success: true,
                                httpStatus: 200,
                                connectionToDrop: connection
                            });
                        }).catch((resultsUpdPerms) => {
                            reject(errMsg);
                        });
                    } else {
                        database.deleteFromTable("File_Permissions", "id=" + acceptPermsData.requestId, connection).then((resultsUpdPerms) => {
                            resolve({
                                message: "Successfully denied a file permissions request.",
                                success: true,
                                httpStatus: 200,
                                connectionToDrop: connection
                            });
                        }).catch((resultsUpdPerms) => {
                            reject(errMsg);
                        });
                    }
                }).catch((resultsFile) => {
                    reject(errMsg);
                });
            }).catch((resultsPerms) => {
                reject(errMsg);
            });
        });
    });
};
module.exports.requestPermission = function(requestPermData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(requestPermData) || objectUtil.isNullOrUndefined(requestPermData.path) || requestPermData.path.length == 0 || 
            objectUtil.isNullOrUndefined(requestPermData.isDirectory) || requestPermData.isDirectory != false && requestPermData.isDirectory != true || 
            objectUtil.isNullOrUndefined(requestPermData.requesteeAccountId) || objectUtil.isNullOrUndefined(requestPermData.permissionFlags) ||
            !requestPermData.isDirectory && (permissionUtil.hasFlag(requestPermData.permissionFlags, permissionUtil.createFilePerm) || permissionUtil.hasFlag(requestPermData.permissionFlags, permissionUtil.deleteFilePerm))) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = requestPermData.decodedToken;
        requestPermData.path = fileUtil.formatFilePath(requestPermData.path);
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: "An error has occurred while requesting file permissions from a user.",
                success: false,
                httpStatus: 500,
                connectionToDrop: connection
            };
            var emailErrMsg = {
                message: "An internal error has occurred while trying to send an email.",
                httpStatus: 500,
                connectionToDrop: connection,
                success: false
            };
            database.selectFromTable("Account", "account_id=" + requestPermData.requesteeAccountId, connection).then((results) => {
                if (results.length == 0) {
                    reject({
                        message: "The specified requesteeAccountId does not exist.",
                        success: false,
                        httpStatus: 403,
                        connectionToDrop: connection
                    });
                    return;
                }
                var fullPath = requestPermData.requesteeAccountId + "/" + requestPermData.path;
                var flagNames = permissionUtil.getNamesForFlags(requestPermData.permissionFlags);
                var flagNameStr = "";
                for (var i = 0; i < flagNames.length; i++) {
                    flagNameStr += flagNames[i];
                    if (i < flagNames.length - 1) {
                        flagNameStr += ", ";
                    }
                }
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
                          "email": results[0].email
                        }
                      ],
                      "lists": [],
                      "contacts": [],
                      "attachments": [],
                      "title": "Someone Requested Access to a File You Own",
                      "html": "Hi,<br/><br/><br/>" +
                              "This is a notification that user " + decodedToken.email + " has requested " + flagNameStr + " permissions for " + (requestPermData.isDirectory ? "directory" : "file") + " \"" + requestPermData.path + "\".<br/><br/><br/>" +
                              "Best,<br/><br/><br/>Eric McDonald - tShare",
                      "methods": {
                        "postmark": false,
                        "secureSend": false,
                        "encryptContent": false,
                        "secureReply": false
                      }
                })};
                if (!requestPermData.isDirectory) {
                    database.selectFromTable("File", "owner_id=" + requestPermData.requesteeAccountId + " AND path='" + fullPath + "'", connection).then((resultsFile) => {
                        if (resultsFile.length == 0) {
                            reject({
                                message: "The specified file path does not exist.",
                                success: false,
                                httpStatus: 403,
                                connectionToDrop: connection
                            });
                            return;
                        }
                        requestPermSingleFile(resultsFile[0], decodedToken, requestPermData, errMsg, connection).then((result) => {
                            request(trustifiOpts, function (error, response) {
                                if (error) {
                                    reject(emailErrMsg);
                                    return;
                                }
                                resolve({
                                    message: "Successfully requested a file from the requestee.",
                                    httpStatus: 200,
                                    success: true,
                                    connectionToDrop: connection
                                });
                            });
                        }).catch((error) => {
                            reject(errMsg);
                        });
                    }).catch((resultsFile) => {
                        reject(errMsg);
                    });
                } else {
                    database.selectFromTable("File", "owner_id=" + requestPermData.requesteeAccountId + " AND path LIKE '" + fullPath + "/%'", connection).then((resultsFile) => {
                        if (resultsFile.length == 0) {
                            reject({
                                message: "The specified directory path does not exist.",
                                success: false,
                                httpStatus: 403,
                                connectionToDrop: connection
                            });
                            return;
                        }
                        var promises = [];
                        for (var i = 0; i < resultsFile.length; i++) {
                            promises.push(requestPermSingleFile(resultsFile[i], decodedToken, requestPermData, errMsg, connection));
                        }
                        Promise.all(promises).then((result) => {
                            request(trustifiOpts, function (error, response) {
                                if (error) {
                                    reject(emailErrMsg);
                                    return;
                                }
                                resolve({
                                    message: "Successfully requested a directory from the requestee.",
                                    success: true,
                                    httpStatus: 200,
                                    connectionToDrop: connection
                                });
                            });
                        }).catch((result) => {
                            reject(errMsg);
                        });
                    }).catch((resultsFile) => {
                        reject(errMsg);
                    });
                }
            }).catch((results) => {
                reject(errMsg);
            });
        });
    });
};
module.exports.init = function(connectionPool) {
    dbConnectionPool = connectionPool;
};
