const appConstants = require("../config/appConstants");
const axios = require("axios");
const fileUtil = require("./fileUtil");

module.exports.getNewDuplicateKeyName = function(s3Key, duplicateId, s3) {
    return new Promise((resolve, reject) => {
        var duplicateKeyId;
        if (duplicateId == 0) {
            duplicateKeyId = s3Key;
        } else if (s3Key.includes(".")) {
            duplicateKeyId = s3Key.substring(0, s3Key.lastIndexOf(".")) + "_" + duplicateId + s3Key.substring(s3Key.lastIndexOf("."));
        } else {
            duplicateKeyId = s3Key + "_" + duplicateId;
        }
        var s3Params = {
            Bucket: appConstants.awsBucketName,
            Key: duplicateKeyId
        };
        s3.getObject(s3Params, (err, data) => {
            if (err && err.code == "NoSuchKey") {
                resolve(duplicateKeyId);
            } else if (err) {
                reject(err);
            } else {
                ++duplicateId;
                module.exports.getNewDuplicateKeyName(s3Key, duplicateId, s3).then((dupeKeyId) => {
                    resolve(dupeKeyId);
                }).catch((err) => {
                    reject(err);
                });
            }
        });
    });
};
module.exports.copyObject = function(dest, src, s3, srcOwnerId, dbConnection) {
    return new Promise((resolve, reject) => {
        module.exports.getNewDuplicateKeyName(dest, 0, s3).then((duplicateKeyId) => {
            dest = duplicateKeyId;
            var acl = "public-read";
            var contentType = "application/octet-stream";
            var s3Params = {
                Bucket: appConstants.awsBucketName,
                Key: dest,
                CopySource: encodeURIComponent(appConstants.awsBucketName + "/" + src),
                ContentType: contentType,
                ACL: acl
            };
            s3.getSignedUrl("copyObject", s3Params, (err, signedUrlData) => {
                if (err) {
                    reject(err);
                    return;
                }
                axios({
                    method: "put",
                    url: signedUrlData,
                    headers: {
                        "x-amz-copy-source": src,
                        "Content-Type": contentType,
                        "x-amz-acl": acl
                    }
                }).then((res) => {
                    s3Params = {
                        Bucket: appConstants.awsBucketName,
                        Key: src
                    };
                    var errMsg = "An error has occurred while updating a file record for a copy operation.";
                    fileUtil.updateFileRecords(dest, srcOwnerId, false, dest, dbConnection).then((successStatus) => {
                        if (successStatus) {
                            resolve(true);
                        } else {
                            reject(errMsg);
                        }
                    }).catch((successStatus) => {
                        reject(errMsg);
                    });
                }).catch((err) => {
                    reject(err);
                });
            });
        }).catch((err) => {
            reject(err);
        });
    });
};
module.exports.moveObject = function(dest, src, s3, srcOwnerId, dbConnection) {
    return new Promise((resolve, reject) => {
        module.exports.getNewDuplicateKeyName(dest, 0, s3).then((duplicateKeyId) => {
            dest = duplicateKeyId;
            var acl = "public-read";
            var contentType = "application/octet-stream";
            var s3Params = {
                Bucket: appConstants.awsBucketName,
                Key: dest,
                CopySource: encodeURIComponent(appConstants.awsBucketName + "/" + src),
                ContentType: contentType,
                ACL: acl
            };
            s3.getSignedUrl("copyObject", s3Params, (err, signedUrlData) => {
                if (err) {
                    reject(err);
                    return;
                }
                axios({
                    method: "put",
                    url: signedUrlData,
                    headers: {
                        "x-amz-copy-source": src,
                        "Content-Type": contentType,
                        "x-amz-acl": acl
                    }
                }).then((res) => {
                    s3Params = {
                        Bucket: appConstants.awsBucketName,
                        Key: src
                    };
                    s3.deleteObject(s3Params, (err, deleteObjData) => {
                        if (err) {
                            reject(err);
                        }
                        var errMsg = "An error has occurred while updating a file record for a move operation.";
                        fileUtil.updateFileRecords(dest, srcOwnerId, false, src, dbConnection).then((successStatus) => {
                            if (successStatus) {
                                resolve(true);
                            } else {
                                reject(errMsg);
                            }
                        }).catch((successStatus) => {
                            reject(errMsg);
                        });
                    });
                }).catch((err) => {
                    reject(err);
                });
            });
        }).catch((err) => {
            reject(err);
        });
    });
};
