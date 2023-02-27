'use strict'

import {describe, it, before} from 'node:test'
import assert from 'node:assert'
const supertest = require('supertest')
import app from '../app'


/**
 * 
 */
describe('user', async () => {
    let sellerCookies : string = ''
    let buyerCookies : string = ''


    // create a buyer and a seller user and some products
    before(async () => {
        await supertest(app).post('/user')
        .send({
            "username": "michael",
            "password": "123456",
            "role": "buyer"
        })
        .expect(201)
        .expect('Content-Type', /json/)

        await supertest(app).post('/user')
        .send({
            "username": "rachel",
            "password": "123456",
            "role": "seller"
        })
        .expect(201)
        .expect('Content-Type', /json/)
    })


    it('should not be able to register with a username that already exist', async () => {
        await supertest(app).post('/user')
        .send({
            "username": "michael",
            "password": "123456",
            "role": "buyer"
        })
        .expect(400)
        .expect('Content-Type', /json/)

        await supertest(app).post('/user')
        .send({
            "username": "rachel",
            "password": "123456",
            "role": "seller"
        })
        .expect(400)
        .expect('Content-Type', /json/)
    })


    it('should be able to login', async () => {
        let response = await supertest(app).put('/login')
        .send({
            "username": "michael",
            "password": "123456"
        })
        .expect(201)
        .expect('Content-Type', /json/)
    
        buyerCookies = response.headers['set-cookie'].toString().split(';')[0]

        assert.strictEqual(response.body.username, "michael")
        assert.strictEqual(response.body.role, "buyer")
        assert.strictEqual(response.body.deposit, 0)
    

        response = await supertest(app).put('/login')
        .send({
            "username": "rachel",
            "password": "123456"
        })
        .expect(201)
        .expect('Content-Type', /json/)
        sellerCookies = response.headers['set-cookie'].toString().split(';')[0]

        assert.strictEqual(response.body.username, "rachel")
        assert.strictEqual(response.body.role, "seller")
        assert.strictEqual(response.body.deposit, 0)
    })


    it('should be able to update', async () => {
        let response = await supertest(app).put('/user')
        .set('Cookie', buyerCookies)
        .send({
            "username": "michaelbuyer",
            "password": "123456",
            "role": "buyer"
        })
        .expect(200)
        .expect('Content-Type', /json/)

        assert.strictEqual(response.body.username, "michaelbuyer")
        assert.strictEqual(response.body.role, "buyer")
        assert.strictEqual(response.body.deposit, 0)
        

        response = await supertest(app).put('/user')
        .set('Cookie', sellerCookies)
        .send({
            "username": "rachelseller",
            "password": "123456",
            "role": "seller"
        })
        .expect(200)
        .expect('Content-Type', /json/)

        assert.strictEqual(response.body.username, "rachelseller")
        assert.strictEqual(response.body.role, "seller")
        assert.strictEqual(response.body.deposit, 0)
    })


    it('should be able to read own data', async () => {
        let response = await supertest(app).get('/user')
        .set('Cookie', buyerCookies)
        .expect(200)
        .expect('Content-Type', /json/)

        assert.strictEqual(response.body.username, "michaelbuyer")
        assert.strictEqual(response.body.role, "buyer")
        assert.strictEqual(response.body.deposit, 0)


        response = await supertest(app).get('/user')
        .set('Cookie', sellerCookies)
        .expect(200)
        .expect('Content-Type', /json/)

        assert.strictEqual(response.body.username, "rachelseller")
        assert.strictEqual(response.body.role, "seller")
        assert.strictEqual(response.body.deposit, 0)
    })


    it('should be able to deposit coins with the buyer role', async () => {
        let response = await supertest(app).put('/deposit/50')
        .set('Cookie', buyerCookies)
        .expect(200)
        .expect('Content-Type', /json/)

        assert.strictEqual(response.body.username, "michaelbuyer")
        assert.strictEqual(response.body.role, "buyer")
        assert.strictEqual(response.body.deposit, 50)


        response = await supertest(app).put('/deposit/100')
        .set('Cookie', buyerCookies)
        .expect(200)
        .expect('Content-Type', /json/)

        assert.strictEqual(response.body.username, "michaelbuyer")
        assert.strictEqual(response.body.role, "buyer")
        assert.strictEqual(response.body.deposit, 150)


        await supertest(app).put('/deposit/42')
        .set('Cookie', buyerCookies)
        .expect(400)
        .expect('Content-Type', /json/)
    })


    it('should not be able to deposit coins with the seller role ', async () => {
        await supertest(app).put('/deposit/50')
        .set('Cookie', sellerCookies)
        .expect(403)
        .expect('Content-Type', /json/)
    })


    it('should be able to delete their own user ', async () => {
        await supertest(app).delete('/user')
        .set('Cookie', buyerCookies)
        .expect(204)
        
        await supertest(app).delete('/user')
        .set('Cookie', sellerCookies)
        .expect(204)
    })
})