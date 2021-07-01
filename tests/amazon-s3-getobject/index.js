// Require statements:
const express = require("express");
const cors = require("cors");
const awsSdk = require('aws-sdk');

const serverPort = 80;
var app = express();

var s3  = new awsSdk.S3({
  accessKeyId: "AKIARVGPJVYVDSNAKJLB",
  secretAccessKey: "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",
  region: 'us-east-1',
});

// Middleware:
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).send("test");
});
app.post("/file/get-object", (req, res) => {
    console.log(req);
    var params = {
        Bucket: "bucketeer-72303b66-e175-4b67-aade-fd2764a19e0b",
        Key: req.body.buffer,
        Range: "bytes=0-1"
    };
    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        res.status(200).send(data);
    });
});

app.listen(serverPort, () => {
    console.log("The server has started listening on port " + serverPort + ".");
});
