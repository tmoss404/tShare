const objectUtil = require("../objectUtil");
const commonErrors = require("./commonErrors");
const appConstants = require("../config/appConstants");
const fileUtil = require("./fileUtil");
const database = require("../config/database");
const awsSdk = require("aws-sdk");

var s3  = new awsSdk.S3({
    accessKeyId: appConstants.awsAccessKeyId,
    secretAccessKey: appConstants.awsAccessSecretKey,
    region: appConstants.awsRegion
});
var dbConnectionPool;

module.exports.listFavorites = function(listFavoritesData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(listFavoritesData)) {
            reject(commonErrors.genericStatus400);
            return;
        }
        var decodedToken = listFavoritesData.decodedToken;
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            var errMsg = {
                message: "An error has occurred while retreving your favorites.",
                httpStatus: 500,
                success: false,
                connectionToDrop: connection
            };
            database.selectFromTable("Favorite", "owner_id=" + decodedToken.accountId, connection).then((results) => {
                var favoriteList = {
                    IsTruncated: false,
                    "KeyCount": 0,
                    "Name": appConstants.awsBucketName,
                    "Prefix":"",
                    "MaxKeys":1000,
                    "CommonPrefixes":[],
                    "Contents":[]
                };
                if (results.length == 0) {
                    resolve({
                        message: "Successfully retrieved your list of favorites.",
                        httpStatus: 200,
                        success: true,
                        connectionToDrop: connection,
                        favorites: favoriteList
                    });
                } else {
                    var promises = [];
                    for (var i = 0; i < results.length; i++) {
                        var rejectMsg = {
                            message: "Could not find a file with ID " + results[i].file_id,
                            httpStatus: 403,
                            success: false,
                            connectionToDrop: connection
                        };
                        promises.push(new Promise((resolve, reject) => {
                            database.selectFromTable("File", "id=" + results[i].file_id, connection).then((resultsFile) => {
                                if (results.length == 0) {
                                    reject(rejectMsg);
                                    return;
                                }
                                s3.getObject({
                                    Bucket: appConstants.awsBucketName,
                                    Key: resultsFile[0].path
                                }, (err, data) => {
                                    if (err) {
                                        reject(rejectMsg);
                                        return;
                                    }
                                    favoriteList.Contents.push({
                                        "Key": resultsFile[0].is_directory != 0 ? resultsFile[0].path.substring(0, resultsFile[0].path.lastIndexOf("/" + appConstants.dirPlaceholderFile)) : resultsFile[0].path,
                                        "LastModified": data.LastModified,
                                        "ETag": data.ETag,
                                        "Size":data.ContentLength,
                                        "StorageClass":"STANDARD",
                                        isDirectory: resultsFile[0].is_directory != 0,
                                        owner: {
                                            accountId: decodedToken.accountId,
                                            email: decodedToken.email
                                        }
                                    });
                                    ++favoriteList.KeyCount;
                                    resolve();
                                });
                            }).catch((resultsFile) => {
                                reject(rejectMsg);
                            })
                        }));
                    }
                    Promise.all(promises).then((results) => {
                        resolve({
                            message: "Successfully retrieved your list of favorites.",
                            httpStatus: 200,
                            success: true,
                            connectionToDrop: connection,
                            favorites: favoriteList
                        });
                    }).catch((results) => {
                        reject(errMsg);
                    });
                }
            }).catch((results) => {
                reject(errMsg);
            });
        });
    });
};
module.exports.removeFavorite = function(removeFavData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(removeFavData) || objectUtil.isNullOrUndefined(removeFavData.path) || objectUtil.isNullOrUndefined(removeFavData.isDirectory)
            || removeFavData.isDirectory != false && removeFavData.isDirectory != true) {
            reject(commonErrors.genericStatus400);
            return;
        }
        removeFavData.path = fileUtil.formatFilePath(removeFavData.path);
        var decodedToken = removeFavData.decodedToken;
        var fullPath = decodedToken.accountId + "/" + removeFavData.path;
        if (removeFavData.isDirectory) {
            fullPath += "/" + appConstants.dirPlaceholderFile;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            database.selectFromTable("File", "owner_id=" + decodedToken.accountId + " AND path='" + fullPath + "'", connection).then((results) => {
                if (results.length == 0) {
                    reject({
                        message: "Could not find a file that you own with path \"" + fullPath + "\".",
                        httpStatus: 403,
                        success: false,
                        connectionToDrop: connection
                    });
                    return;
                }
                database.deleteFromTable("Favorite", "owner_id=" + decodedToken.accountId + " AND file_id=" + results[0].id, connection).then((results) => {
                    resolve({
                        message: "Successfully removed a favorite.",
                        httpStatus: 200,
                        success: true,
                        connectionToDrop: connection
                    });
                }).catch((results) => {
                    reject({
                        message: "An error has occurred while removing a favorite.",
                        httpStatus: 500,
                        success: false,
                        connectionToDrop: connection
                    });
                });
            }).catch((results) => {
                reject({
                    message: "An error has occurred while retreving the specified file.",
                    httpStatus: 500,
                    success: false,
                    connectionToDrop: connection
                });
            });
        });
    });
};
module.exports.addFavorite = function(addFavData) {
    return new Promise((resolve, reject) => {
        if (objectUtil.isNullOrUndefined(addFavData) || objectUtil.isNullOrUndefined(addFavData.path) || 
            objectUtil.isNullOrUndefined(addFavData.isDirectory) || addFavData.isDirectory != false && addFavData.isDirectory != true) {
            reject(commonErrors.genericStatus400);
            return;
        }
        addFavData.path = fileUtil.formatFilePath(addFavData.path);
        var decodedToken = addFavData.decodedToken;
        var fullPath = decodedToken.accountId + "/" + addFavData.path;
        if (addFavData.isDirectory) {
            fullPath += "/" + appConstants.dirPlaceholderFile;
        }
        dbConnectionPool.getConnection((err, connection) => {
            if (err) {
                reject(commonErrors.failedToConnectDbStatus500);
                return;
            }
            database.selectFromTable("File", "owner_id=" + decodedToken.accountId + " AND path='" + fullPath + "'", connection).then((results) => {
                if (results.length == 0) {
                    reject({
                        message: "Could not find a file that you own with path \"" + fullPath + "\".",
                        httpStatus: 403,
                        success: false,
                        connectionToDrop: connection
                    });
                    return;
                }
                database.selectFromTable("Favorite", "file_id=" + results[0].id + " AND owner_id=" + decodedToken.accountId, connection).then((resultsFav) => {
                    if (resultsFav.length != 0) {
                        reject({
                            message: "You already favorited this path.",
                            httpStatus: 403,
                            success: false,
                            connectionToDrop: connection
                        });
                        return;
                    }
                    database.insertIntoTable("Favorite", "file_id, owner_id", results[0].id + ", " + decodedToken.accountId, connection).then((resultsInsert) => {
                        resolve({
                            message: "Successfully added a favorite.",
                            httpStatus: 200,
                            success: true,
                            connectionToDrop: connection
                        });
                    }).catch((results) => {
                        reject({
                            message: "An error has occurred while adding a favorite.",
                            httpStatus: 500,
                            success: false,
                            connectionToDrop: connection
                        });
                    });
                }).catch((results) => {
                    reject({
                        message: "An error has occurred while retreving the specified favorite.",
                        httpStatus: 500,
                        success: false,
                        connectionToDrop: connection
                    });
                });
            }).catch((results) => {
                reject({
                    message: "An error has occurred while retreving the specified file.",
                    httpStatus: 500,
                    success: false,
                    connectionToDrop: connection
                });
            });
        });
    });
};
module.exports.init = function(connectionPool) {
    dbConnectionPool = connectionPool;
};
