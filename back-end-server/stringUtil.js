module.exports.countCharInStr = function(str, charToFind) {
    var count = 0;
    for (var i = 0; i < str.length; i++) {
        if (str.charAt(i) == charToFind) {
            ++count;
        }
    }
    return count;
};
