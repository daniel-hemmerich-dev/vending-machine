'use strict'

import {describe, it, before, after} from 'node:test'
import assert from 'node:assert'
const supertest = require('supertest')
import app from '../app'
import { Response } from 'supertest'


/**
 * 
 */
describe('user with buyer role', async () => {
    let cookies : string = ''


    // create and login a user
    before(() => {
        return supertest(app).post('/user')
        .send({
            "username": "jim",
            "password": "123456",
            "role": "buyer"
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            return supertest(app).put('/login')
            .send({
                "username": "jim",
                "password": "123456"
            })
            .expect(201)
            .expect('Content-Type', /json/)
            .then((response : Response) => {
                cookies = response.headers['set-cookie'].toString().split(';')[0]
                assert.strictEqual(response.body.username, "jim")
                assert.strictEqual(response.body.role, "buyer")
                assert.strictEqual(response.body.deposit, 0)
            })
        })
    })


    it('should be able to deposit 5 coins', () => {
        return supertest(app).put('/deposit/5')
        .set('Cookie', cookies)
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.deposit, 5)            
        })
    })


    it('should be able to deposit 10 coins', () => {
        return supertest(app).put('/deposit/10')
        .set('Cookie', cookies)
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.deposit, 15)
        })
    })


    it('should be able to deposit 20 coins', () => {
        return supertest(app).put('/deposit/20')
        .set('Cookie', cookies)
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.deposit, 35)
        })
    })


    it('should be able to deposit 50 coins', () => {
        return supertest(app).put('/deposit/50')
        .set('Cookie', cookies)
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.deposit, 85)
        })
    })


    it('should be able to deposit 100 coins', () => {
        return supertest(app).put('/deposit/100')
        .set('Cookie', cookies)
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.deposit, 185)
        })
    })


    it('should not be able to deposit 42 coins', () => {
        return supertest(app).put('/deposit/42')
        .set('Cookie', cookies)
        .expect(400)
        .expect('Content-Type', /json/)
    })


    it('should be able to reset the deposit to zero coins', () => {
        return supertest(app).put('/reset')
        .set('Cookie', cookies)
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.deposit, 0)
        })
    })


    it('should be able to to buy a product', { todo: 'create a product first from a seller to buy' }, () => {

    })


    it('should not be able to to create a product', () => {
        return supertest(app).post('/product')
        .set('Cookie', cookies)
        .send({
            "amountAvailable": 4,
            "cost": 50,
            "productName": "Coca Cola"
        })
        .expect(403)
        .expect('Content-Type', /json/)
    })


    it('should not be able to to update a product', { todo: 'create a product first from a seller to update' }, () => {

    })


    it('should not be able to to delete a product', { todo: 'create a product first from a seller to delete' }, () => {

    })


    // delete the user and log it out
    after(() => {
        return supertest(app).delete('/user')
        .set('Cookie', cookies)
        .expect(204)
    })
})