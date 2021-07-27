const objectUtil = require("../objectUtil");
const commonErrors = require("./commonErrors");
const appConstants = require("../config/appConstants");
const fileUtil = require("./fileUtil");
const database = require("../config/database");

var dbConnectionPool;

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
