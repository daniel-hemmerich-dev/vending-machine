'use strict'

import test from 'node:test'
const supertest = require('supertest')
import app from '../src/app'


test('404', (t) => {
    return supertest(app).get('/').expect(404)
})