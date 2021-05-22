module.exports.setupRoutes = function(app) {
    app.get("/tests/api-route", (req, res) => {
        res.status(200).send("This route works!");
    });
};
