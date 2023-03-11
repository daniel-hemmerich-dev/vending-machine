'use strict'

import {describe, it, before, after} from 'node:test'
import assert from 'node:assert'
const supertest = require('supertest')
import app from '../src/app'
import { Response } from 'supertest'


/**
 * 
 */
describe('user with seller role', async () => {
    let cookies : string = ''
    let productId : string = ''


    before(async () => {
        // create a user
        await supertest(app).post('/user')
        .send({
            "username": "kara",
            "password": "123456",
            "role": "seller"
        })
        .expect(201)
        .expect('Content-Type', /json/)


        // login
        let response = await supertest(app).put('/login')
        .send({
            "username": "kara",
            "password": "123456"
        })
        .expect(201)
        .expect('Content-Type', /json/)

        cookies = response.headers['set-cookie'].toString().split(';')[0]
        assert.strictEqual(response.body.username, "kara")
        assert.strictEqual(response.body.role, "seller")
        assert.strictEqual(response.body.deposit, 0)


        // create a product
        response = await supertest(app).post('/product')
        .set('Cookie', cookies)
        .send({
            "amountAvailable": 4,
            "cost": 50,
            "productName": "Coca Cola"
        })
        .expect(201)
        .expect('Content-Type', /json/)

        assert.strictEqual(response.body.productName, "Coca Cola")
        assert.strictEqual(response.body.cost, 50)
        assert.strictEqual(response.body.amountAvailable, 4)
        assert.ok(response.body.id)
        productId = response.body.id
    })


    it('should not be able to deposit 5 coins', () => {
        return supertest(app).put('/deposit/5')
        .set('Cookie', cookies)
        .expect(403)
        .expect('Content-Type', /json/)
    })


    it('should not be able to reset the deposit to zero coins', () => {
        return supertest(app).put('/reset')
        .set('Cookie', cookies)
        .expect(403)
        .expect('Content-Type', /json/)
    })


    it('should not be able to to buy a product', () => {
        return supertest(app).put('/buy/' + productId + '/1')
        .set('Cookie', cookies)
        .expect(403)
        .expect('Content-Type', /json/)
    })


    it('should be able to to create a product', () => {
        return supertest(app).post('/product')
        .set('Cookie', cookies)
        .send({
            "amountAvailable": 7,
            "cost": 55,
            "productName": "Fanta"
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.amountAvailable, 7)
            assert.strictEqual(response.body.cost, 55)
            assert.strictEqual(response.body.productName, "Fanta")
        })
    })


    it('should be able to to update a product', () => {
        return supertest(app).put('/product/' + productId)
        .set('Cookie', cookies)
        .send({
            "amountAvailable": 5,
            "cost": 60,
            "productName": "Coca Cola Zero"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.amountAvailable, 5)
            assert.strictEqual(response.body.cost, 60)
            assert.strictEqual(response.body.productName, "Coca Cola Zero")
        })
    })


    it('should not be able to to delete a product', () => {
        return supertest(app).delete('/product/' + productId)
        .set('Cookie', cookies)
        .expect(204)
    })


    // delete the user and log it out
    after(() => {
        return supertest(app).delete('/user')
        .set('Cookie', cookies)
        .expect(204)
    })
})