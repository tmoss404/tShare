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

module.exports.listFiles = function(listFilesData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(listFilesData) || objectUtil.isUndefined(listFilesData.dirPath) || listFilesData.dirPath != null && listFilesData.dirPath.length == 0) {
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
            var s3Params = {
                Bucket: appConstants.awsBucketName,
                MaxKeys: appConstants.awsMaxKeys
            };
            s3.listObjectsV2(s3Params, (err, data) => {
                if (err) {
                    reject({
                        message: "Failed to query S3 for the user's files.",
                        httpStatus: 500,
                        success: false
                    });
                } else {
                    var files = [];
                    for (var i = 0; i < data.Contents.length && files.length < listFilesData.maxFiles; i++) {
                        var s3File = data.Contents[i];
                        var accountDir = "" + decodedToken.accountId + "/";
                        if (!s3File.Key.startsWith(accountDir) || listFilesData.dirPath != null && !s3File.Key.startsWith(accountDir + listFilesData.dirPath + "/")) {
                            continue;
                        }
                        files.push(s3File);
                    }
                    resolve({
                        message: "Successfully retrieved the user's files.",
                        httpStatus: 200,
                        success: true,
                        s3Data: files
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
            objectUtil.isNullOrUndefined(signUrlData.fileType) || signUrlData.fileType.length == 0) {
                reject({
                    message: "Malformed request. Trying to hack the server?",
                    httpStatus: 400,
                    success: false
                });
                return;
        }
        signUrlData.filePath = fileUtil.formatFilePath(signUrlData.filePath);
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
                resolve({
                    message: "Successfully retrieved a signed S3 URL.",
                    httpStatus: 200,
                    success: true,
                    signedUrl: "https://" + appConstants.awsBucketName + ".s3.amazonaws.com/" + decodedToken.accountId + "/" + encodeURIComponent(signUrlData.filePath),
                    signedUrlData: data
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
