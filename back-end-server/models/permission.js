const objectUtil = require("../objectUtil");
const commonErrors = require("./commonErrors");
const appConstants = require("../config/appConstants");
const fileUtil = require("./fileUtil");
const permissionUtil = require("./permissionUtil");
const database = require("../config/database");
const request = require("request");
const awsSdk = require("aws-sdk");

var s3  = new awsSdk.S3({
    accessKeyId: appConstants.awsAccessKeyId,
    secretAccessKey: appConstants.awsAccessSecretKey,
    region: appConstants.awsRegion
});
var dbConnectionPool;

function requestPermSingleFile(fileResult, decodedToken, requestPermData, errMsg, accepted, connection) {
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
            database.insertIntoTable("File_Permissions", "permission_flags, file_id, for_account_id, accepted", requestPermData.permissionFlags + ", " + fileResult.id + ", " + decodedToken.accountId + ", " + (accepted ? 1 : 0), dbConnection).then((resultsInsert) => {
                resolve(resultsInsert);
            }).catch((resultsInsert) => {
                reject(errMsg);
            });
        }).catch((resultsPerms) => {
            reject(errMsg);
        });
    });
}
module.exports.downloadFile = function(dlFileData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(dlFileData) || objectUtil.isNullOrUndefined(dlFileData.filePath) || objectUtil.isNullOrUndefined(dlFileData.targetAccountId)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        dlFileData.filePath = dlFileData.targetAccountId + "/" + fileUtil.formatFilePath(dlFileData.filePath);
        var s3Params = {
            Bucket: appConstants.awsBucketName,
            Key: dlFileData.filePath
        };
        s3.getSignedUrl("getObject", s3Params, (err, url) => {
            if (err) {
                reject(commonErrors.createFailedToQueryS3Status500());
            } else {
                resolve({
                    message: "Successfully retrieved a signed S3 URL for downloading a user's file.",
                    httpStatus: 200,
                    success: true,
                    signedUrl: url
                });
            }
        });
    });
};
module.exports.removeAll = function(removeAllData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(removeAllData) || objectUtil.isNullOrUndefined(removeAllData.path) || removeAllData.path.length == 0 || 
            objectUtil.isNullOrUndefined(removeAllData.isDirectory) || removeAllData.isDirectory != false && removeAllData.isDirectory != true) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = removeAllData.decodedToken;
        removeAllData.path = fileUtil.formatFilePath(removeAllData.path);
        var fullPath = decodedToken.accountId + "/" + removeAllData.path;
        if (removeAllData.isDirectory) {
            fullPath += "/" + appConstants.dirPlaceholderFile;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: "An error has occurred while removing all users access from your file.",
                success: false,
                httpStatus: 500,
                connectionToDrop: connection
            };
            database.selectFromTable("File", "owner_id=" + decodedToken.accountId + " AND path='" + fullPath + "'", connection).then((resultsFile) => {
                if (resultsFile.length == 0) {
                    reject(errMsg);
                    return;
                }
                database.deleteFromTable("File_Permissions", "file_id=" + resultsFile[0].id + " AND accepted=1", connection).then((resultsPerms) => {
                    resolve({
                        message: "Successfully removed all users' access from your file.",
                        success: true,
                        httpStatus: 200,
                        connectionToDrop: connection
                    });
                }).catch((resultsPerms) => {
                    reject(errMsg);
                });
            }).catch((resultsFile) => {
                reject(errMsg);
            });
        });
    });
};
module.exports.getAccess = function(getAccessData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(getAccessData) || objectUtil.isNullOrUndefined(getAccessData.path) || getAccessData.path.length == 0 || 
        objectUtil.isNullOrUndefined(getAccessData.isDirectory) || getAccessData.isDirectory != false && getAccessData.isDirectory != true || 
        objectUtil.isNullOrUndefined(getAccessData.targetAccountId)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = getAccessData.decodedToken;
        getAccessData.path = fileUtil.formatFilePath(getAccessData.path);
        var fullPath = decodedToken.accountId + "/" + getAccessData.path;
        if (getAccessData.isDirectory) {
            fullPath += "/" + appConstants.dirPlaceholderFile;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: "An error has occurred while retrieving a user's access level to your file.",
                success: false,
                httpStatus: 500,
                connectionToDrop: connection
            };
            database.selectFromTable("File", "owner_id=" + decodedToken.accountId + " AND path='" + fullPath + "'", connection).then((resultsFile) => {
                if (resultsFile.length == 0) {
                    reject(errMsg);
                    return;
                }
                database.selectFromTable("File_Permissions", "file_id=" + resultsFile[0].id + " AND for_account_id=" + getAccessData.targetAccountId + " AND accepted=1", connection).then((resultsPerms) => {
                    if (resultsPerms.length == 0) {
                        reject({
                            message: "Failed to find an accepted file permissions request.",
                            success: false,
                            httpStatus: 403,
                            connectionToDrop: connection
                        });
                        return;
                    }
                    resolve({
                        message: "Successfully retrieved the specified user's permission level.",
                        success: true,
                        httpStatus: 200,
                        connectionToDrop: connection,
                        permissionFlags: resultsPerms[0].permission_flags
                    });
                }).catch((resultsPerms) => {
                    reject(errMsg);
                });
            }).catch((resultsFile) => {
                reject(errMsg);
            });
        });
    });
};
module.exports.updateAccess = function(updateAccessData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(updateAccessData) || objectUtil.isNullOrUndefined(updateAccessData.path) || updateAccessData.path.length == 0 || 
            objectUtil.isNullOrUndefined(updateAccessData.isDirectory) || updateAccessData.isDirectory != false && updateAccessData.isDirectory != true || 
            objectUtil.isNullOrUndefined(updateAccessData.permissionFlags) || objectUtil.isNullOrUndefined(updateAccessData.targetAccountId)) {
                reject(commonErrors.genericStatus400);
                return;
            }
            var decodedToken = updateAccessData.decodedToken;
            updateAccessData.path = fileUtil.formatFilePath(updateAccessData.path);
            var fullPath = decodedToken.accountId + "/" + updateAccessData.path;
            if (updateAccessData.isDirectory) {
                fullPath += "/" + appConstants.dirPlaceholderFile;
            }
            dbConnectionPool.getConnection((err, connection) => {
                if (err) {
                    reject(commonErrors.failedToConnectDbStatus500);
                    return;
                }
                var errMsg = {
                    message: "An error has occurred while updating a user's access level to your file.",
                    success: false,
                    httpStatus: 500,
                    connectionToDrop: connection
                };
                database.selectFromTable("File", "owner_id=" + decodedToken.accountId + " AND path='" + fullPath + "'", connection).then((resultsFile) => {
                    if (resultsFile.length == 0) {
                        reject(errMsg);
                        return;
                    }
                    database.selectFromTable("File_Permissions", "file_id=" + resultsFile[0].id + " AND accepted=1", connection).then((resultsPerms) => {
                        if (resultsPerms.length == 0) {
                            reject({
                                message: "Could not find an accepted File_Permissions entry with file ID " + resultsFile[0].id + ".",
                                success: false,
                                httpStatus: 403,
                                connectionToDrop: connection
                            });
                            return;
                        }
                        if (updateAccessData.permissionFlags == 0) {
                            database.deleteFromTable("File_Permissions", "file_id=" + resultsFile[0].id + " AND accepted=1 AND for_account_id=" + updateAccessData.targetAccountId, connection).then((resultsDelPerms) => {
                                resolve({
                                    message: "Successfully removed a user from being able to access your file.",
                                    success: true,
                                    httpStatus: 200,
                                    connectionToDrop: connection
                                });
                            }).catch((resultsDelPerms) => {
                                reject(errMsg);
                            });
                        } else {
                            database.updateTable("File_Permissions", "permission_flags=" + updateAccessData.permissionFlags, "file_id=" + resultsFile[0].id + " AND accepted=1 AND for_account_id=" + updateAccessData.targetAccountId, connection).then((resultsUpdPerms) => {
                                resolve({
                                    message: "Successfully updated a user's access level to your file.",
                                    success: true,
                                    httpStatus: 200,
                                    connectionToDrop: connection
                                });
                            }).catch((resultsUpdPerms) => {
                                reject(errMsg);
                            });
                        }
                    }).catch((resultsPerms) => {
                        reject(errMsg);
                    });
                }).catch((resultsFile) => {
                    reject(errMsg);
                });
            });
    });
};
module.exports.listUsersAccessForFile = function(listUsersAccessData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(listUsersAccessData) || objectUtil.isNullOrUndefined(listUsersAccessData.path) || listUsersAccessData.path.length == 0 || 
            objectUtil.isNullOrUndefined(listUsersAccessData.isDirectory) || listUsersAccessData.isDirectory != false && listUsersAccessData.isDirectory != true) {
                reject(commonErrors.genericStatus400);
                return;
        }
        var decodedToken = listUsersAccessData.decodedToken;
        listUsersAccessData.path = fileUtil.formatFilePath(listUsersAccessData.path);
        var fullPath = decodedToken.accountId + "/" + listUsersAccessData.path;
        if (listUsersAccessData.isDirectory) {
            fullPath += "/" + appConstants.dirPlaceholderFile;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: "An error has occurred while listing users that have access to your file.",
                success: false,
                httpStatus: 500,
                connectionToDrop: connection
            };
            database.selectFromTable("File", "owner_id=" + decodedToken.accountId + " AND path='" + fullPath + "'", connection).then((resultsFile) => {
                if (resultsFile.length == 0) {
                    reject(errMsg);
                    return;
                }
                var userWithAccessList = [];
                connection.query("SELECT * FROM File_Permissions JOIN File ON File_Permissions.file_id = File.id JOIN Account ON File_Permissions.for_account_id = Account.account_id WHERE accepted=1 AND File_Permissions.file_id = " + resultsFile[0].id, function(err, results, fields) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    for (var i = 0; i < results.length; i++) {
                        userWithAccessList.push({
                            email: results[i].email,
                            accountId: results[i].accountId,
                            permissionFlags: results[i].permission_flags
                        });
                    }
                    resolve({
                        message: "Successfully retrieved a list of users who have access to your file.",
                        success: true,
                        httpStatus: 200,
                        connectionToDrop: connection,
                        usersWithAccess: userWithAccessList
                    });
                });
            }).catch((resultsFile) => {
                reject(errMsg);
            });
        });
    });
};
module.exports.grantAccess = function(grantAccessData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(grantAccessData) || objectUtil.isNullOrUndefined(grantAccessData.path) || grantAccessData.path.length == 0 || 
            objectUtil.isNullOrUndefined(grantAccessData.isDirectory) || grantAccessData.isDirectory != false && grantAccessData.isDirectory != true || 
            objectUtil.isNullOrUndefined(grantAccessData.forAccountId) || objectUtil.isNullOrUndefined(grantAccessData.permissionFlags) ||
            !grantAccessData.isDirectory && (permissionUtil.hasFlag(grantAccessData.permissionFlags, permissionUtil.createFilePerm) || permissionUtil.hasFlag(grantAccessData.permissionFlags, permissionUtil.deleteFilePerm))) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = grantAccessData.decodedToken;
        grantAccessData.path = fileUtil.formatFilePath(grantAccessData.path);
        var fullPath = decodedToken.accountId + "/" + grantAccessData.path;
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: "An error has occurred while granting a user access to your file.",
                success: false,
                httpStatus: 500,
                connectionToDrop: connection
            };
            if (!grantAccessData.isDirectory) {
                database.selectFromTable("File", "owner_id=" + decodedToken.accountId + " AND path='" + fullPath + "'", connection).then((results) => {
                    if (results.length == 0) {
                        reject(errMsg);
                        return;
                    }
                    requestPermSingleFile(results[0], {accountId: grantAccessData.forAccountId}, grantAccessData, errMsg, true, connection).then((result) => {
                        resolve({
                            message: "Successfully granted a user access to your file.",
                            httpStatus: 200,
                            success: true,
                            connectionToDrop: connection
                        });
                    }).catch((error) => {
                        reject(errMsg);
                    });
                }).catch((results) => {
                    reject(errMsg);
                });
            } else {
                database.selectFromTable("File", "owner_id=" + decodedToken.accountId + " AND path LIKE '" + fullPath + "/%'", connection).then((results) => {
                    if (results.length == 0) {
                        reject(errMsg);
                        return;
                    }
                    var promises = [];
                    for (var i = 0; i < results.length; i++) {
                        promises.push(requestPermSingleFile(results[i], {accountId: grantAccessData.forAccountId}, grantAccessData, errMsg, true, connection));
                    }
                    Promise.all(promises).then((resultPromises) => {
                        resolve({
                            message: "Successfully granted a user access to your directory.",
                            success: true,
                            httpStatus: 200,
                            connectionToDrop: connection
                        });
                    }).catch((resultPromises) => {
                        reject(errMsg);
                    });
                }).catch((results) => {
                    reject(errMsg);
                });
            }
        });
    });
};
module.exports.listShared = function(listSharedData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(listSharedData)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = listSharedData.decodedToken;
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: "An error has occurred while listing shared files.",
                success: false,
                httpStatus: 500,
                connectionToDrop: connection
            };
            connection.query("SELECT file_permissions.id, permission_flags, path, owner_id, is_directory FROM file_permissions JOIN file ON file_permissions.file_id = file.id AND file_permissions.for_account_id = " + decodedToken.accountId + " AND file_permissions.accepted = 1", function(err, results, fields) {
                if (err) {
                    reject(errMsg);
                    return;
                }
                var fileList = {
                    IsTruncated: false,
                    "KeyCount": 0,
                    "Name": appConstants.awsBucketName,
                    "Prefix": "",
                    "MaxKeys": 1000,
                    "CommonPrefixes": [],
                    "Contents": []
                };
                if (results.length == 0) {
                    resolve({
                        message: "Successfully retrieved your list of files that are shared with you.",
                        success: true,
                        httpStatus: 200,
                        connectionToDrop: connection,
                        files: fileList
                    });
                } else {
                    var promises = [];
                    for (var i = 0; i < results.length; i++) {
                        var result = results[i];
                        promises.push(new Promise((resolve, reject) => {
                            database.selectFromTable("Account", "account_id=" + result.owner_id, connection).then((resultsAccount) => {
                                if (resultsAccount.length == 0) {
                                    reject(errMsg);
                                    return;
                                }
                                s3.getObject({
                                    Bucket: appConstants.awsBucketName,
                                    Key: result.path
                                }, (err, data) => {
                                    if (err) {
                                        reject(errMsg);
                                        return;
                                    }
                                    fileList.Contents.push({
                                        "Key": result.is_directory != 0 ? result.path.substring(0, result.path.lastIndexOf("/" + appConstants.dirPlaceholderFile)) : result.path,
                                        "LastModified": data.LastModified,
                                        "ETag": data.ETag,
                                        "Size": data.ContentLength,
                                        "StorageClass": "STANDARD",
                                        isDirectory: result.is_directory != 0,
                                        owner: {
                                            accountId: result.owner_id,
                                            email: resultsAccount[0].email
                                        },
                                        permissionFlags: result.permission_flags
                                    });
                                    ++fileList.KeyCount;
                                    resolve();
                                });
                            }).catch((resultsAccount) => {
                                reject(errMsg);
                            });
                        }));
                    }
                    Promise.all(promises).then((result) => {
                        resolve({
                            message: "Successfully retrieved a list of files that are shared with you.",
                            success: true,
                            httpStatus: 200,
                            files: fileList
                        })
                    }).catch((result) => {
                        reject(errMsg);
                    });
                }
            });
        });
    });
};
module.exports.listFiles = function(listFilesData) {
    return new Promise((resolve, reject) => {
        if (!objectUtil.isNullOrUndefined(listFilesData) && objectUtil.isUndefined(listFilesData.dirPath)) {
            listFilesData.dirPath = null;
        }
        if (objectUtil.isNullOrUndefined(listFilesData) || objectUtil.isNullOrUndefined(listFilesData.targetAccountId) || listFilesData.dirPath != null && listFilesData.dirPath.length == 0 || listFilesData.showNestedFiles != false && listFilesData.showNestedFiles != true) {
            reject(commonErrors.genericStatus400);
            return;
        }
        if (listFilesData.dirPath != null) {
            listFilesData.dirPath = fileUtil.formatFilePath(listFilesData.dirPath);
        }
        var pathPrefix = "" + listFilesData.targetAccountId + "/";
        var accountIdPrefix = pathPrefix;
        if (listFilesData.dirPath != null) {
            pathPrefix += listFilesData.dirPath + "/";
        }
        var s3Params = {
            Bucket: appConstants.awsBucketName,
            MaxKeys: appConstants.awsMaxKeys,
            Prefix: pathPrefix
        };
        s3.listObjectsV2(s3Params, (err, data_) => {
            if (err) {
                reject(commonErrors.createFailedToQueryS3Status500());
            } else {
                dbConnectionPool.getConnection((err, connection) => {
                    if (err) {
                        reject(commonErrors.failedToConnectDbStatus500);
                        return;
                    }
                    var errMsg = {
                        message: "An error has occurred while retrieving the target account.",
                        httpStatus: 500,
                        success: false,
                        connectionToDrop: connection
                    };
                    database.selectFromTable("Account", "account_id=" + listFilesData.targetAccountId, connection).then((results) => {
                        if (results.length == 0) {
                            reject(errMsg);
                            return;
                        }
                        // reject() is straight up unused in fileUtil#processS3Data. So, no need to handle the catch.
                        fileUtil.processS3Data(data_, accountIdPrefix, {
                            email: results[0].email,
                            accountId: listFilesData.targetAccountId
                        }, listFilesData.showNestedFiles, pathPrefix, false, connection).then((s3Data) => {
                            resolve({
                                message: "Successfully retrieved the user's files.",
                                httpStatus: 200,
                                success: true,
                                data: s3Data,
                                connectionToDrop: connection
                            });
                        });
                    }).catch((results) => {
                        reject(errMsg);
                    });
                });
            }
        });
    });
};
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
            connection.query("SELECT file_permissions.id, permission_flags, for_account_id, path, owner_id, is_directory, (SELECT email FROM account WHERE for_account_id = account_id) AS email FROM file_permissions JOIN file ON file_permissions.file_id = file.id AND file.owner_id = " + decodedToken.accountId + " AND file_permissions.accepted = 0", function(err, results, fields) {
                if (err) {
                    reject(errMsg);
                    return;
                }
                var permissionReqs = [];
                for (var i = 0; i < results.length; i++) {
                    permissionReqs.push({
                        requestId: results[i].id,
                        permissionFlags: results[i].permission_flags,
                        forAccount: {
                            accountId: results[i].for_account_id,
                            email: results[i].email
                        },
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
                        requestPermSingleFile(resultsFile[0], decodedToken, requestPermData, errMsg, false, connection).then((result) => {
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
                            promises.push(requestPermSingleFile(resultsFile[i], decodedToken, requestPermData, errMsg, false, connection));
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
