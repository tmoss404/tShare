const fileModel = require("../models/file");

module.exports.setupRoutes = function(app) {
    app.post("/file/get-signed-url", (req, res) => {
        fileModel.getSignedUrl(req.body).then((msg) => {
            res.status(200).send(msg);
        }).catch((err) => {
            res.status(200).send(err);
        });
    });
};
