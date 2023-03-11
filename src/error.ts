'use strict'

import {Response} from 'express'
import {Error} from './index'


/**
 * Respond to this request with an error code and a message.
 * @param status The HTTP status code.
 * @param errors The error objects
 * @param response The express response object
 */
function error(
    status : number,
    errors : Error[],
    response : Response
)
{
    response.status(status).json(errors)
}


/**
 * Respond to this request with an 400 error code and a message.
 * @param errors The error objects
 * @param response The express response object
 */
export function badRequest(
    errors : Error[],
    response : Response
) 
{
    error(
        400,
        errors,
        response
    )
}


/**
 * Respond to this request with an 401 error code and a message.
 * @param errors The error objects
 * @param response The express response object
 */
export function unauthorized(
    errors : Error[],
    response : Response
) 
{
    error(
        401,
        errors,
        response
    )
}


/**
 * Respond to this request with an 403 error code and a message.
 * @param errors The error objects
 * @param response The express response object
 */
export function forbidden(
    errors : Error[],
    response : Response
) 
{
    error(
        403,
        errors,
        response
    )
}


export default {
    badRequest: badRequest,
    unauthorized: unauthorized,
    forbidden: forbidden
}