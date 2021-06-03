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
app.get("/file/list", (req, res) => {
    var params = {
        Bucket: "bucketeer-72303b66-e175-4b67-aade-fd2764a19e0b",
        MaxKeys: 1000
    };
    s3.listObjectsV2(params, (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        res.status(200).send(data);
    });
});
app.post("/file/*", (req, res) => {
    var filePath = req.params[0];
    var fileBuf = req.body.buffer;
    //console.log(process.env.BUCKETEER_BUCKET_NAME);
    console.log(filePath);
    var params = {
        Key:    filePath,
        Bucket: "bucketeer-72303b66-e175-4b67-aade-fd2764a19e0b",
        Body:   Buffer.from(fileBuf)
    };
    s3.putObject(params, function put(err, data) {
        if (err) {
          console.log(err, err.stack);
          return;
        } else {
          console.log(data);
        }
        delete params.Body;
        s3.getObject(params, function put(err, data) {
          if (err) {
              console.log(err, err.stack);
          } else {
              console.log(data);
          }
          console.log(data.Body.toString());
        });
      });
});

app.listen(serverPort, () => {
    console.log("The server has started listening on port " + serverPort + ".");
});
