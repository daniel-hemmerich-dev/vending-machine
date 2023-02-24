'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroy = exports.update = exports.read = exports.create = exports.validate = exports.findByUsernameAndPassword = exports.findByUsername = exports.findById = void 0;
const express_validator_1 = require("express-validator");
const auth_1 = __importDefault(require("./auth"));
const crypto_1 = __importDefault(require("crypto"));
// The user database
const users = [];
/**
 * Finds and returns a user that matches the id
 * @param id The id of the user
 * @returns The matching user or null if a user was not found
 */
function findById(id) {
    const user = users.find(element => element.id === id);
    return user !== null && user !== void 0 ? user : null;
}
exports.findById = findById;
/**
 * Finds and returns a user that matches the username
 * @param username The username of the user
 * @returns The matching user or null if a user was not found
 */
function findByUsername(username) {
    const user = users.find(element => element.username.toLowerCase() === username.toLowerCase());
    return user !== null && user !== void 0 ? user : null;
}
exports.findByUsername = findByUsername;
/**
 * Finds and returns a user that matches the username and password
 * @param username The username of the user
 * @param password The password of the user
 * @returns The matching user or null if a user was not found
 */
function findByUsernameAndPassword(username, password) {
    const user = findByUsername(username);
    if (!user)
        return null;
    return user.password === password ? user : null;
}
exports.findByUsernameAndPassword = findByUsernameAndPassword;
/**
 * Validate the user fields of the body
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
function validate(request, response, next) {
    return __awaiter(this, void 0, void 0, function* () {
        // validate
        yield (0, express_validator_1.body)('id').optional().isAlphanumeric().isLength({ min: 36, max: 36 }).run(request);
        yield (0, express_validator_1.body)('username').isAlphanumeric().isLength({ min: 3, max: 32 }).run(request);
        yield (0, express_validator_1.body)('password').isLength({ min: 4, max: 16 }).run(request);
        yield (0, express_validator_1.body)('deposit').optional().isInt().isLength({ min: 0 }).run(request);
        yield (0, express_validator_1.oneOf)([
            (0, express_validator_1.body)('role').equals("seller" /* UserRole.Seller */),
            (0, express_validator_1.body)('role').equals("buyer" /* UserRole.Buyer */)
        ]).run(request);
        // if there are errors, provide an error response
        const errors = (0, express_validator_1.validationResult)(request);
        if (!errors.isEmpty())
            return response.status(400).json(errors.array());
        // pass to the next handler
        next();
    });
}
exports.validate = validate;
/**
 * Register a new user
 * @param request The express request object
 * @param response The express response object
 */
function create(request, response) {
    var _a, _b, _c, _d;
    // respond with an error if the username already exist
    if (findByUsername((_a = request.body.username) !== null && _a !== void 0 ? _a : '')) {
        const error = {
            value: request.body.username,
            msg: 'Username already exist',
            param: 'username'
        };
        return response.status(400).json([error]);
    }
    // create the user
    const user = {
        id: crypto_1.default.randomUUID(),
        username: (_b = request.body.username) !== null && _b !== void 0 ? _b : '',
        password: (_c = request.body.password) !== null && _c !== void 0 ? _c : '',
        deposit: 0,
        role: (_d = request.body.role) !== null && _d !== void 0 ? _d : ''
    };
    users.push(user);
    // login the user
    auth_1.default.login(request, response);
    // respond with the user
    response.send(user);
}
exports.create = create;
/**
 * Read the user information
 * @param request The express request object
 * @param response The express response object
 */
function read(request, response) {
    // return the user from the authentication middleware
    if (response.locals.user)
        return response.json(response.locals.user);
    // otherwise respond with an error
    const error = {
        value: '',
        msg: 'Invalid user',
        param: 'sub'
    };
    response.status(500).json([error]);
}
exports.read = read;
/**
 * Update the user
 * @param request The express request object
 * @param response The express response object
 */
function update(request, response) {
    // update and return the user from the authentication middleware
    if (response.locals.user) {
        response.locals.user.username = request.body.username;
        response.locals.user.password = request.body.password;
        response.locals.user.role = request.body.role;
        return response.json(response.locals.user);
    }
    // otherwise respond with an error
    const error = {
        value: '',
        msg: 'Invalid user',
        param: 'sub'
    };
    response.status(500).json([error]);
}
exports.update = update;
/**
 * Delete the user
 * @param request The express request object
 * @param response The express response object
 */
function destroy(request, response) {
    // delete the user from the authentication middleware
    if (response.locals.user) {
        users.splice(users.indexOf(response.locals.user), 1);
        return response.send('');
    }
    // otherwise respond with an error
    const error = {
        value: '',
        msg: 'Invalid user',
        param: 'sub'
    };
    response.status(500).json([error]);
}
exports.destroy = destroy;
exports.default = {
    findById: findById,
    findByUsername: findByUsername,
    findByUsernameAndPassword: findByUsernameAndPassword,
    validate: validate,
    create: create,
    read: read,
    update: update,
    destroy: destroy
};
