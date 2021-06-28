const objectUtil = require("../objectUtil");
const appConstants = require("../config/appConstants");

module.exports.formatFilePath = function(filePath) {
    if (objectUtil.isNullOrUndefined(filePath)) {
        return null;
    }
    return filePath.replace("\\", "/");
};
module.exports.filterSensitiveData = function(data, accountIdPrefix) {
    var toDelete = [];
    for (var i = 0; i < data.Contents.length; i++) {
        if (data.Contents[i].Key.startsWith(accountIdPrefix)) {
            data.Contents[i].Key = data.Contents[i].Key.substring(accountIdPrefix.length);
        }
        var metadataSuffix = "/" + appConstants.dirPlaceholderFile;
        if (data.Contents[i].Key.endsWith(metadataSuffix)) {
            data.Contents[i].Key = data.Contents[i].Key.substring(0, data.Contents[i].Key.length - metadataSuffix.length);
            data.Contents[i].Size = 0;
        }
    }
    if (data.Prefix.includes(accountIdPrefix)) {
        data.Prefix = "";
    }
    return data;
}
