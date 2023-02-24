'use strict'

import { User, UserRole, Error } from './index'
import { NextFunction, Request, Response } from 'express'
import { body, validationResult, oneOf } from 'express-validator'
import auth from './auth'
import crypto from 'crypto'


// The user database
const users : User[] = []


/**
 * Finds and returns a user that matches the id
 * @param id The id of the user
 * @returns The matching user or null if a user was not found
 */
export function findById(
    id : string
) : User | null
{
    const user : User | undefined = users.find(
        element => element.id === id
    )

    return user ?? null
}


/**
 * Finds and returns a user that matches the username
 * @param username The username of the user
 * @returns The matching user or null if a user was not found
 */
export function findByUsername(
    username : string
) : User | null
{
    const user : User | undefined = users.find(
        element => element.username.toLowerCase() === username.toLowerCase()
    )

    return user ?? null
}


/**
 * Finds and returns a user that matches the username and password
 * @param username The username of the user
 * @param password The password of the user
 * @returns The matching user or null if a user was not found
 */
export function findByUsernameAndPassword(
    username : string,
    password : string
) : User | null
{
    const user : User | null = findByUsername(username)

    if (!user) return null

    return user.password === password ? user : null
}


/**
 * Validate the user fields of the body
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
    await body('id').optional().isAlphanumeric().isLength({ min: 36, max: 36 }).run(request)
    await body('username').isAlphanumeric().isLength({ min:3, max:32 }).run(request)
    await body('password').isLength({ min: 4, max: 16 }).run(request)
    await body('deposit').optional().isInt().isLength({ min: 0 }).run(request)
    await oneOf([
        body('role').equals(UserRole.Seller),
        body('role').equals(UserRole.Buyer)
    ]).run(request)


    // if there are errors, provide an error response
    const errors = validationResult(request)
    if (!errors.isEmpty()) return response.status(400).json(errors.array())

    // pass to the next handler
    next()
}


/**
 * Register a new user
 * @param request The express request object
 * @param response The express response object
 */
export function create(
    request : Request,
    response : Response
) 
{
    // respond with an error if the username already exist
    if (findByUsername(request.body.username ?? '')) {
        const error : Error = {
            value: request.body.username,
            msg: 'Username already exist',
            param: 'username'
        }
        return response.status(400).json([error])
    }

    // create the user
    const user : User = {
        id: crypto.randomUUID(),
        username: request.body.username ?? '',
        password: request.body.password ?? '',
        deposit: 0,
        role: request.body.role ?? ''
    }
    users.push(user)

    // login the user
    auth.login(
        request,
        response
    )

    // respond with the user
    response.send(user)
}


/**
 * Read the user information
 * @param request The express request object
 * @param response The express response object
 */
export function read(
    request : Request,
    response : Response
) 
{
    // return the user from the authentication middleware
    if (response.locals.user) return response.json(response.locals.user)

    // otherwise respond with an error
    const error : Error = {
        value: '',
        msg: 'Invalid user',
        param: 'sub'
    }
    response.status(500).json([error])
}


/**
 * Update the user
 * @param request The express request object
 * @param response The express response object
 */
export function update(
    request : Request,
    response : Response
) 
{
    // update and return the user from the authentication middleware
    if (response.locals.user) {
        response.locals.user.username = request.body.username
        response.locals.user.password = request.body.password
        response.locals.user.role = request.body.role
        return response.json(response.locals.user)
    }

    // otherwise respond with an error
    const error : Error = {
        value: '',
        msg: 'Invalid user',
        param: 'sub'
    }
    response.status(500).json([error])
}


/**
 * Delete the user
 * @param request The express request object
 * @param response The express response object
 */
export function destroy(
    request : Request,
    response : Response
) 
{
    // delete the user from the authentication middleware
    if (response.locals.user) {
        users.splice(
            users.indexOf(response.locals.user),
            1
        )
        return response.send('')
    }

    // otherwise respond with an error
    const error : Error = {
        value: '',
        msg: 'Invalid user',
        param: 'sub'
    }
    response.status(500).json([error])
}


export default {
    findById: findById,
    findByUsername: findByUsername,
    findByUsernameAndPassword: findByUsernameAndPassword,
    validate: validate,
    create: create,
    read: read,
    update: update,
    destroy: destroy
}