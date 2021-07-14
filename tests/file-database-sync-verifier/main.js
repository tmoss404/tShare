const mysql = require("mysql");
const awsSdk = require("aws-sdk");

var connection = mysql.createConnection({
    host: "us-cdbr-east-03.cleardb.com",
    user: "bb73893de9c6ac",
    password: "964b560d",
    database: "heroku_7c63935b5a98fc3"
});
var s3  = new awsSdk.S3({
    accessKeyId: "AKIARVGPJVYVDSNAKJLB",
    secretAccessKey: "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",
    region: 'us-east-1',
});
var targetBucket = "bucketeer-72303b66-e175-4b67-aade-fd2764a19e0b";

connection.connect(function(err) {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Starting the tests...");
    connection.query("SELECT * FROM File WHERE is_directory=0", function(error, results, fields) {
        if (error) {
            console.log(error);
            return;
        }
        var promises = [];
        for (var i = 0; i < results.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                var result = results[i];
                s3.getObject({
                    Bucket: targetBucket,
                    Key: result.path
                }, (err, data) => {
                    if (err && err.code != "NoSuchKey") {
                        reject(err);
                    } else {
                        if (err && err.code == "NoSuchKey") {
                            console.log("Detected an invalid file record: \"" + JSON.stringify(result) + "\". It is invalid because there is no physical file record.");
                        }
                        resolve();
                    }
                });
            }));
        }
        Promise.all(promises).then(() => {
            console.log("Completed the database-to-file-system test.");
        }).catch((err) => {
            console.log(err);
        });
        s3.listObjectsV2({
            Bucket: targetBucket
        }, (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            promises = [];
            for (var i = 0; i < data.KeyCount; i++) {
                promises.push(new Promise((resolve, reject) => {
                    var s3Object = data.Contents[i];
                    var placeholderSuffix = "/__tshare-placeholder__";
                    if (s3Object.Key.endsWith(placeholderSuffix)) {
                        s3Object.Key = s3Object.Key.substring(0, s3Object.Key.lastIndexOf(placeholderSuffix));
                    }
                    connection.query("SELECT * FROM File WHERE path='" + s3Object.Key + "'", function(error, results, fields) {
                        if (error) {
                            reject(error);
                            return;
                        }
                        if (results.length == 0) {
                            console.log("Detected an invalid file record: \"" + JSON.stringify(s3Object) + "\". It is invalid because there is no database file record.");
                        }
                        resolve();
                    });
                }));
            }
            Promise.all(promises).then(() => {
                console.log("Completed the file-system-to-database test.");
                connection.end();
            }).catch((err) => {
                console.log(err);
                connection.end();
            });
        });
    });
});
