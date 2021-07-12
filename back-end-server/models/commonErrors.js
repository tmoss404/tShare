module.exports.genericStatus400 = {
    message: "Malformed request. Trying to hack the server?",
    httpStatus: 400,
    success: false
};
module.exports.failedToConnectDbStatus500 = {
    message: "Failed to establish a connection to the database.",
    httpStatus: 500,
    success: false
};
module.exports.createFailedToDupS3ObjStatus500 = function(connection) {
    return {
        message: "An error has occurred while moving or copying an S3 object.",
        httpStatus: 500,
        success: false,
        connectionToDrop: connection
    };
};
module.exports.createFailedToQueryS3Status500 = function(connection) {
    return {
        message: "Failed to query S3 for the user's files.",
        httpStatus: 500,
        success: false,
        connectionToDrop: connection
    };
};
