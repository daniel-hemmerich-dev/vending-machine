'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorise = exports.authenticate = exports.login = void 0;
const user_1 = __importDefault(require("./user"));
const jwt = require('jsonwebtoken');
/**
 * Login a user
 * @param request The express request object
 * @param response The express response object
 */
function login(request, response) {
    var _a, _b, _c;
    // check if the user credentials are valid
    const user = user_1.default.findByUsernameAndPassword((_a = request.body.username) !== null && _a !== void 0 ? _a : '', (_b = request.body.password) !== null && _b !== void 0 ? _b : '');
    // if the user does not exist respond with an error
    if (!user) {
        const errors = [
            {
                value: request.body.username,
                msg: 'Invalid credentials',
                param: 'username'
            },
            {
                value: request.body.password,
                msg: 'Invalid credentials',
                param: 'password'
            }
        ];
        return response.status(400).json(errors);
    }
    // create the jwt token
    const accessToken = jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: '15m'
    });
    // set the jwt token as a cookie
    response.cookie((_c = process.env.JWT_COOKIE_NAME) !== null && _c !== void 0 ? _c : 'vending-machine-jwt', accessToken, {
        maxAge: 1000 * 60 * 15,
        httpOnly: true,
        //signed: true // Indicates if the cookie should be signed
    });
}
exports.login = login;
/**
 * Checks if the user is valid by username and password
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
function authenticate(request, response, next) {
    var _a, _b;
    // validate the jwt token signature
    const jwtToken = /.*vending-machine-jwt=(.+);*/.exec((_a = request.headers.cookie) !== null && _a !== void 0 ? _a : '');
    // respond with an error if there is no token set in the cookie
    if (!jwtToken) {
        const errors = [
            {
                value: '',
                msg: 'Invalid token',
                param: (_b = process.env.JWT_COOKIE_NAME) !== null && _b !== void 0 ? _b : 'vending-machine-jwt'
            }
        ];
        return response.status(401).json(errors);
    }
    //console.log(jwtToken ? jwtToken[1] : '')
    jwt.verify(jwtToken[1], process.env.JWT_ACCESS_TOKEN_SECRET, function (error, content) {
        var _a;
        // If there is an error the token has expired and we send an error response
        if (error) {
            const errors = [
                {
                    value: jwtToken[1],
                    msg: 'Token expired',
                    param: (_a = process.env.JWT_COOKIE_NAME) !== null && _a !== void 0 ? _a : 'vending-machine-jwt'
                }
            ];
            return response.status(403).json(errors);
        }
        // If there is no sub data we send an error response
        if (!content.sub) {
            const errors = [
                {
                    value: '',
                    msg: 'Invalid token content',
                    param: 'sub'
                }
            ];
            return response.status(403).json(errors);
        }
        // if there is no user with that id we send an error response
        const user = user_1.default.findById(content.sub);
        if (!user) {
            const errors = [
                {
                    value: content.sub,
                    msg: 'Invalid user id',
                    param: 'sub'
                }
            ];
            return response.status(403).json(errors);
        }
        // pass to the next handler
        response.locals.user = user;
        next();
    });
}
exports.authenticate = authenticate;
/**
 * Checks if the user has the rights for a specific operation
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
function authorise(request, response, next) {
    // get the user id from the jwt token
    // checks if the user id is valid to access the data
    next();
}
exports.authorise = authorise;
exports.default = {
    login: login,
    authenticate: authenticate,
    authorise: authorise
};
