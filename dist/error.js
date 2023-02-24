'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.forbidden = exports.unauthorized = exports.badRequest = void 0;
/**
 *
 * @param status
 * @param errors
 * @param response
 */
function error(status, errors, response) {
    return response.status(status).json(errors);
}
/**
 *
 * @param errors
 * @param response
 * @returns
 */
function badRequest(errors, response) {
    return error(400, errors, response);
}
exports.badRequest = badRequest;
/**
 *
 * @param errors
 * @param response
 * @returns
 */
function unauthorized(errors, response) {
    return error(401, errors, response);
}
exports.unauthorized = unauthorized;
/**
 *
 * @param errors
 * @param response
 * @returns
 */
function forbidden(errors, response) {
    return error(403, errors, response);
}
exports.forbidden = forbidden;
exports.default = {
    badRequest: badRequest,
    unauthorized: unauthorized,
    forbidden: forbidden
};
