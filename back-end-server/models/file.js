const jsonWebToken = require("jsonwebtoken");
const objectUtil = require("../objectUtil");
const appConstants = require("../config/appConstants");
const accountModel = require("../models/account");
const awsSdk = require("aws-sdk");

var s3  = new awsSdk.S3({
    accessKeyId: appConstants.awsAccessKeyId,
    secretAccessKey: appConstants.awsAccessSecretKey,
    region: appConstants.awsRegion
});

module.exports.getSignedUrl = function(signUrlData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(signUrlData) || objectUtil.isNullOrUndefined(signUrlData.loginToken) || signUrlData.loginToken.length == 0 || 
            objectUtil.isNullOrUndefined(signUrlData.filePath) || signUrlData.filePath.length == 0 || objectUtil.isNullOrUndefined(signUrlData.fileType) || 
            signUrlData.fileType.length == 0) {
                reject({
                    message: "Malformed request. Trying to hack the server?",
                    httpStatus: 400,
                    success: false
                });
                return;
        }
        accountModel.checkLogin(signUrlData).then((message) => {
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
        }).catch((err) => {
            reject(err);
        });
    });
};
