'use strict'

import { Request, Response, NextFunction } from 'express'
import userNamespace from './user'
import {User, Error} from './index'
const jwt = require('jsonwebtoken')


/**
 * Login a user
 * @param request The express request object
 * @param response The express response object
 */
export function login(
    request : Request, 
    response : Response
)
{
    // check if the user credentials are valid
    const user : User | null = userNamespace.findByUsernameAndPassword(
        request.body.username ?? '',
        request.body.password ?? '',
    )

    // if the user does not exist respond with an error
    if (!user) {
        const errors : Error[] = [
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
        ]
        return response.status(400).json(errors)
    }

    // create the jwt token
    const accessToken : string = jwt.sign(
        { sub: user.id },
        process.env.JWT_ACCESS_TOKEN_SECRET/*,
        {
            expiresIn: '15m'
        }*/
    )

    // set the jwt token as a cookie
    response.cookie(
        process.env.JWT_COOKIE_NAME ?? 'vending-machine-jwt',
        accessToken,
        {
            maxAge: 1000 * 60 * 15, 
            httpOnly: true, 
            //signed: true // Indicates if the cookie should be signed
        }
    );
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
        const errors : Error[] = [
            {
                value: '',
                msg: 'Invalid token',
                param: process.env.JWT_COOKIE_NAME ?? 'vending-machine-jwt'
            }
        ]
        return response.status(401).json(errors)
    }

    //console.log(jwtToken ? jwtToken[1] : '')
    jwt.verify(
        jwtToken[1],
        process.env.JWT_ACCESS_TOKEN_SECRET,
        function (error: any, content: any) {
            // If there is an error the token has expired and we send an error response
            if (error) {
                const errors : Error[] = [
                    {
                        value: jwtToken[1],
                        msg: 'Token expired',
                        param: process.env.JWT_COOKIE_NAME ?? 'vending-machine-jwt'
                    }
                ]
                return response.status(403).json(errors)
            } 

            // If there is no sub data we send an error response
            if (!content.sub) {
                const errors : Error[] = [
                    {
                        value: '',
                        msg: 'Invalid token content',
                        param: 'sub'
                    }
                ]
                return response.status(403).json(errors)
            } 

            // if there is no user with that id we send an error response
            const user = userNamespace.findById(content.sub)
            if (!user) {
                const errors : Error[] = [
                    {
                        value: content.sub,
                        msg: 'Invalid user id',
                        param: 'sub'
                    }
                ]
                return response.status(403).json(errors)
            } 

            // pass to the next handler
            response.locals.user = user
            next()
        }
    )
}


/**
 * Checks if the user has the rights for a specific operation
 * @param request The express request object
 * @param response The express response object
 * @param next The express next function
 */
export function authorise(
    request : Request, 
    response : Response, 
    next : NextFunction
)
{
    // get the user id from the jwt token

    // checks if the user id is valid to access the data

    next()
}


export default {
    login: login,
    authenticate: authenticate,
    authorise: authorise
}