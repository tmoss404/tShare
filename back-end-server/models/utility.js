const objectUtil = require("../objectUtil");
const commonErrors = require("./commonErrors");
const appConstants = require("../config/appConstants");

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


        // Validating the logErrData
        if (objectUtil.isNullOrUndefined(logErrData) || objectUtil.isNullOrUndefined(logErrData.message) || objectUtil.isNullOrUndefined(logErrData.recipient) || logErrData.message.length == 0 || logErrData.recipient.length == 0) {
            reject(commonErrors.genericStatus400);

            return;
        }

        // Declaring incoming values
        var recipients = logErrData.recipient;
        var receivedMessage = logErrData.message;


        // Received Error consol.logging
        console.log("Received error: " + receivedMessage);


        // Emails for trustifi

        var trustifiRecipients = [];

        for (var i = 0; i < recipients.length; i++) {

            trustifiRecipients.push({
                emails: recipients[i]
            });

        }

        // BEGIN Trustifi

        var trustifiOpts = {
            'method': 'POST',
            'url': 'https://be.trustifi.com/api/i/v1/email',
            'headers': {
                'x-trustifi-key': appConstants.trustifiKey,
                'x-trustifi-secret': appConstants.trustifiSecret,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "recipients": [{
                    "email": trustifiRecipients.emails
                }],
                "lists": [],
                "contacts": [],
                "attachments": [],
                "title": "A fatal error has occurred in the front-end server of tShare",
                "html": "Hi,<br/><br/><br/>" +
                    "This is a notification that a fatal error has occurred in tShare: " + receivedMessage + ".<br/><br/>" +
                    "Best,<br/><br/><br/>Mikhail Frolov - tShare",
                "methods": {
                    "postmark": false,
                    "secureSend": false,
                    "encryptContent": false,
                    "secureReply": false
                }
            })
        };


        request(trustifiOpts, function(error, response) {
            if (error) {
                reject({
                    message: "An error has occurred while sending the email.",
                    httpStatus: 500,
                    success: false
                });
                return;
            } else {
                resolve({
                    message: receivedMessage,
                    httpStatus: 200,
                    success: true
                });
            }
        });
    }).catch((resultsNull) => {
        reject({
            message: "An error has occurred while sending the email.",
            httpStatus: 500,
            success: false
        });
    });
    // END Trustifi
};