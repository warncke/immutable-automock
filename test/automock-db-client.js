'use strict'

// load automock first
const automock = require('../lib/immutable-automock')

const ImmutableDatabaseMariaSQL = require('immutable-database-mariasql')
const MockLogClient = require('../mock/mock-log-client')
const Promise = require('bluebird')
const _ = require('lodash')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const assert = chai.assert

const dbHost = process.env.DB_HOST || 'localhost'
const dbName = process.env.DB_NAME || 'test'
const dbPass = process.env.DB_PASS || ''
const dbUser = process.env.DB_USER || 'root'

// use the same params for all connections
const connectionParams = {
    charset: 'utf8',
    db: dbName,
    host: dbHost,
    password: dbPass,
    user: dbUser,
}

describe('immutable-automock: db-client', function () {

    beforeEach(function () {
        // reset mock data
        automock.reset()
    })

    it('should mock db query', function () {
        // build mock data from log client
        var mockData = []
        // capture original response to test against mock response
        var origRes
        // build log client that will create mock data
        var mockLogClient = new MockLogClient({
            log: function (type, data) {
                // skip dbConnection logs
                if (type === 'dbConnection') {
                    return
                }
                // clone data so that it is not modified after log
                mockData.push(_.cloneDeep({type: type, data: data}))
            }
        })
        // create new connection
        var db = new ImmutableDatabaseMariaSQL(connectionParams, {
            logClient: mockLogClient,
        })
        // do query
        return db.query('SELECT CURRENT_TIMESTAMP() AS time')
        // capture response and load mock data
        .then(function (res) {
            // capture original response to test against mock response
            origRes = res
            // load mock data
            automock.loadMock(mockData)
        })
        // wait 2 seconds so actual query would return different time
        .then(function () {
            return Promise.delay(1000)
        })
        // do query again which should return mocked value
        .then(function () {
            return db.query('SELECT CURRENT_TIMESTAMP() AS time')
        })
        // test response
        .then(function (res) {
            // mock response should be same as original response
            assert.deepEqual(res, origRes)
        })
        // close database connection
        .finally(function () {
            db.close()
        })
    })

    it('should throw error when requireMock flag is set and no mock data is loaded', function () {
        // create new connection
        var db = new ImmutableDatabaseMariaSQL(connectionParams)
        // should throw error
        assert.throws(function () {
            db.query('SELECT CURRENT_TIMESTAMP() AS time', {}, {}, {
                requireAutomock: true
            })
        }, Error)
        // validate error data
        try {
            db.query('SELECT CURRENT_TIMESTAMP() AS time', {}, {}, {
                requireAutomock: true
            })
        }
        catch (ex) {
            // require error to have automock call data
            assert.isOk(ex.automockCallData)
            assert.isOk(ex.automockStableId)
        }
        // close database connection
        db.close()
    })

    it('should mock db query error', function () {
        // build mock data from log client
        var mockData = []
        // capture original response to test against mock response
        var origRes
        // build log client that will create mock data
        var mockLogClient = new MockLogClient({
            log: function (type, data) {
                // skip dbConnection logs
                if (type === 'dbConnection') {
                    return
                }
                // clone data so that it is not modified after log
                mockData.push(_.cloneDeep({type: type, data: data}))
            }
        })
        // create new connection
        var db = new ImmutableDatabaseMariaSQL(connectionParams, {
            logClient: mockLogClient,
        })
        // do bad query that will result in error
        return db.query('FOO')
        // capture response and load mock data
        .catch(function (res) {
            // capture original response to test against mock response
            origRes = res
            // load mock data
            automock.loadMock(mockData)
        })
        // do query again which should return mocked value
        .then(function () {
            return db.query('FOO')
        })
        // test response
        .catch(function (res) {
            // mock response should be same as original response
            assert.strictEqual(res.code, origRes.code)
            assert.strictEqual(res.isOperational, origRes.isOperational)
            assert.strictEqual(res.message, origRes.message)
        })
        // close database connection
        .finally(function () {
            db.close()
        })
    })

})