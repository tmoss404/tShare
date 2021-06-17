const objUtil = require("../objectUtil");

module.exports.isEmailValid = function(email) {
    var emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return email.match(emailRegex);
};
function strContainsCharIn(str, characterList) {
    for (var i = 0; i < characterList.length; i++) {
        if (str.includes("" + characterList[i])) {
            return true;
        }
    }
    return false;
}
module.exports.isPasswordValid = function(password) {
    var validSymbols = "-_!@#$%^&*()=+";
    var validNums = "0123456789";
    var validPwdChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + validNums + validSymbols;
    for (var i = 0; i < password.length; i++) {
        if (!validPwdChars.includes(("" + password[i]).toUpperCase())) {
            return false;
        }
    }
    return password.length > 8 && strContainsCharIn(password, validSymbols) && strContainsCharIn(password, validNums);
};
module.exports.areLoginInputsValid = function(email, password) {
    if (objUtil.isNullOrUndefined(email) || objUtil.isNullOrUndefined(password) || email.length == 0 || password.length == 0) {
        return false;
    }
    if (!module.exports.isEmailValid(email)) {
        return false;
    }
    if (!module.exports.isPasswordValid(password)) {
        return false;
    }
    return true;
};