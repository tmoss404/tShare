var flagNameMap = [];

module.exports.createFilePerm = 1 << 0;
module.exports.deleteFilePerm = 1 << 1;
module.exports.readFilePerm = 1 << 2;
module.exports.writeFilePerm = 1 << 3;

module.exports.init = function() {
    flagNameMap.push({
        name: "create",
        value: module.exports.createFilePerm
    });
    flagNameMap.push({
        name: "delete",
        value: module.exports.deleteFilePerm
    });
    flagNameMap.push({
        name: "read",
        value: module.exports.readFilePerm
    });
    flagNameMap.push({
        name: "write",
        value: module.exports.writeFilePerm
    });
};

module.exports.hasFlag = function(flags, flagToCheck) {
    return (flags & flagToCheck) != 0;
};
module.exports.addFlag = function(flags, flagToAdd) {
    return flags | flagToAdd;
};
module.exports.removeFlag = function(flags, flagToRemove) {
    return flags & ~flagToRemove;
};
module.exports.getNamesForFlags = function(flags) {
    var names = [];
    for (var i = 0; i < flagNameMap.length; i++) {
        var flagNameEntry = flagNameMap[i];
        if (module.exports.hasFlag(flags, flagNameEntry.value)) {
            names.push(flagNameEntry.name);
        }
    }
    return names;
};