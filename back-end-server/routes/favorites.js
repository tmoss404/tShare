const favoritesModel = require("../models/favorites");
const routes = require("../routes");
const accountMiddleware = require("../models/accountMiddleware");

module.exports.setupRoutes = function(app) {
    app.post("/favorite/add", accountMiddleware.checkAuth, (req, res) => {
        favoritesModel.addFavorite(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
