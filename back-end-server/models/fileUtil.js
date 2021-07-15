const objectUtil = require("../objectUtil");
const appConstants = require("../config/appConstants");
const database = require("../config/database");
const stringUtil = require("../stringUtil");

var metadataSuffix = "/" + appConstants.dirPlaceholderFile;

function handleNoDbRecordForFile(s3File) {
    console.log("Could not find a database file record for \"" + JSON.stringify(s3File) + "\". Attempting to guess...");
    s3File.isDirectory = s3File.Key.endsWith(metadataSuffix);
}
function addOwnerAndStripRoot(s3File, pathPrefix, owner, showNestedFiles) {
    if (s3File.Key.startsWith(pathPrefix)) {
        s3File.Key = s3File.Key.substring(pathPrefix.length);
    }
    if (!showNestedFiles && stringUtil.countCharInStr(s3File.Key.substring(pathPrefix.length), '/') >= 1) {
        s3File.Key = s3File.Key.substring(s3File.Key.lastIndexOf("/") + 1);
    }
    s3File.owner = owner;
}
function removeFromS3DataAt(s3Data, index) {
    s3Data.Contents.splice(index, 1);
    if (s3Data.KeyCount > 0) {
        --s3Data.KeyCount;
    }
}
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
    if (!filePath.endsWith("/" + appConstants.dirPlaceholderFile) && isDirectory) {
        filePath += "/" + appConstants.dirPlaceholderFile;
    }
    return new Promise((resolve, reject) => {
        database.selectFromTable("File", "path='" + filePath + "' AND owner_id=" + fileOwnerId, connection).then((results) => {
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
module.exports.deleteEmptyFileRecords = function(filePath, fileOwnerId, connection, s3) {
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
            if (i < splitPath.length - 1) {
                subPath += "/";
            }
            promises.push(new Promise((resolve, reject) => {
                var savedSubPath = subPath;
                s3.listObjectsV2({
                    Bucket: appConstants.awsBucketName,
                    MaxKeys: 1,
                    Prefix: savedSubPath
                }, (err, data) => {
                    if (err) {
                        reject(err);
                    } else if (data.KeyCount == 0) {
                        database.deleteFromTable("File", "path='" + savedSubPath + "' AND owner_id=" + fileOwnerId, connection).then((results) => {
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
            promises.push(module.exports.deleteEmptyFileRecords(oldPath, fileOwnerId, connection, s3));
        }
        Promise.all(promises).then((results) => {
            resolve(results);
        }).catch((results) => {
            reject(results);
        });
    });
};
module.exports.processS3Data = function(data, accountIdPrefix, owner, showNestedFiles, pathPrefix, connection) {
    return new Promise((resolve, reject) => {
        var promises = [];
        for (var i = 0; i < data.Contents.length; i++) {
            if (!data.Contents[i].Key.startsWith(pathPrefix)) {
                continue;  // This is a file in a different root directory, so we skip it.
            }
            var subDir = data.Contents[i].Key.substring(pathPrefix.length);
            if (!showNestedFiles) {
                if (stringUtil.countCharInStr(subDir, '/') >= (accountIdPrefix == pathPrefix && !data.Contents[i].Key.endsWith("/" + appConstants.dirPlaceholderFile) ? 1 : 2) || data.Contents[i].Key == pathPrefix + appConstants.dirPlaceholderFile) {
                    removeFromS3DataAt(data, i);
                    --i;
                    continue;
                }
            }
            promises.push(new Promise((resolve, reject) => {
                var content = data.Contents[i];
                database.selectFromTable("File", "path='" + content.Key + "' AND owner_id=" + owner.accountId, connection).then((results) => {
                    if (results.length == 0) {
                        handleNoDbRecordForFile(content);
                    } else if (results[0].is_directory != 0) {
                        if (content.Key.endsWith(metadataSuffix)) {
                            content.Key = content.Key.substring(0, content.Key.length - metadataSuffix.length);
                        }
                        content.Size = 0;
                        content.isDirectory = true;
                    } else {
                        content.isDirectory = false;
                    }
                    addOwnerAndStripRoot(content, showNestedFiles ? accountIdPrefix : pathPrefix, owner, showNestedFiles);
                    resolve(data);
                }).catch((results) => {
                    handleNoDbRecordForFile(content);
                    addOwnerAndStripRoot(content, showNestedFiles ? accountIdPrefix : pathPrefix, owner, showNestedFiles);
                    resolve(data);
                });
            }));
        }
        Promise.all(promises).then((s3Data) => {
            for (var i = 0; i < data.Contents.length; i++) {
                for (var j = 0; j < data.Contents.length; j++) {
                    if (j == i) {
                        continue;
                    }
                    // Removes duplicate entries.
                    if (data.Contents[i].isDirectory == data.Contents[j].isDirectory && data.Contents[i].Size == data.Contents[j].Size && data.Contents[i].Key == data.Contents[j].Key) {
                        removeFromS3DataAt(data, j);
                        --j;
                    }
                }
            }
            if (data.Prefix.includes(accountIdPrefix)) {
                data.Prefix = "";
            }
            resolve(data);
        });
    });
}
