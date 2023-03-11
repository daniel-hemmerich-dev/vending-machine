'use strict'

import dotenv from 'dotenv'
import express, { Express, Request, RequestHandler, Response } from 'express'
import auth from './auth'
import user from './user'
import product from './product'


// init the server
dotenv.config()
dotenv.config({ path: `.env.local`, override: true })
const app : Express = express()
app.use(express.json())


// define user routes
app.post('/user', user.validate, user.create)
app.put('/user', auth.authenticate, user.validate, user.update)
app.delete('/user', auth.authenticate, user.destroy)
app.get('/user', auth.authenticate, user.read)

// define product routes
app.post('/product', auth.authenticate, auth.authoriseSeller, product.validate, product.create)
app.put('/product/:id', auth.authenticate, auth.authoriseSeller, auth.authoriseOwner, product.validate, product.update)
app.delete('/product/:id', auth.authenticate, auth.authoriseSeller, auth.authoriseOwner, product.destroy)
app.get('/product/:id', product.read)

// define other routes
app.put('/deposit/:coins', auth.authenticate, auth.authoriseBuyer, user.deposit)
app.put('/buy/:id/:amount', auth.authenticate, auth.authoriseBuyer, user.buy)
app.put('/reset', auth.authenticate, auth.authoriseBuyer, user.reset)
app.put('/login', auth.validate, auth.login)
app.put('/logout', auth.authenticate, auth.logout)


// 404 handler
app.use((request:Request, response:Response) => {
  response.status(404).send("Not found!")
})


// 500 handler
app.use((error : Error, request : Request, response : Response) => {
  console.error(error.stack)
  response.status(500).send('Something went wrong!')
})


export default app