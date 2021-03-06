const mySql = require("mysql");
const bcrypt = require("bcryptjs");
const accountModel = require("../models/account");
const fileModel = require("../models/file");
const appConstants = require("../config/appConstants");
const objectUtil = require("../objectUtil");
const favoritesModel = require("../models/favorite");
const permissionModel = require("../models/permission");

module.exports.connectionPool = mySql.createPool(appConstants.mySqlCfg);

module.exports.init = function() {
    accountModel.init(module.exports.connectionPool);
    fileModel.init(module.exports.connectionPool);
    favoritesModel.init(module.exports.connectionPool);
    permissionModel.init(module.exports.connectionPool);
};
module.exports.selectFromTable = function(tableName, whereClause, connection) {
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM " + tableName + " WHERE " + whereClause, function(err, results, fields) {
            if (!objectUtil.isNullOrUndefined(err)) {
                console.log(err);
                reject(null);
            } else {
                resolve(results);
            }
        });
    });
};
module.exports.selectAllFromTable = function(tableName, connection) {
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM " + tableName, function(err, results, fields) {
            if (!objectUtil.isNullOrUndefined(err)) {
                console.log(err);
                reject(null);
            } else {
                resolve(results);
            }
        });
    });
};
module.exports.insertIntoTable = function(tableName, columnsClause, valuesClause, connection) {
    return new Promise((resolve, reject) => {
        connection.query("INSERT INTO " + tableName + " (" + columnsClause + ") VALUES (" + valuesClause + ")", function(err, results, fields) {
            if (!objectUtil.isNullOrUndefined(err)) {
                console.log(err);
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
};
module.exports.deleteFromTable = function(tableName, whereClause, connection) {
    return new Promise((resolve, reject) => {
        connection.query("DELETE FROM " + tableName + " WHERE " + whereClause, function(err, results, fields) {
            if (!objectUtil.isNullOrUndefined(err)) {
                console.log(err);
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
};
module.exports.updateTable = function(tableName, setClause, whereClause, connection) {
    return new Promise((resolve, reject) => {
        connection.query("UPDATE " + tableName + " SET " + setClause + " WHERE " + whereClause, function(err, results, fields) {
            if (!objectUtil.isNullOrUndefined(err)) {
                console.log(err);
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
};
