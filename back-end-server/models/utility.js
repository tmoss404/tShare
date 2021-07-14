const objectUtil = require("../objectUtil");
const commonErrors = require("./commonErrors");

module.exports.logError = function(logErrData) {
    return new Promise((resolve, reject) => {
        /* 
        TODO:
        - Validate that the logErrData object is not null or undefined using objectUtil#isNullOrUndefined.
        - Then validate that the error message that was sent is not null, undefined, or empty.
        - Next, validate that the receipents array is not null, undefined, or empty and same with each element in the receipents array.
        - Afterwards, create a console.log message like "Received error: \"myErrorMessage\" from the front-end server. Sending an email with the error to receipent1, receipent2, receipent3..."
        - Then send an email with the error message to the receipents using Trustifi. See the code in account.js#forgotPassword to see how I'm sending an email using Trustifi.
        - You can check out the Trustifi documentation here for more information on sending an email using Trustifi: https://api.trustifi.com/#ad7d9d33-b431-2bb0-14e9-01c967eae2be 
        - Lastly, please note that error/success messages must contain the following properties: message, httpStatus, success. Please see how I'm sending this information in one of the models in the models folder, such as in account.js.
        */
    });
};