'use strict'

import { User, UserRole, Product } from './index'
import { NextFunction, Request, Response } from 'express'
import { body, validationResult, oneOf } from 'express-validator'
import auth from './auth'
import error from './error'
import crypto from 'crypto'
const bcrypt = require('bcrypt')
import productNamespace from './product'


// The user data
const users : User[] = []

// The allowed coins 
const allowedCoins : number[] = [100, 50, 20, 10, 5]


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
    await body('deposit').optional().isInt({ min: 0, max: 1000 }).run(request)
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
export async function create(
    request : Request,
    response : Response
) 
{
    // respond with an error if the username already exist
    if (findByUsername(request.body.username ?? '')) {
        error.badRequest(
            [{
                value: request.body.username,
                msg: 'Username already exist',
                param: 'username'
            }],
            response
        )
    }

    try {
        // hash the password of the user
        const hashedPassword = await bcrypt.hash(
            request.body.password ?? '',
            10
        )

        // create the user
        const user : User = {
            id: crypto.randomUUID(),
            username: request.body.username ?? '',
            password: hashedPassword,
            deposit: 0,
            role: request.body.role ?? ''
        }
        users.push(user)

        // uncomment if you want a user to be logined after registration
        // login the user
        // await auth.login(
        //     request,
        //     response
        // )

        // respond with the user
        return response.status(201).send(user)
    } catch {
        response.status(500).send('')
    }
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
    response.json(response.locals.user)
}


/**
 * Update the user
 * @param request The express request object
 * @param response The express response object
 */
export async function update(
    request : Request,
    response : Response
) 
{
    try {
        const hashedPassword = await bcrypt.hash(
            request.body.password ?? '',
            10
        )

        response.locals.user.username = request.body.username
        response.locals.user.password = hashedPassword
        response.locals.user.role = request.body.role

        return response.json(response.locals.user)
    } catch {
        response.status(500).send('')
    }
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
    users.splice(
        users.indexOf(response.locals.user),
        1
    )

    response.status(204).send('')
}


/**
 * Reset the user. Set the deposit to zero.
 * @param request The express request object
 * @param response The express response object
 */
export function reset(
    request : Request,
    response : Response
)
{
    response.locals.user.deposit = 0

    response.json(response.locals.user)
}


/**
 * Reset the user. Set the deposit to zero.
 * @param request The express request object
 * @param response The express response object
 */
export function deposit(
    request : Request,
    response : Response
)
{
    const coins : number = parseInt(request.params.coins)
    
    // if the coins are not one of the above we respond with an error
    if (!allowedCoins.includes(coins)) {
        return error.badRequest(
            [{
                value: coins.toString(),
                msg: 'Coins must be one of: ' + allowedCoins.toString(),
                param: 'coins'
            }],
            response
        )   
    }

    response.locals.user.deposit += coins

    response.json(response.locals.user)
}


/**
 * Reset the user. Set the deposit to zero.
 * @param request The express request object
 * @param response The express response object
 */
export function buy(
    request : Request,
    response : Response
)
{
    // if the product does not exist send an error resonse
    const product : Product | null = productNamespace.findById(request.params.id)
    if (!product) {
        return error.badRequest(
            [{
                value: request.params.id,
                msg: 'Invalid product id',
                param: 'id'
            }],
            response
        )
    }

    // if the amount is not greater than zero send an error response
    const amount : number = parseInt(request.params.amount)
    if (amount < 1) {
        return error.badRequest(
            [{
                value: request.params.amount,
                msg: 'Amount must be greater than zero',
                param: 'amount'
            }],
            response
        )
    }

    // if the product amount available is smaller than the buy amount send an error response
    if (product.amountAvailable < amount) {
        return error.badRequest(
            [{
                value: request.params.amount,
                msg: 'The product has not enough amount available',
                param: 'amount'
            }],
            response
        )
    }
    product.amountAvailable--

    // if the total spent is greater than the user deposit send an error response
    const totalSpent : number = product.cost * amount
    if(totalSpent > response.locals.user.deposit) {
        return error.badRequest(
            [{
                value: totalSpent.toString(),
                msg: 'You do not have enough deposit for this purchase',
                param: 'amount'
            }],
            response
        )
    }

    // calculate the change
    let change : number = response.locals.user.deposit - totalSpent
    const changeValues : number[] = []
    response.locals.user.deposit = 0
    allowedCoins.map(coin => {
        while (change >= coin) {
            change -= coin
            changeValues.push(coin)
        }
    })

    response.json(
        {
            totalSpent: totalSpent,
            product: product,
            change: changeValues
        }
    )
}


export default {
    findById: findById,
    findByUsername: findByUsername,
    validate: validate,
    create: create,
    read: read,
    update: update,
    destroy: destroy,
    reset: reset,
    deposit: deposit,
    buy: buy
}