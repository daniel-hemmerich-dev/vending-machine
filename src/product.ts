'use strict'

import { Product } from "./index"
import { NextFunction, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import error from './error'
import crypto from 'crypto'


// The product data
const products : Product[] = []


/**
 * Finds and returns a product that matches the id
 * @param id The id of the product
 * @returns The matching product or null if a product was not found
 */
export function findById(
    id : string
) : Product | null
{
    const product : Product | undefined = products.find(
        element => element.id === id
    )

    return product ?? null
}


/**
 * Finds and returns a product that matches the productname
 * @param productname The productname of the product
 * @returns The matching product or null if a product was not found
 */
export function findByProductname(
    productname : string
) : Product | null
{
    const product : Product | undefined = products.find(
        element => element.productName.toLowerCase() === productname.toLowerCase()
    )

    return product ?? null
}


/**
 * Validate the product fields of the body
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
    await body('productName').isLength({ min:3, max:32 }).run(request)
    await body('cost').isInt({ min: 5, max : 250 }).isDivisibleBy(5).run(request)
    await body('amountAvailable').isInt({ min: 0, max: 42 }).run(request)

    // if there are errors, provide an error response
    const errors = validationResult(request)
    if (!errors.isEmpty()) return response.status(400).json(errors.array())

    // pass to the next handler
    next()
}


/**
 * Create a product
 * @param request The express request object
 * @param response The express response object
 */
export async function create(
    request : Request<{}, {}, Product>,
    response : Response
) 
{
    // respond with an error if the productname already exist
    if (findByProductname(request.body.productName ?? '')) {
        error.badRequest(
            [{
                value: request.body.productName,
                msg: 'ProductName already exist',
                param: 'productName'
            }],
            response
        )
    }

    // create the product
    const product : Product = {
        id: crypto.randomUUID(),
        productName: request.body.productName ?? '',
        amountAvailable: request.body.amountAvailable ?? 0,
        cost: request.body.cost ?? 0,
        sellerId: response.locals.user.id
    }
    products.push(product)

    // respond with the user
    return response.status(201).send(product)
}


/**
 * Read the product information
 * @param request The express request object
 * @param response The express response object
 */
export function read(
    request : Request,
    response : Response
) 
{
    // if the product does not exist send an error resonse
    const product : Product | null = findById(request.params.id)
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

    response.json(product)
}


/**
 * Update the product
 * @param request The express request object
 * @param response The express response object
 */
export async function update(
    request : Request<{}, {}, Product>,
    response : Response
) 
{
    response.locals.product.amountAvailable = request.body.amountAvailable
    response.locals.product.cost = request.body.cost
    response.locals.product.productName = request.body.productName

    return response.json(response.locals.product)
}


/**
 * Delete the product
 * @param request The express request object
 * @param response The express response object
 */
export function destroy(
    request : Request,
    response : Response
) 
{
    products.splice(
        products.indexOf(response.locals.product),
        1
    )

    response.status(204).send('')
}


export default {
    findById: findById,
    findByProductname: findByProductname,
    validate: validate,
    create: create,
    read: read,
    update: update,
    destroy: destroy
}