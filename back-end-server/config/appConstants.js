module.exports.serverPort = process.env.PORT || 80;
module.exports.mySqlCfg = {
    host: "us-cdbr-east-03.cleardb.com",
    user: "bb73893de9c6ac",
    password: "964b560d",
    database: "heroku_7c63935b5a98fc3"
  };
module.exports.trustifiKey = "fff5f53706493bc30ebf6ceb581e4310c663a397cec5ea1b";
module.exports.trustifiSecret = "56c9b130c652fd1b7ea93a0faad51f9c";
module.exports.awsAccessKeyId = "AKIARVGPJVYVDSNAKJLB";
module.exports.awsAccessSecretKey = "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";
module.exports.awsBucketName = "bucketeer-72303b66-e175-4b67-aade-fd2764a19e0b";
module.exports.jwtSecretKey = "Oh man, tShare is so cool. Eric is amazing. This software is so dank bro OMG. This string is also very long and hard-to-guess, yo.";

module.exports.jwtTokenExpiresIn = 60 * 60 * 24;  // 60 seconds x 60 minutes x 24 hours
module.exports.jwtTokenExpiresInAsMillis = 1000 * module.exports.jwtTokenExpiresIn;

module.exports.thisServerUrl = "http://tshare-back-end.herokuapp.com";
module.exports.frontEndUrl = "http://t-share.netlify.app";
module.exports.testLoginToken = "test_token";
module.exports.awsSignedUrlSeconds = 60 * 60 * 24;
module.exports.awsRegion = "us-east-1";
module.exports.awsMaxKeys = 1000;  // AWS S3 doesn't actually support retrieving more than 1000 keys at once.
module.exports.pwdRecoveryLinkExp = 1000 * 60 * 60 * 24;
module.exports.dirPlaceholderFile = "__tshare-meta__";
