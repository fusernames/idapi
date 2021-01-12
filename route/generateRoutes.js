"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var routeWrapper = require('./routeWrapper');
var queryParser = require('./queryParser');
var pluralize = require('pluralize');
var idapi = require('../');
module.exports = function (modelName, routes, authorizations) {
    var router = require('express').Router();
    for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
        var route = routes_1[_i];
        var lowercaseName = modelName ? modelName.charAt(0).toLowerCase() + modelName.slice(1) : undefined;
        var ctxRouter = {
            lowercaseName: lowercaseName,
            authorizations: authorizations,
            modelName: modelName,
            route: route
        };
        if (generatorFunctions[route.path]) {
            console.log("[idapi]: generated " + route.path + " for " + modelName);
            generatorFunctions[route.path](ctxRouter, router);
        }
        else {
            generatorFunctions.$custom(ctxRouter, router);
        }
    }
    return router;
};
var generatorFunctions = {
    $custom: function (ctxRouter, router) {
        if (ctxRouter.route.method) {
            router[ctxRouter.route.method](ctxRouter.route.path, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    routeWrapper(__assign(__assign({}, ctxRouter), { req: req, res: res }), function (_a) {
                        var Model = _a.Model;
                        return __awaiter(void 0, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, ctxRouter.route.resolver({ Model: Model, req: req, res: res })];
                                    case 1:
                                        result = _b.sent();
                                        return [2 /*return*/, result];
                                }
                            });
                        });
                    });
                    return [2 /*return*/];
                });
            }); });
        }
    },
    $post: function (ctxRouter, router) {
        router.post("/" + ctxRouter.lowercaseName, function (req, res) {
            routeWrapper(__assign(__assign({}, ctxRouter), { req: req, res: res }), function (_a) {
                var Model = _a.Model;
                return __awaiter(void 0, void 0, void 0, function () {
                    var result;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, Model.create(req.body)];
                            case 1:
                                result = _b.sent();
                                return [2 /*return*/, result];
                        }
                    });
                });
            });
        });
    },
    $getMany: function (ctxRouter, router) {
        router.get("/" + pluralize(ctxRouter.lowercaseName), function (req, res) {
            routeWrapper(__assign(__assign({}, ctxRouter), { req: req, res: res }), function (_a) {
                var Model = _a.Model;
                return __awaiter(void 0, void 0, void 0, function () {
                    var _b, where, sort, limit, skip, page, full, mainQuery, _c, results, count;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                _b = queryParser(req.query), where = _b.where, sort = _b.sort, limit = _b.limit, skip = _b.skip, page = _b.page, full = _b.full;
                                mainQuery = Model.find(where).skip(skip).limit(limit).sort(sort);
                                if (!ctxRouter.route.queryMiddleware) return [3 /*break*/, 2];
                                return [4 /*yield*/, ctxRouter.route.queryMiddleware(mainQuery)];
                            case 1:
                                _d.sent();
                                _d.label = 2;
                            case 2: return [4 /*yield*/, Promise.all([mainQuery.exec(), Model.countDocuments(where)])];
                            case 3:
                                _c = _d.sent(), results = _c[0], count = _c[1];
                                return [2 /*return*/, {
                                        results: results,
                                        count: count,
                                        pages: Math.ceil(count / limit),
                                        page: page,
                                        full: full,
                                    }];
                        }
                    });
                });
            });
        });
    },
    $get: function (ctxRouter, router) {
        router.get("/" + ctxRouter.lowercaseName, function (req, res) {
            var where = queryParser(req.query).where;
            routeWrapper(__assign(__assign({}, ctxRouter), { req: req, res: res }), function (_a) {
                var Model = _a.Model;
                return __awaiter(void 0, void 0, void 0, function () {
                    var mainQuery, result;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                mainQuery = Model.findOne(where);
                                if (!ctxRouter.route.queryMiddleware) return [3 /*break*/, 2];
                                return [4 /*yield*/, ctxRouter.route.queryMiddleware(mainQuery)];
                            case 1:
                                _b.sent();
                                _b.label = 2;
                            case 2: return [4 /*yield*/, mainQuery.exec()];
                            case 3:
                                result = _b.sent();
                                if (!result)
                                    throw { status: 404, code: "La ressource n'existe pas" };
                                return [2 /*return*/, result];
                        }
                    });
                });
            });
        });
    },
    $delete: function (ctxRouter, router) {
        router.delete("/" + ctxRouter.lowercaseName, function (req, res) {
            routeWrapper(__assign(__assign({}, ctxRouter), { req: req, res: res }), function (_a) {
                var Model = _a.Model;
                return __awaiter(void 0, void 0, void 0, function () {
                    var result;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, Model.findOne({ _id: req.body._id })];
                            case 1:
                                result = _b.sent();
                                if (!result)
                                    throw { status: 404, code: "La ressource n'existe pas" };
                                return [4 /*yield*/, result.remove()];
                            case 2:
                                _b.sent();
                                return [2 /*return*/, result];
                        }
                    });
                });
            });
        });
    },
    $put: function (ctxRouter, router) {
        router.put("/" + ctxRouter.lowercaseName, function (req, res) {
            routeWrapper(__assign(__assign({}, ctxRouter), { req: req, res: res }), function (_a) {
                var Model = _a.Model;
                return __awaiter(void 0, void 0, void 0, function () {
                    var result, _i, _b, _c, key, value;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0: return [4 /*yield*/, Model.findOne({ _id: req.body._id })];
                            case 1:
                                result = _d.sent();
                                if (!result)
                                    throw { status: 404, code: "La ressource n'existe pas" };
                                result._old = result.toObject();
                                for (_i = 0, _b = Object.entries(req.body); _i < _b.length; _i++) {
                                    _c = _b[_i], key = _c[0], value = _c[1];
                                    result[key] = value;
                                }
                                return [4 /*yield*/, result.save()];
                            case 2:
                                _d.sent();
                                return [2 /*return*/, result];
                        }
                    });
                });
            });
        });
    },
    $validate: function (ctxRouter, router) {
        router.post("/" + ctxRouter.lowercaseName + "/validate", function (req, res) {
            routeWrapper(__assign(__assign({}, ctxRouter), { req: req, res: res }), function (_a) {
                var Model = _a.Model, req = _a.req;
                return __awaiter(void 0, void 0, void 0, function () {
                    var errors;
                    return __generator(this, function (_b) {
                        errors = idapi.validators[ctxRouter.modelName].validateForm(req.body);
                        if (errors)
                            return [2 /*return*/, errors];
                        else
                            return [2 /*return*/, {}];
                        return [2 /*return*/];
                    });
                });
            });
        });
    },
    $mine: function (ctxRouter, router) {
        router.get("/" + ctxRouter.lowercaseName + "/mine", function (req, res) {
            routeWrapper(__assign(__assign({}, ctxRouter), { req: req, res: res }), function (_a) {
                var Model = _a.Model;
                return __awaiter(void 0, void 0, void 0, function () {
                    var result;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, Model.findOne({ user: req.myId })
                                // if (!result) throw { status: 404, code: `Aucune ressource trouvée` }
                            ];
                            case 1:
                                result = _b.sent();
                                // if (!result) throw { status: 404, code: `Aucune ressource trouvée` }
                                return [2 /*return*/, result];
                        }
                    });
                });
            });
        });
    },
};
