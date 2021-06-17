module.exports.isNullOrUndefined = function(object) {
    return module.exports.isUndefined(object) || object == null;
};
module.exports.isUndefined = function(object) {
    return typeof(object) === "undefined";
}
module.exports.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
