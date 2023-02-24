'use strict'

import {Response} from 'express'
import {Error} from './index'


/**
 * 
 * @param status 
 * @param errors 
 * @param response 
 */
function error(
    status : number,
    errors : Error[],
    response : Response
)
{
    return response.status(status).json(errors)
}


/**
 * 
 * @param errors 
 * @param response 
 * @returns 
 */
export function badRequest(
    errors : Error[],
    response : Response
) 
{
    return error(
        400,
        errors,
        response
    )
}


/**
 * 
 * @param errors 
 * @param response 
 * @returns 
 */
export function unauthorized(
    errors : Error[],
    response : Response
) 
{
    return error(
        401,
        errors,
        response
    )
}


/**
 * 
 * @param errors 
 * @param response 
 * @returns 
 */
export function forbidden(
    errors : Error[],
    response : Response
) 
{
    return error(
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