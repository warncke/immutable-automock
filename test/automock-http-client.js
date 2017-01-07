'use strict'

// load automock first
const automock = require('../lib/immutable-automock')

const MockLogClient = require('../mock/mock-log-client')
const Promise = require('bluebird')
const _ = require('lodash')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const httpClient = require('immutable-http-client')
const httpServer = require('http-promise')
const immutable = require('immutable-core')

chai.use(chaiAsPromised)
const assert = chai.assert

const testPort = 37591
const testUrl = 'http://localhost:'+testPort

describe('immutable-automock: http-client', function () {

    beforeEach(function () {
        // reset mock data
        automock.reset()
    })

    it('should mock successful http request / response', function () {
        // build mock data from log client
        var mockData = []
        // build log client that will create mock data
        var mockLogClient = new MockLogClient({
            log: function (type, data) {
                // clone data so that it is not modified after log
                mockData.push(_.cloneDeep({type: type, data: data}))
            }
        })
        // count of server requests
        var requests = 0
        // capture original response to test against mock response
        var origRes
        // set log client so that http client will log requests
        httpClient.logClient(mockLogClient)
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            requests++
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.end('foo')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl, {foo: true})
        })
        // load mock data
        .then(function (res) {
            origRes = res
            automock.loadMock(mockData)
        })
        // do request 2nd time - should not be mocked
        .then(function () {
            return httpClient.get(testUrl, {foo: true})
        })
        // test response
        .then(function (res) {
            // mock response should be same as original response
            assert.deepEqual(res, origRes)
            // only one request should have been made
            assert.strictEqual(requests, 1)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

    it('should throw error when requireMock flag is set and no mock data is loaded', function () {
        // should throw error
        assert.throws(function () {
            httpClient.get(testUrl, {}, {
                requireAutomock: true
            })
        }, Error)
        // validate error data
        try {
            httpClient.get(testUrl, {}, {
                requireAutomock: true
            })
        }
        catch (ex) {
            // require error to have automock call data
            assert.isOk(ex.automockCallData)
            assert.isOk(ex.automockStableId)
        }
    })

    it('should mock successful http request error', function () {
        // build mock data from log client
        var mockData = []
        // build log client that will create mock data
        var mockLogClient = new MockLogClient({
            log: function (type, data) {
                // clone data so that it is not modified after log
                mockData.push(_.cloneDeep({type: type, data: data}))
            }
        })
        // count of server requests
        var requests = 0
        // capture original response to test against mock response
        var origErrorMessage
        // set log client so that http client will log requests
        httpClient.logClient(mockLogClient)
        // create test server
        var server = httpServer.createServerAsync(function (req, res) {
            requests++
            res.writeHead(200, {'Content-Type': 'application/json'})
            res.end('foo')
        })
        // listen
        return server.listen(testPort)
        // do request
        .then(function () {
            return httpClient.get(testUrl, {foo: true})
        })
        // should be invalid json error
        .catch(function (err) {
            origErrorMessage = err.message
            automock.loadMock(mockData)
        })
        // do request 2nd time - should not be mocked
        .then(function () {
            return httpClient.get(testUrl, {foo: true})
        })
        // should reject with error
        .catch(function (err) {
            // mock response should be same as original response
            assert.deepEqual(err.message, origErrorMessage)
            // only one request should have been made
            assert.strictEqual(requests, 1)
        })
        .finally(function () {
            // stop server
            return server.close()
        })
    })

})