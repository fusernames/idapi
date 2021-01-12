"use strict";
var express = require('express');
var printRoutes = require('./middlewares/printRoutes');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
module.exports = function initServer(port) {
    var app = express();
    // middlewares
    app.set('trust proxy', true);
    app.use(bodyParser.json());
    app.use(cookieParser());
    // app.use(printRoutes)
    // routes
    app.listen(port, function () {
        console.log("[idapi] Listening on port " + port);
    });
    return app;
};
