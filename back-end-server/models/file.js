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

module.exports.downloadFile = function(dlFileData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(dlFileData) || objectUtil.isNullOrUndefined(dlFileData.filePath)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        try {
            var decodedToken = jsonWebToken.verify(dlFileData.loginToken, appConstants.jwtSecretKey);
            dlFileData.filePath = decodedToken.accountId + "/" + fileUtil.formatFilePath(dlFileData.filePath);
            var s3Params = {
                Bucket: appConstants.awsBucketName,
                Key: dlFileData.filePath
            };
            s3.getSignedUrl("getObject", s3Params, (err, url) => {
                if (err) {
                    reject(commonErrors.failedToQueryS3Status500);
                } else {
                    resolve({
                        message: "Successfully retrieved a signed S3 URL for downloading a file.",
                        httpStatus: 200,
                        success: true,
                        signedUrl: url
                    });
                }
            });
        } catch (err) {
            reject(commonErrors.loginTokenInvalidStatus401);
        }
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
        try {
            var decodedToken = jsonWebToken.verify(moveOrCopyFileData.loginToken, appConstants.jwtSecretKey);
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
            if (moveOrCopyFileData.isDirectory) {
                var s3Params = {
                    Bucket: appConstants.awsBucketName,
                    MaxKeys: appConstants.awsMaxKeys,
                    Prefix: moveOrCopyFileData.srcPath
                };
                s3.listObjectsV2(s3Params, (err, data_) => {
                    if (err) {
                        reject(commonErrors.failedToQueryS3Status500);
                    } else {
                        var s3Promises = [];
                        for (var i = 0; i < data_.Contents.length; i++) {
                            if (data_.Contents[i].Key != s3Params.Prefix) {
                                if (move) {
                                    s3Promises.push(s3Helper.moveObject(moveOrCopyFileData.destPath + data_.Contents[i].Key.substring(moveOrCopyFileData.srcPath.length), data_.Contents[i].Key, s3));
                                } else {
                                    s3Promises.push(s3Helper.copyObject(moveOrCopyFileData.destPath + data_.Contents[i].Key.substring(moveOrCopyFileData.srcPath.length), data_.Contents[i].Key, s3));
                                }
                            }
                        }
                        Promise.all(s3Promises).then((successful) => {
                            resolve({
                                message: move ? "Successfully moved a directory to its target path." : "Successfully copied a directory to its target path.",
                                httpStatus: 200,
                                success: true
                            });
                        }).catch((successful) => {
                            reject(commonErrors.failedToMoveS3ObjStatus500);
                        });
                    }
                });
            } else {
                if (move) {
                    s3Helper.moveObject(moveOrCopyFileData.destPath, moveOrCopyFileData.srcPath, s3).then((successful) => {
                        resolve({
                            message: "Successfully moved a file to its target path.",
                            httpStatus: 200,
                            success: true
                        });
                    }).catch((successful) => {
                        reject(commonErrors.failedToMoveS3ObjStatus500);
                    });
                } else {
                    s3Helper.copyObject(moveOrCopyFileData.destPath, moveOrCopyFileData.srcPath, s3).then((successful) => {
                        resolve({
                            message: "Successfully copied a file to its target path.",
                            httpStatus: 200,
                            success: true
                        });
                    }).catch((successful) => {
                        reject(commonErrors.failedToMoveS3ObjStatus500);
                    });
                }
            }
        } catch (err) {
            reject(commonErrors.loginTokenInvalidStatus401);
        }
    });
};
module.exports.deleteFile = function(deleteFileData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(deleteFileData) || objectUtil.isNullOrUndefined(deleteFileData.path) || objectUtil.isNullOrUndefined(deleteFileData.isDirectory)
        || deleteFileData.isDirectory != true && deleteFileData.isDirectory != false) {
            reject(commonErrors.genericStatus400);
            return;
        }
        try {
            var decodedToken = jsonWebToken.verify(deleteFileData.loginToken, appConstants.jwtSecretKey);
            var recyclePath = decodedToken.accountId + "_recycle/" + fileUtil.formatFilePath(deleteFileData.path);
            deleteFileData.path = decodedToken.accountId + "/" + fileUtil.formatFilePath(deleteFileData.path);
            if (deleteFileData.isDirectory) {
                var s3Params = {
                    Bucket: appConstants.awsBucketName,
                    MaxKeys: appConstants.awsMaxKeys,
                    Prefix: deleteFileData.path
                };
                s3.listObjectsV2(s3Params, (err, data_) => {
                    if (err) {
                        reject(commonErrors.failedToQueryS3Status500);
                    } else {
                        var s3Promises = [];
                        for (var i = 0; i < data_.Contents.length; i++) {
                            if (data_.Contents[i].Key != s3Params.Prefix) {
                                s3Promises.push(s3Helper.moveObject(decodedToken.accountId + "_recycle/" + 
                                    data_.Contents[i].Key.substring(("" + decodedToken.accountId + "/").length), data_.Contents[i].Key, s3));
                            }
                        }
                        Promise.all(s3Promises).then((successful) => {
                            resolve({
                                message: "Successfully deleted all files from the specified directory into the recycle bin.",
                                httpStatus: 200,
                                success: true
                            });
                        }).catch((successful) => {
                            reject(commonErrors.failedToMoveS3ObjStatus500);
                        });
                    }
                });
            } else {
                s3Helper.moveObject(recyclePath, deleteFileData.path, s3).then((successful) => {
                    resolve({
                        message: "Successfully deleted a file into the recycle bin.",
                        httpStatus: 200,
                        success: true
                    });
                }).catch((successful) => {
                    reject(commonErrors.failedToMoveS3ObjStatus500);
                });
            }
        } catch (err) {
            reject(commonErrors.loginTokenInvalidStatus401);
        }
    });
};
module.exports.makeDir = function(makeDirData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(makeDirData) || objectUtil.isNullOrUndefined(makeDirData.dirPath)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        try {
            var decodedToken = jsonWebToken.verify(makeDirData.loginToken, appConstants.jwtSecretKey);
            makeDirData.dirPath = fileUtil.formatFilePath(makeDirData.dirPath);
            var s3Params = {
                Bucket: appConstants.awsBucketName,
                Prefix: decodedToken.accountId + "/" + makeDirData.dirPath + "/",
                MaxKeys: 1
            };
            s3.listObjectsV2(s3Params, (err, data) => {
                if (err) {
                    reject({
                        message: "Failed to check if the S3 directory is empty or not.",
                        httpStatus: 500,
                        success: false
                    });
                    return;
                }
                if (data.KeyCount > 0) {
                    reject({
                        message: "The specified S3 directory must be empty beforehand to be created.",
                        httpStatus: 401,
                        success: false
                    });
                    return;
                }
                s3Params = {
                    Bucket: appConstants.awsBucketName,
                    Key: decodedToken.accountId + "/" + makeDirData.dirPath + "/" + appConstants.dirPlaceholderFile
                };
                s3.putObject(s3Params, (s3Err2, s3Data2) => {
                    if (s3Err2) {
                        reject({
                            message: "Failed to create the empty directory.",
                            httpStatus: 500,
                            success: false
                        });
                        return;
                    }
                    resolve({
                        message: "Successfully created the empty directory.",
                        httpStatus: 200,
                        success: true
                    });
                });
            });
        } catch (err) {
            reject(commonErrors.loginTokenInvalidStatus401);
        }
    });
};
module.exports.listFiles = function(listFilesData, isRecycleBin) {
    return new Promise((resolve, reject) => {
        var reqObjInvalid = objectUtil.isNullOrUndefined(listFilesData);
        if (!reqObjInvalid && objectUtil.isUndefined(listFilesData.dirPath)) {
            listFilesData.dirPath = null;
        }
        if (reqObjInvalid || listFilesData.dirPath != null && listFilesData.dirPath.length == 0) {
            reject(commonErrors.genericStatus400);
            return;
        }
        if (objectUtil.isNullOrUndefined(listFilesData.maxFiles)) {
            listFilesData.maxFiles = appConstants.awsMaxKeys;
        }
        if (listFilesData.dirPath != null) {
            listFilesData.dirPath = fileUtil.formatFilePath(listFilesData.dirPath);
        }
        try {
            var decodedToken = jsonWebToken.verify(listFilesData.loginToken, appConstants.jwtSecretKey);
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
                    reject(commonErrors.failedToQueryS3Status500);
                } else {
                    data_ = fileUtil.processS3Data(data_, accountIdPrefix, {
                        email: decodedToken.email,
                        accountId: decodedToken.accountId
                    });
                    resolve({
                        message: isRecycleBin ? "Successfully retrieved the user's deleted files." : "Successfully retrieved the user's files.",
                        httpStatus: 200,
                        success: true,
                        data: data_
                    });
                }
            });
        } catch (err) {
            reject(commonErrors.loginTokenInvalidStatus401);
        }
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
        if (signUrlData.filePath.endsWith("/" + appConstants.dirPlaceholderFile) || dirSeparator == -1 && signUrlData.filePath.equals(appConstants.dirPlaceholderFile)) {
            reject({
                message: "Invalid filename specified.",
                httpStatus: 401,
                success: false
            });
            return;
        }
        try {
            var decodedToken = jsonWebToken.verify(signUrlData.loginToken, appConstants.jwtSecretKey);
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
                            success: false
                        });
                        return;
                    }
                    s3Params = {
                        Bucket: appConstants.awsBucketName,
                        Key: !signUrlData.filePath.includes("/") ? duplicateKeyId : 
                            decodedToken.accountId + "/" + signUrlData.filePath.substring(0, signUrlData.filePath.lastIndexOf("/")) + "/" + appConstants.dirPlaceholderFile
                    };
                    s3.deleteObject(s3Params, (s3Err2, s3Data2) => {
                        if (s3Err2) {
                            reject({
                                message: "An error has occurred while trying to delete the placeholder file.",
                                httpStatus: 500,
                                success: false
                            });
                        } else {
                            resolve({
                                message: "Successfully retrieved a signed S3 URL.",
                                httpStatus: 200,
                                success: true,
                                signedUrl: "https://" + appConstants.awsBucketName + ".s3.amazonaws.com/" + decodedToken.accountId + "/" + encodeURIComponent(signUrlData.filePath),
                                signedUrlData: data
                            });
                        }
                    });
                });
            }).catch((err) => {
                reject({
                    message: "An error has occurred while trying to retrieve a unique S3 bucket key name.",
                    httpStatus: 500,
                    success: false
                })
            });
        } catch (err) {
            reject(commonErrors.loginTokenInvalidStatus401);
        }
    });
};
