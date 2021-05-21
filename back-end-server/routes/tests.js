module.exports.setupRoutes = function(app) {
    app.get("/tests/api-route", (req, res) => {
        res.send("This route works!");
    });
};
