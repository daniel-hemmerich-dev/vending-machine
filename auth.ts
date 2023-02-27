'use strict'

import { Request, Response, NextFunction } from 'express'
import userNamespace from './user'
import {User, UserRole, Product} from './index'
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
import errorNamesapce from './error'
import productNamespace from './product'
import { body, validationResult } from 'express-validator'


/**
 * Validate the user fields of the body necessary for a login
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
export async function validate(
    request : Request,
    response : Response,
    next : NextFunction
) 
{
    // validate
    await body('username').isAlphanumeric().isLength({ min:3, max:32 }).run(request)
    await body('password').isLength({ min: 4, max: 16 }).run(request)

    // if there are errors, provide an error response
    const errors = validationResult(request)
    if (!errors.isEmpty()) return response.status(400).json(errors.array())

    // pass to the next handler
    next()
}


/**
 * Logout a user
 * @param request The express request object
 * @param response The express response object
 */
export async function logout(
    request : Request, 
    response : Response
)
{
    response.clearCookie(process.env.JWT_COOKIE_NAME ?? 'vending-machine-jwt')
    
    response.status(204).send('')
}


/**
 * Login a user
 * @param request The express request object
 * @param response The express response object
 */
export async function login(
    request : Request, 
    response : Response
)
{
    // check if the user credentials are valid
    const user : User | null = userNamespace.findByUsername(
        request.body.username ?? ''
    )

    // if the user does not exist respond with an error
    if (!user) {
        return errorNamesapce.badRequest(
            [
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
            ],
            response
        )
    }

    // compare the password
    try {
        if (!await bcrypt.compare(
            request.body.password, 
            user.password
        )) {
            return response.status(401).send('')
        }
    } catch {
        return response.status(500).send('')
    }

    // create the jwt token
    const accessToken : string = jwt.sign(
        { sub: user.id },
        process.env.JWT_ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    )

    // set the jwt token as a cookie
    response.cookie(
        process.env.JWT_COOKIE_NAME ?? 'vending-machine-jwt',
        accessToken,
        {
            maxAge: 1000 * 60 * 15, 
            //httpOnly: true, 
            //signed: true // Indicates if the cookie should be signed
        }
    );

    return response.status(201).send(user)
}


/**
 * Checks if the user is valid by username and password
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
export function authenticate(
    request : Request, 
    response : Response, 
    next : NextFunction
)
{
    // validate the jwt token signature
    const jwtToken = /.*vending-machine-jwt=(.+);*/.exec(request.headers.cookie ?? '')

    // respond with an error if there is no token set in the cookie
    if (!jwtToken) {
        return errorNamesapce.unauthorized(
            [{
                value: '',
                msg: 'Invalid token',
                param: process.env.JWT_COOKIE_NAME ?? 'vending-machine-jwt'
            }],
            response
        )
    }

    // verify the token
    jwt.verify(
        jwtToken[1],
        process.env.JWT_ACCESS_TOKEN_SECRET,
        function (error: any, content: any) {
            // If there is an error the token has expired and we send an error response
            if (error) {
                return errorNamesapce.forbidden(
                    [{
                        value: jwtToken[1],
                        msg: 'Token expired',
                        param: process.env.JWT_COOKIE_NAME ?? 'vending-machine-jwt'
                    }],
                    response
                )
            } 

            // If there is no sub data we send an error response
            if (!content.sub) {
                return errorNamesapce.forbidden(
                    [{
                        value: '',
                        msg: 'Invalid token content',
                        param: 'sub'
                    }],
                    response
                )
            } 

            // if there is no user with that id we send an error response
            const user = userNamespace.findById(content.sub)
            if (!user) {
                return errorNamesapce.forbidden(
                    [{
                        value: content.sub,
                        msg: 'Invalid user id',
                        param: 'sub'
                    }],
                    response
                )
            } 

            // store user and pass to the next handler
            response.locals.user = user
            next()
        }
    )
}


/**
 * Checks if the user has the seller role
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
export function authoriseSeller(
    request : Request, 
    response : Response, 
    next : NextFunction
)
{
    if(response.locals.user.role !== UserRole.Seller) {
        return errorNamesapce.forbidden(
            [{
                value: response.locals.user.role,
                msg: 'Seller role is required for this operation',
                param: 'role'
            }],
            response
        )
    }

    next()
}


/**
 * Checks if the user has the buyer role
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
export function authoriseBuyer(
    request : Request, 
    response : Response, 
    next : NextFunction
)
{
    if(response.locals.user.role !== UserRole.Buyer) {
        return errorNamesapce.forbidden(
            [{
                value: response.locals.user.role,
                msg: 'Buyer role is required for this operation',
                param: 'role'
            }],
            response
        )
    }

    next()
}


/**
 * Checks if the user created the product
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
export function authoriseOwner(
    request : Request, 
    response : Response, 
    next : NextFunction
)
{
    // if the product does not exist send an error resonse
    const product : Product | null = productNamespace.findById(request.params.id)
    if (!product) {
        return errorNamesapce.badRequest(
            [{
                value: request.params.id,
                msg: 'Invalid product id',
                param: 'id'
            }],
            response
        )
    }

    // if the authenticated user is not the owner of the product send an error response
    if(response.locals.user.id !== product.sellerId) {
        return errorNamesapce.badRequest(
            [{
                value: request.params.id,
                msg: 'Authenticated user is not the owner of product',
                param: 'id'
            }],
            response
        )
    }

    // save the product and pass it to the next handler
    response.locals.product = product
    next()
}


export default {
    validate: validate,
    login: login,
    logout: logout,
    authenticate: authenticate,
    authoriseSeller: authoriseSeller,
    authoriseOwner: authoriseOwner,
    authoriseBuyer: authoriseBuyer
}