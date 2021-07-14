const objectUtil = require("../objectUtil");
const appConstants = require("../config/appConstants");
const database = require("../config/database");

module.exports.formatFilePath = function(filePath) {
    if (objectUtil.isNullOrUndefined(filePath)) {
        return null;
    }
    return filePath.replace("\\", "/");
};
function insertFileRecord(filePath, fileOwnerId, isDirectory, connection) {
    return database.insertIntoTable("File", "path, owner_id, is_directory", "'" + filePath + "', " + fileOwnerId + ", " + isDirectory, connection);
};
function updateFileRecord(filePath, fileOwnerId, isDirectory, connection) {
    return new Promise((resolve, reject) => {
        database.selectFromTable("File", "path='" + filePath + "'", connection).then((results) => {
            if (results.length == 0) {
                insertFileRecord(filePath, fileOwnerId, isDirectory, connection).then((results) => {
                    resolve(results);
                }).catch((results) => {
                    reject(results);
                });
            } else {
                database.updateTable("File", "owner_id=" + fileOwnerId + ", is_directory=" + isDirectory, "path='" + filePath + "'", connection).then((results) => {
                    resolve(results);
                }).catch((results) => {
                    reject(results);
                });
            }
        }).catch((results) => {
            reject(results);
        });
    });
}
module.exports.deleteEmptyFileRecords = function (filePath, connection, s3) {
    return new Promise((resolve, reject) => {
        var splitPath = filePath.split("/");
        var promises = [];
        for (var i = 1; i < splitPath.length; i++) {
            var subPath = "";
            for (var j = 0; j <= i; j++) {
                subPath += splitPath[j];
                if (j != i) {
                    subPath += "/";
                }
            }
            promises.push(new Promise((resolve, reject) => {
                var savedSubPath = subPath;
                s3.listObjectsV2({
                    Bucket: appConstants.awsBucketName,
                    MaxKeys: 1,
                    Prefix: savedSubPath + "/"
                }, (err, data) => {
                    if (err) {
                        reject(err);
                    } else if (data.KeyCount == 0) {
                        database.deleteFromTable("File", "path='" + savedSubPath + "'", connection).then((results) => {
                            resolve(results);
                        }).catch((results) => {
                            reject(results);
                        });
                    } else {
                        resolve(data);
                    }
                });
            }));
        }
        Promise.all(promises).then((results) => {
            resolve(results);
        }).catch((results) => {
            reject(results);
        });
    });
};
module.exports.updateFileRecords = function(filePath, fileOwnerId, isDirectory, oldPath, connection, s3) {
    // Patchy fixes for updating a directory's file record:
    var dirSuffix = "/" + appConstants.dirPlaceholderFile;
    if (oldPath.endsWith(dirSuffix)) {
        isDirectory = true;
        oldPath = oldPath.substring(0, oldPath.lastIndexOf("/"));
    }
    if (filePath.endsWith(dirSuffix)) {
        isDirectory = true;
        filePath = filePath.substring(0, filePath.lastIndexOf("/"));
    }

    return new Promise((resolve, reject) => {
        var splitPath = filePath.split("/");
        var promises = [];
        for (var i = 0; i < splitPath.length; i++) {
            var subPath = "";
            for (var j = 0; j <= i; j++) {
                subPath += splitPath[j];
                if (j != i) {
                    subPath += "/";
                }
            }
            var subPathIsDirectory = isDirectory || i != splitPath.length - 1;
            promises.push(updateFileRecord(subPath, fileOwnerId, subPathIsDirectory, connection));
        }
        if (oldPath != subPath) {
            promises.push(module.exports.deleteEmptyFileRecords(oldPath, connection, s3));
        }
        Promise.all(promises).then((results) => {
            resolve(results);
        }).catch((results) => {
            reject(results);
        });
    });
};
module.exports.processS3Data = function(data, accountIdPrefix, owner, showNestedFiles, pathPrefix) {
    var toDelete = [];
    for (var i = 0; i < data.Contents.length; i++) {
        var subDir = data.Contents[i].Key.substring(pathPrefix.length);
        if (!showNestedFiles && subDir.includes("/")) {
            data.Contents[i].Key = subDir.substring(0, subDir.indexOf("/"));
            data.Contents[i].isDirectory = true;
            data.Contents[i].Size = 0;
        } else {
            if (data.Contents[i].Key.startsWith(accountIdPrefix)) {
                data.Contents[i].Key = data.Contents[i].Key.substring(accountIdPrefix.length);
            }
            var metadataSuffix = "/" + appConstants.dirPlaceholderFile;
            if (data.Contents[i].Key.endsWith(metadataSuffix)) {
                data.Contents[i].Key = data.Contents[i].Key.substring(0, data.Contents[i].Key.length - metadataSuffix.length);
                data.Contents[i].Size = 0;
                data.Contents[i].isDirectory = true;
            } else {
                data.Contents[i].isDirectory = false;
            }
            if (!showNestedFiles && data.Contents[i].Key.includes("/")) {
                data.Contents[i].Key = data.Contents[i].Key.substring(data.Contents[i].Key.lastIndexOf("/") + 1);
            }
        }
        data.Contents[i].owner = owner;
    }
    if (data.Prefix.includes(accountIdPrefix)) {
        data.Prefix = "";
    }
    return data;
}
