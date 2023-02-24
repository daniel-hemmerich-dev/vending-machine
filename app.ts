'use strict'

import dotenv from 'dotenv'
import express, { Express, Request, Response } from 'express'
import auth from './auth'
import user from './user'


// init the server
dotenv.config()
const app : Express = express()
app.use(express.json())


// define routes
app.post('/user', user.validate, user.create)
app.put('/user', auth.authenticate, user.validate, user.update)
app.delete('/user', auth.authenticate, user.destroy)
app.get('/user', auth.authenticate, user.read)


// 404 handler
app.use((request:Request, response:Response) => {
  response.status(404).send("Not found!")
})


// 500 handler
app.use((error : Error, request : Request, response : Response) => {
  console.error(error.stack)
  response.status(500).send('Something went wrong!')
})


// starting the server
app.listen(
  process.env.PORT, 
  () => console.log(`Vending machine listening on port ${process.env.PORT}`)
)