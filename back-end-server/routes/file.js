const fileModel = require("../models/file");

module.exports.setupRoutes = function(app) {
    app.post("/file/upload", (req, res) => {
        fileModel.getSignedUrl(req.body).then((msg) => {
            res.status(200).send(msg);
        }).catch((err) => {
            res.status(400).send(err);
        });
    });
};
