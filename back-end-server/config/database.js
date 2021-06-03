const mySql = require("mysql");
const bcrypt = require("bcryptjs");
const accountModel = require("../models/account");
const appConstants = require("../config/appConstants");

module.exports.connectionPool = mySql.createPool(appConstants.mySqlCfg);

module.exports.init = function() {
    accountModel.init(module.exports.connectionPool);
};
module.exports.selectFromTable = function(tableName, whereClause, connection) {
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM " + tableName + " WHERE " + whereClause, function(err, results, fields) {
            if (err) {
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
            if (err) {
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
            if (err) {
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
            if (err) {
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
};
