const jsonWebToken = require("jsonwebtoken");
const objectUtil = require("../objectUtil");
const appConstants = require("../config/appConstants");
const accountModel = require("../models/account");
const awsSdk = require("aws-sdk");
const fileUtil = require("./fileUtil");

var s3  = new awsSdk.S3({
    accessKeyId: appConstants.awsAccessKeyId,
    secretAccessKey: appConstants.awsAccessSecretKey,
    region: appConstants.awsRegion
});

module.exports.makeDir = function(makeDirData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(makeDirData) || objectUtil.isNullOrUndefined(makeDirData.dirPath)) {
            reject({
                message: "Malformed request. Trying to hack the server?",
                httpStatus: 400,
                success: false
            });
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
            reject({
                message: "Login token is invalid.",
                httpStatus: 401,
                success: false
            });
        }
    });
};
module.exports.listFiles = function(listFilesData) {
    return new Promise((resolve, reject) => {
        var reqObjInvalid = objectUtil.isNullOrUndefined(listFilesData);
        if (!reqObjInvalid && objectUtil.isUndefined(listFilesData.dirPath)) {
            listFilesData.dirPath = null;
        }
        if (reqObjInvalid || listFilesData.dirPath != null && listFilesData.dirPath.length == 0) {
            reject({
                message: "Malformed request. Trying to hack the server?",
                httpStatus: 400,
                success: false
            });
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
            var pathPrefix = "" + decodedToken.accountId + "/";
            var accountIdPrefix = pathPrefix;
            if (listFilesData.dirPath != null) {
                pathPrefix += listFilesData.dirPath + "/";
            }
            var s3Params = {
                Bucket: appConstants.awsBucketName,
                MaxKeys: appConstants.awsMaxKeys,
                Prefix: pathPrefix
            };
            s3.listObjectsV2(s3Params, (err, data) => {
                if (err) {
                    reject({
                        message: "Failed to query S3 for the user's files.",
                        httpStatus: 500,
                        success: false
                    });
                } else {
                    data = fileUtil.filterSensitiveData(data, accountIdPrefix);
                    resolve({
                        message: "Successfully retrieved the user's files.",
                        httpStatus: 200,
                        success: true,
                        s3Data: data
                    });
                }
            });
        } catch (err) {
            reject({
                message: "Login token is invalid.",
                httpStatus: 401,
                success: false
            });
        }
    });
};
module.exports.getSignedUrl = function(signUrlData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(signUrlData) || objectUtil.isNullOrUndefined(signUrlData.filePath) || signUrlData.filePath.length == 0 || 
            objectUtil.isNullOrUndefined(signUrlData.fileType)) {
                reject({
                    message: "Malformed request. Trying to hack the server?",
                    httpStatus: 400,
                    success: false
                });
                return;
        }
        signUrlData.filePath = fileUtil.formatFilePath(signUrlData.filePath);
        if (signUrlData.filePath.endsWith("/" + appConstants.dirPlaceholderFile)) {
            reject({
                message: "Invalid filename specified.",
                httpStatus: 401,
                success: false
            });
            return;
        }
        try {
            var decodedToken = jsonWebToken.verify(signUrlData.loginToken, appConstants.jwtSecretKey);
            var s3Params = {
                Bucket: appConstants.awsBucketName,
                Key: decodedToken.accountId + "/" + signUrlData.filePath,
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
                    Key: !signUrlData.filePath.includes("/") ? decodedToken.accountId + "/" + signUrlData.filePath : 
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
        } catch (err) {
            reject({
                message: "Login token is invalid.",
                httpStatus: 401,
                success: false
            });
        }
    });
};
