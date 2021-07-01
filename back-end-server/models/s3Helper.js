const appConstants = require("../config/appConstants");
const axios = require("axios");

module.exports.moveObject = function(dest, src, s3) {
    return new Promise((resolve, reject) => {
        var acl = "public-read";
        var contentType = "application/octet-stream";
        var s3Params = {
            Bucket: appConstants.awsBucketName,
            Key: dest,
            CopySource: encodeURIComponent(appConstants.awsBucketName + "/" + src),
            ContentType: contentType,
            ACL: acl
        };
        s3.getSignedUrl("copyObject", s3Params, (err, signedUrlData) => {
            if (err) {
                console.log(err);
                reject(err);
                return;
            }
            console.log(signedUrlData);
            axios({
                method: "put",
                url: signedUrlData,
                headers: {
                    "x-amz-copy-source": src,
                    "Content-Type": contentType,
                    "x-amz-acl": acl
                }
            }).then((res) => {
                s3Params = {
                    Bucket: appConstants.awsBucketName,
                    Key: src
                };
                s3.deleteObject(s3Params, (err, deleteObjData) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(true);
                });
            }).catch((err) => {
                console.log(err.response.data);
                reject(err);
            });
        });
    });
};
