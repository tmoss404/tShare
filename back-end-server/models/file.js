const jsonWebToken = require("jsonwebtoken");
const objectUtil = require("../objectUtil");
const appConstants = require("../config/appConstants");
const accountModel = require("../models/account");
const awsSdk = require("aws-sdk");
const fileUtil = require("./fileUtil");
const s3Helper = require("./s3Helper");
const commonErrors = require("./commonErrors");

var s3  = new awsSdk.S3({
    accessKeyId: appConstants.awsAccessKeyId,
    secretAccessKey: appConstants.awsAccessSecretKey,
    region: appConstants.awsRegion
});
var dbConnectionPool;

module.exports.downloadFile = function(dlFileData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(dlFileData) || objectUtil.isNullOrUndefined(dlFileData.filePath)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = dlFileData.decodedToken;
        dlFileData.filePath = decodedToken.accountId + "/" + fileUtil.formatFilePath(dlFileData.filePath);
        var s3Params = {
            Bucket: appConstants.awsBucketName,
            Key: dlFileData.filePath
        };
        s3.getSignedUrl("getObject", s3Params, (err, url) => {
            if (err) {
                reject(commonErrors.createFailedToQueryS3Status500());
            } else {
                resolve({
                    message: "Successfully retrieved a signed S3 URL for downloading a file.",
                    httpStatus: 200,
                    success: true,
                    signedUrl: url
                });
            }
        });
    });
};
module.exports.moveOrCopyFile = function(moveOrCopyFileData, move) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(moveOrCopyFileData) || objectUtil.isNullOrUndefined(moveOrCopyFileData.isDirectory) ||
            moveOrCopyFileData.isDirectory != false && moveOrCopyFileData.isDirectory != true || objectUtil.isNullOrUndefined(moveOrCopyFileData.srcPath) ||
            objectUtil.isNullOrUndefined(moveOrCopyFileData.destPath)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = moveOrCopyFileData.decodedToken;
        moveOrCopyFileData.srcPath = decodedToken.accountId + "/" + fileUtil.formatFilePath(moveOrCopyFileData.srcPath);
        moveOrCopyFileData.destPath = decodedToken.accountId + "/" + fileUtil.formatFilePath(moveOrCopyFileData.destPath);
        if (moveOrCopyFileData.srcPath == moveOrCopyFileData.destPath) {
            reject({
                message: "srcPath and destPath cannot be equal for this operation.",
                httpStatus: 403,
                success: false
            });
            return;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var splitPath = moveOrCopyFileData.destPath.split("/");
            var promises = [];
            for (var i = 0; i < (moveOrCopyFileData.isDirectory ? splitPath.length : splitPath.length - 1); i++) {
                var subPath = "";
                for (var j = 0; j <= i; j++) {
                    subPath += splitPath[j];
                    if (j != i) {
                        subPath += "/";
                    }
                }
                promises.push(new Promise((resolve, reject) => {
                    var path = subPath;
                    s3.putObject({
                        Bucket: appConstants.awsBucketName,
                        Key: path + "/" + appConstants.dirPlaceholderFile
                    }, (err, data) => {
                        if (err) {
                            reject();
                            return;
                        }
                        fileUtil.updateFileRecords(path, decodedToken.accountId, true, path, connection).then((successStatus) => {
                            if (successStatus) {
                                resolve();
                            } else {
                                reject();
                            }
                        }).catch((successStatus) => {
                            reject();
                        });
                    });
                }));
            }
            Promise.all(promises).then(() => {
                if (!moveOrCopyFileData.isDirectory) {
                    s3Helper.copyObject(moveOrCopyFileData.destPath, moveOrCopyFileData.srcPath, s3, decodedToken.accountId, connection).then((successful) => {
                        if (move) {
                            s3.deleteObject({
                                Bucket: appConstants.awsBucketName,
                                Key: moveOrCopyFileData.srcPath
                            }, (err, data) => {
                                if (err) {
                                    reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                                } else {
                                    splitPath = moveOrCopyFileData.srcPath.split("/");
                                    promises = [];
                                    for (var i = splitPath.length - 1 - 1; i >= 0; i--) {
                                        var subPath = "";
                                        for (var j = 0; j <= i; j++) {
                                            subPath += splitPath[j];
                                            if (j != i) {
                                                subPath += "/";
                                            }
                                        }
                                        promises.push(new Promise((resolve, reject) => {
                                            s3.listObjectsV2({
                                                Bucket: appConstants.awsBucketName,
                                                MaxKeys: 2,
                                                Prefix: subPath
                                            }, (err, data) => {
                                                if (err) {
                                                    reject();
                                                } else {
                                                    var hasFiles = false;
                                                    for (var k = 0; k < data.Contents.length; k++) {
                                                        if (!data.Contents[k].Key.endsWith("/" + appConstants.dirPlaceholderFile)) {
                                                            hasFiles = true;
                                                            break;
                                                        }
                                                    }
                                                    if (!hasFiles) {
                                                        s3.deleteObject({
                                                            Bucket: appConstants.awsBucketName,
                                                            Key: subPath + "/" + appConstants.dirPlaceholderFile
                                                        }, (err, data) => {
                                                            if (err) {
                                                                reject();
                                                            } else {
                                                                fileUtil.updateFileRecords(subPath, decodedToken.accountId, true, subPath, connection, s3).then((results) => {
                                                                    resolve();
                                                                }).catch((results) => {
                                                                    reject();
                                                                });
                                                            }
                                                        });
                                                    } else {
                                                        fileUtil.updateFileRecords(subPath, decodedToken.accountId, true, subPath, connection, s3).then((results) => {
                                                            resolve();
                                                        }).catch((results) => {
                                                            reject();
                                                        });
                                                    }
                                                }
                                            });
                                        }));
                                    }
                                    Promise.all(promises).then((results) => {
                                        fileUtil.updateFileRecords(moveOrCopyFileData.destPath, decodedToken.accountId, false, moveOrCopyFileData.srcPath, connection, s3).then((results) => {
                                            resolve({
                                                message: "Successfully moved a file to its target path.",
                                                httpStatus: 200,
                                                success: true,
                                                connectionToDrop: connection
                                            });
                                        }).catch((results) => {
                                            reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                                        });
                                    }).catch((results) => {
                                        reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                                    });
                                }
                            });
                        } else {
                            fileUtil.updateFileRecords(moveOrCopyFileData.destPath, decodedToken.accountId, false, moveOrCopyFileData.destPath, connection, s3).then((results) => {
                                resolve({
                                    message: "Successfully copied a file to its target path.",
                                    httpStatus: 200,
                                    success: true,
                                    connectionToDrop: connection
                                });
                            }).catch((results) => {
                                reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                            });
                        }
                    }).catch((successful) => {
                        reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                    });
                } else {
                    splitPath = moveOrCopyFileData.srcPath.split("/");
                    promises = [];
                    for (var i = splitPath.length - 1; i >= 0; i--) {
                        var subPath = "";
                        for (var j = 0; j <= i; j++) {
                            subPath += splitPath[j];
                            if (j != i) {
                                subPath += "/";
                            }
                        }
                        promises.push(new Promise((resolve, reject) => {
                            s3.listObjectsV2({
                                Bucket: appConstants.awsBucketName,
                                MaxKeys: 2,
                                Prefix: subPath
                            }, (err, data) => {
                                if (err) {
                                    reject();
                                } else {
                                    var hasFiles = false;
                                    for (var k = 0; k < data.Contents.length; k++) {
                                        if (!data.Contents[k].Key.endsWith("/" + appConstants.dirPlaceholderFile)) {
                                            hasFiles = true;
                                            break;
                                        }
                                    }
                                    if (!hasFiles) {
                                        s3.deleteObject({
                                            Bucket: appConstants.awsBucketName,
                                            Key: subPath + "/" + appConstants.dirPlaceholderFile
                                        }, (err, data) => {
                                            if (err) {
                                                reject();
                                            } else {
                                                fileUtil.updateFileRecords(subPath, decodedToken.accountId, true, subPath, connection, s3).then((results) => {
                                                    resolve();
                                                }).catch((results) => {
                                                    reject();
                                                });
                                            }
                                        });
                                    } else {
                                        fileUtil.updateFileRecords(subPath, decodedToken.accountId, true, subPath, connection, s3).then((results) => {
                                            resolve();
                                        }).catch((results) => {
                                            reject();
                                        });
                                    }
                                }
                            });
                        }));
                    }
                    Promise.all(promises).then((results) => {
                        resolve({
                            message: "Successfully moved a directory to its target path.",
                            httpStatus: 200,
                            success: true,
                            connectionToDrop: connection
                        });
                    }).catch((results) => {
                        reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                    });
                }
            }).catch(() => {
                reject({
                    message: "Failed to create a sub-directory for a " + (move ? "move operation." : "copy operation."),
                    httpStatus: 500,
                    success: false,
                    connectionToDrop: connection
                });
            });
        });
    });
};
module.exports.deleteFile = function(deleteFileData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(deleteFileData) || objectUtil.isNullOrUndefined(deleteFileData.path) || objectUtil.isNullOrUndefined(deleteFileData.isDirectory)
            || deleteFileData.isDirectory != true && deleteFileData.isDirectory != false) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = deleteFileData.decodedToken;
        var recyclePath = decodedToken.accountId + "_recycle/" + fileUtil.formatFilePath(deleteFileData.path);
        deleteFileData.path = decodedToken.accountId + "/" + fileUtil.formatFilePath(deleteFileData.path);
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            if (deleteFileData.isDirectory) {
                var s3Params = {
                    Bucket: appConstants.awsBucketName,
                    MaxKeys: appConstants.awsMaxKeys,
                    Prefix: deleteFileData.path
                };
                s3.listObjectsV2(s3Params, (err, data_) => {
                    if (err) {
                        reject(commonErrors.createFailedToQueryS3Status500(connection));
                    } else {
                        var operationPromises = [];
                        for (var i = 0; i < data_.Contents.length; i++) {
                            if (data_.Contents[i].Key != s3Params.Prefix) {
                                operationPromises.push(s3Helper.moveObject(decodedToken.accountId + "_recycle/" +
                                    data_.Contents[i].Key.substring(("" + decodedToken.accountId + "/").length), data_.Contents[i].Key, s3, decodedToken.accountId, connection));
                            }
                        }
                        Promise.all(operationPromises).then((successful) => {
                            fileUtil.updateFileRecords(recyclePath, decodedToken.accountId, true, deleteFileData.path, connection, s3).then((results) => {
                                resolve({
                                    message: "Successfully deleted all files from the specified directory into the recycle bin.",
                                    httpStatus: 200,
                                    success: true,
                                    connectionToDrop: connection
                                });
                            }).catch((results) => {
                                reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                            });
                        }).catch((successful) => {
                            reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                        });
                    }
                });
            } else {
                s3Helper.moveObject(recyclePath, deleteFileData.path, s3, decodedToken.accountId, connection).then((successful) => {
                    fileUtil.updateFileRecords(recyclePath, decodedToken.accountId, false, deleteFileData.path, connection, s3).then((results) => {
                        resolve({
                            message: "Successfully deleted a file into the recycle bin.",
                            httpStatus: 200,
                            success: true,
                            connectionToDrop: connection
                        });
                    }).catch((results) => {
                        reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                    });
                }).catch((successful) => {
                    reject(commonErrors.createFailedToDupS3ObjStatus500(connection));
                });
            }
        });
    });
};
module.exports.makeDir = function(makeDirData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(makeDirData) || objectUtil.isNullOrUndefined(makeDirData.dirPath)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = makeDirData.decodedToken;
        makeDirData.dirPath = fileUtil.formatFilePath(makeDirData.dirPath);
        var s3Params = {
            Bucket: appConstants.awsBucketName,
            Prefix: decodedToken.accountId + "/" + makeDirData.dirPath + "/",
            MaxKeys: 1
        };
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            s3.listObjectsV2(s3Params, (err, data) => {
                if (err) {
                    reject({
                        message: "Failed to check if the S3 directory is empty or not.",
                        httpStatus: 500,
                        success: false,
                        connectionToDrop: connection
                    });
                    return;
                }
                if (data.KeyCount > 0) {
                    reject({
                        message: "The specified S3 directory must be empty beforehand to be created.",
                        httpStatus: 401,
                        success: false,
                        connectionToDrop: connection
                    });
                    return;
                }
                s3Params = {
                    Bucket: appConstants.awsBucketName,
                    Key: decodedToken.accountId + "/" + makeDirData.dirPath + "/" + appConstants.dirPlaceholderFile
                };
                var failMsg = {
                    message: "Failed to create the empty directory.",
                    httpStatus: 500,
                    success: false,
                    connectionToDrop: connection
                };
                s3.putObject(s3Params, (s3Err2, s3Data2) => {
                    if (s3Err2) {
                        reject(failMsg);
                        return;
                    }
                    var s3Directory = decodedToken.accountId + "/" + makeDirData.dirPath;
                    fileUtil.updateFileRecords(s3Directory, decodedToken.accountId, true, s3Directory, connection, s3).then((successStatus) => {
                        if (successStatus) {
                            resolve({
                                message: "Successfully created the empty directory.",
                                httpStatus: 200,
                                success: true,
                                connectionToDrop: connection
                            });
                        } else {
                            reject(failMsg);
                        }
                    }).catch((successStatus) => {
                        reject(failMsg);
                    });
                });
            });
        });
    });
};
module.exports.listFiles = function(listFilesData, isRecycleBin) {
    return new Promise((resolve, reject) => {
        var reqObjInvalid = objectUtil.isNullOrUndefined(listFilesData);
        if (!reqObjInvalid && objectUtil.isUndefined(listFilesData.dirPath)) {
            listFilesData.dirPath = null;
        }
        if (reqObjInvalid || listFilesData.dirPath != null && listFilesData.dirPath.length == 0 || listFilesData.showNestedFiles != false && listFilesData.showNestedFiles != true || !objectUtil.isNullOrUndefined(listFilesData.onlyDirs) && listFilesData.onlyDirs != false && listFilesData.onlyDirs != true) {
            reject(commonErrors.genericStatus400);
            return;
        }
        if (objectUtil.isNullOrUndefined(listFilesData.maxFiles)) {
            listFilesData.maxFiles = appConstants.awsMaxKeys;
        }
        if (listFilesData.dirPath != null) {
            listFilesData.dirPath = fileUtil.formatFilePath(listFilesData.dirPath);
        }
        var decodedToken = listFilesData.decodedToken;
        var pathPrefix = "" + decodedToken.accountId + (isRecycleBin ? "_recycle/" : "/");
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
                    // reject() is straight up unused in fileUtil#processS3Data. So, no need to handle the catch.
                    fileUtil.processS3Data(data_, accountIdPrefix, {
                        email: decodedToken.email,
                        accountId: decodedToken.accountId
                    }, listFilesData.showNestedFiles, pathPrefix, listFilesData.onlyDirs, connection).then((s3Data) => {
                        resolve({
                            message: isRecycleBin ? "Successfully retrieved the user's deleted files." : "Successfully retrieved the user's files.",
                            httpStatus: 200,
                            success: true,
                            data: s3Data,
                            connectionToDrop: connection
                        });
                    });
                });
            }
        });
    });
};
module.exports.cancelUpload = function(cancelUploadData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(cancelUploadData) || objectUtil.isNullOrUndefined(cancelUploadData.filePath) || cancelUploadData.filePath.length == 0) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = cancelUploadData.decodedToken;
        cancelUploadData.filePath = decodedToken.accountId + "/" + fileUtil.formatFilePath(cancelUploadData.filePath);
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            fileUtil.deleteEmptyFileRecords(cancelUploadData.filePath, decodedToken.accountId, connection, s3).then((results) => {
                var pathDirSep = cancelUploadData.filePath.lastIndexOf("/");
                var pathPrefix = pathDirSep == -1 ? cancelUploadData.filePath : cancelUploadData.filePath.substring(0, pathDirSep);
                var s3Params = {
                    Bucket: appConstants.awsBucketName,
                    MaxKeys: 1,
                    Prefix: pathPrefix
                };
                var resolveMsg = {
                    message: "Successfully cancelled a pending upload.",
                    httpStatus: 200,
                    success: true,
                    connectionToDrop: connection
                };
                s3.listObjectsV2(s3Params, (err, data) => {
                    if (err) {
                        reject(commonErrors.createFailedToQueryS3Status500(connection));
                    } else if (data.KeyCount == 0) {
                        s3Params = {
                            Bucket: appConstants.awsBucketName,
                            Key: pathPrefix + "/" + appConstants.dirPlaceholderFile
                        };
                        s3.putObject(s3Params, (err, data) => {
                            if (err) {
                                reject({
                                    message: "An error has occurred while re-adding a directory placeholder file.",
                                    httpStatus: 500,
                                    success: false,
                                    connectionToDrop: connection
                                });
                            } else {
                                resolve(resolveMsg);
                            }
                        });
                    } else {
                        resolve(resolveMsg);
                    }
                });
            }).catch((results) => {
                reject({
                    message: "An error has occurred while deleting a file record.",
                    httpStatus: 500,
                    success: false,
                    connectionToDrop: connection
                });
            });
        });
    });
};
module.exports.getSignedUrl = function(signUrlData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(signUrlData) || objectUtil.isNullOrUndefined(signUrlData.filePath) || signUrlData.filePath.length == 0 ||
            objectUtil.isNullOrUndefined(signUrlData.fileType)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        signUrlData.filePath = fileUtil.formatFilePath(signUrlData.filePath);
        var dirSeparator = signUrlData.filePath.lastIndexOf("/");
        if (signUrlData.filePath.endsWith("/" + appConstants.dirPlaceholderFile) || dirSeparator == -1 && signUrlData.filePath == appConstants.dirPlaceholderFile) {
            reject({
                message: "Invalid filename specified.",
                httpStatus: 401,
                success: false
            });
            return;
        }
        var decodedToken = signUrlData.decodedToken;
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            s3Helper.getNewDuplicateKeyName(decodedToken.accountId + "/" + signUrlData.filePath, 0, s3).then((duplicateKeyId) => {
                var s3Params = {
                    Bucket: appConstants.awsBucketName,
                    Key: duplicateKeyId,
                    Expires: appConstants.awsSignedUrlSeconds,
                    ContentType: signUrlData.fileType,
                    ACL: "public-read"
                };
                s3.getSignedUrl("putObject", s3Params, (err, data) => {
                    if (err) {
                        reject({
                            message: "An error has occurred while retrieving a signed S3 URL.",
                            httpStatus: 500,
                            success: false,
                            connectionToDrop: connection
                        });
                        return;
                    }
                    var errMsg = {
                        message: "An error has occurred while creating the new file record.",
                        httpStatus: 500,
                        success: false,
                        connectionToDrop: connection
                    };
                    fileUtil.updateFileRecords(duplicateKeyId, decodedToken.accountId, false, duplicateKeyId, connection, s3).then((successStatus) => {
                        if (successStatus) {
                            resolve({
                                message: "Successfully retrieved a signed S3 URL.",
                                httpStatus: 200,
                                success: true,
                                signedUrl: "https://" + appConstants.awsBucketName + ".s3.amazonaws.com/" + decodedToken.accountId + "/" + encodeURIComponent(signUrlData.filePath),
                                signedUrlData: data,
                                connectionToDrop: connection
                            });
                        } else {
                            reject(errMsg);
                        }
                    }).catch((successStatus) => {
                        reject(errMsg);
                    });
                });
            }).catch((err) => {
                reject({
                    message: "An error has occurred while trying to retrieve a unique S3 bucket key name.",
                    httpStatus: 500,
                    success: false,
                    connectionToDrop: connection
                })
            });
        });
    });
};
module.exports.init = function(connectionPool) {
    dbConnectionPool = connectionPool;
};
