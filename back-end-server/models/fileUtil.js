const objectUtil = require("../objectUtil");

module.exports.formatFilePath = function(filePath) {
    if (objectUtil.isNullOrUndefined(filePath)) {
        return null;
    }
    return filePath.replace("\\", "/");
};
