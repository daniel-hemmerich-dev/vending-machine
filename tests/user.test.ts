'use strict'

import {describe, it, before} from 'node:test'
import assert from 'node:assert'
const supertest = require('supertest')
import app from '../app'
import { Response } from 'supertest'


/**
 * 
 */
describe('user', async () => {
    let cookies : string = ''


    // create a buyer and a seller user and some products
    before(() => {
        return supertest(app).post('/user')
        .send({
            "username": "michael",
            "password": "123456",
            "role": "buyer"
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.username, "michael")
            assert.strictEqual(response.body.role, "buyer")
            assert.strictEqual(response.body.deposit, 0)
        })
    })


    it('should not be able to register with a username that already exist', () => {
        return supertest(app).post('/user')
        .send({
            "username": "michael",
            "password": "123456",
            "role": "buyer"
        })
        .expect(400)
        .expect('Content-Type', /json/)
    })


    it('should be able to login', () => {
        return supertest(app).put('/login')
        .send({
            "username": "michael",
            "password": "123456"
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            cookies = response.headers['set-cookie'].toString().split(';')[0]
            assert.strictEqual(response.body.username, "michael")
            assert.strictEqual(response.body.role, "buyer")
            assert.strictEqual(response.body.deposit, 0)
        })
    })


    it('should be able to update', () => {
        return supertest(app).put('/user')
        .set('Cookie', cookies)
        .send({
            "username": "michaelbuyer",
            "password": "123456",
            "role": "buyer"
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.username, "michaelbuyer")
            assert.strictEqual(response.body.role, "buyer")
            assert.strictEqual(response.body.deposit, 0)
        })
    })


    it('should be able to read own data', () => {
        return supertest(app).get('/user')
        .set('Cookie', cookies)
        .expect(200)
        .expect('Content-Type', /json/)
        .then((response : Response) => {
            assert.strictEqual(response.body.username, "michaelbuyer")
            assert.strictEqual(response.body.role, "buyer")
            assert.strictEqual(response.body.deposit, 0)
        })
    })


    it('should be able to delete their own user ', () => {
        return supertest(app).delete('/user')
        .set('Cookie', cookies)
        .expect(204)
    })
})