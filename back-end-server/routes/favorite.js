const favoritesModel = require("../models/favorite");
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
    app.post("/favorite/remove", accountMiddleware.checkAuth, (req, res) => {
        favoritesModel.removeFavorite(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
    app.post("/favorite/list", accountMiddleware.checkAuth, (req, res) => {
        favoritesModel.listFavorites(req.body).then((msg) => {
            routes.sendResponse(res, msg);
        }).catch((err) => {
            routes.sendResponse(res, err);
        });
    });
};
