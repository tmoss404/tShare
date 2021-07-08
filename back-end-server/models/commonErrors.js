module.exports.genericStatus400 = {
    message: "Malformed request. Trying to hack the server?",
    httpStatus: 400,
    success: false
};
module.exports.loginTokenInvalidStatus401 = {
    message: "Login token is invalid.",
    httpStatus: 401,
    success: false
};
module.exports.failedToQueryS3Status500 = {
    message: "Failed to query S3 for the user's files.",
    httpStatus: 500,
    success: false
};
module.exports.failedToConnectDbStatus500 = {
    message: "Failed to establish a connection to the database.",
    httpStatus: 500,
    success: false
};
module.exports.failedToMoveS3ObjStatus500 = {
    message: "An error has occurred while moving an S3 object.",
    httpStatus: 500,
    success: false
};

