'use strict'

//import assert from 'node:assert'
import test from 'node:test'
const supertest = require('supertest')
import app from './../app'
//import {Response} from 'express'


test('404', (t) => {
    return supertest(app).get('/').expect(404)
})