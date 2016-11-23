'use strict'

const MockLogClient = require('../mock/mock-log-client')
const Promise = require('bluebird')
const _ = require('lodash')
const automock = require('../lib/immutable-automock')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const immutable = require('immutable-core')

chai.use(chaiAsPromised)
const assert = chai.assert

describe('immutable-automock', function () {

    it('should wrap method with automock function', function () {
        // reset global singleton data
        immutable.reset()
        // apply automock
        automock.mock()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // check that foo is wrapped with automock function
        assert.match(fooModule.foo.toString(), /automockWrapper/)
    })

    it('should call original method when no mock data is loaded', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // apply automock
        automock.mock()
        // will be set true when method called
        var methodCalled = false
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                methodCalled = true
            },
        })
        // call method
        return fooModule.foo().then(function () {
            // check that original method was called
            assert.isTrue(methodCalled)
        })
    })

    it('should return mock data and not call original method when mock data loaded', function () {
        // build mock data from log client
        var mockData = []
        // build log client that will create mock data
        var mockLogClient = new MockLogClient({
            log: function (type, data) {
                // clone data so that it is not modified after log
                mockData.push(_.cloneDeep({type: type, data: data}))
            }
        })
        // reset global singleton data
        immutable.reset().strictArgs(false).logClient(mockLogClient)
        // apply automock
        automock.mock()
        // flags set when methods are called
        var barCalled = false
        var fooCalled = false
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            bar: function (args) {
                barCalled = true
                return Promise.resolve(true)
            },
            foo: function (args) {
                fooCalled = true
                return fooModule.bar(args)
            },
        })
        // call method once to build mock data
        return fooModule.foo().then(function (res) {
            // reset method called flags
            barCalled = false
            fooCalled = false
            // load mock data from first call to mock subsequent calls
            automock.loadMock(mockData)
            // call module a second time which should now have data mocked
            return fooModule.foo()
        })
        // test results of mocked call
        .then(function (res) {
            // test that response is correct
            assert.strictEqual(res, true)
            // test that neither original method was called
            assert.strictEqual(barCalled, false)
            assert.strictEqual(fooCalled, false)
        })
    })

    it('should load single line array of mock data from file', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // reset and apply automock
        automock.reset().mock()
        // load mock data from file
        automock.loadMockFromFile(__dirname+'/../mock/mock-data-single.json')
        // flags set when methods are called
        var fooCalled = false
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            bar: function (args) {
                return Promise.resolve(true)
            },
            foo: function (args) {
                fooCalled = true
                return fooModule.bar(args)
            },
        })
        // call method which should be mocked
        return fooModule.foo()
        // test results of mocked call
        .then(function (res) {
            // test that response is correct
            assert.strictEqual(res, true)
            // test that neither original method was called
            assert.strictEqual(fooCalled, false)
        })
    })

    it('should load multi line mock data from file', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // reset and apply automock
        automock.reset().mock()
        // load mock data from file
        automock.loadMockFromFile(__dirname+'/../mock/mock-data-multi.json')
        // flags set when methods are called
        var fooCalled = false
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            bar: function (args) {
                return Promise.resolve(true)
            },
            foo: function (args) {
                fooCalled = true
                return fooModule.bar(args)
            },
        })
        // call method which should be mocked
        return fooModule.foo()
        // test results of mocked call
        .then(function (res) {
            // test that response is correct
            assert.strictEqual(res, true)
            // test that neither original method was called
            assert.strictEqual(fooCalled, false)
        })
    })

    it('should clear global mock data when reset called', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // reset and apply automock
        automock.reset().mock()
        // load mock data from file
        automock.loadMockFromFile(__dirname+'/../mock/mock-data-single.json')
        // flags set when methods are called
        var barCalled = false
        var fooCalled = false
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            bar: function (args) {
                barCalled = true
                return Promise.resolve(true)
            },
            foo: function (args) {
                fooCalled = true
                return fooModule.bar(args)
            },
        })
        // call method which should be mocked
        return fooModule.foo()
        // test results of mocked call
        .then(function (res) {
            // test that response is correct
            assert.strictEqual(res, true)
            // test that neither original method was called
            assert.strictEqual(barCalled, false)
            assert.strictEqual(fooCalled, false)
            // reset global mock data
            automock.reset()
            // call foo again which should not be mocked
            return fooModule.foo()
        })
        // test results of call
        .then(function (res) {
            // test that response is correct
            assert.strictEqual(res, true)
            // test that original method was called
            assert.strictEqual(barCalled, true)
            assert.strictEqual(fooCalled, true)
        })
    })


    it('should not use mock when automock flag on session set to false', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // reset and apply automock
        automock.reset().mock()
        // load mock data from file
        automock.loadMockFromFile(__dirname+'/../mock/mock-data-multi.json')
        // flags set when methods are called
        var barCalled = false
        var fooCalled = false
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            bar: function (args) {
                barCalled = true
                return Promise.resolve(true)
            },
            foo: function (args) {
                fooCalled = true
                return fooModule.bar(args)
            },
        })
        // call method which should be mocked
        return fooModule.foo({
            session: {
                automock: false
            }
        })
        // test results of mocked call
        .then(function (res) {
            // test that response is correct
            assert.strictEqual(res, true)
            // test that foo was called but bar was mocked
            assert.strictEqual(barCalled, false)
            assert.strictEqual(fooCalled, true)
        })
    })

    it('should throw error when loading invalid mock data', function () {
        assert.throws(function () {
            automock.loadMock(null)
        }, Error)
    })

    it('should not throw error when loading invalid mock data if ignoreMockDataErrors flag is set', function () {
        assert.doesNotThrow(function () {
            automock.loadMock(null, {ignoreMockDataErrors: true})
        }, Error)
    })

    it('should throw error when loading mock data with invalid type', function () {
        assert.throws(function () {
            automock.loadMock({type: 'FOO', data: {}})
        }, Error)
    })

    it('should not throw error when loading mock data with invalid type if ignoreInvalidMockDataType flag is set', function () {
        assert.doesNotThrow(function () {
            automock.loadMock({type: 'FOO', data: {}}, {ignoreInvalidMockDataType: true})
        }, Error)
    })

    it('should not throw error when loading mock data file with empty lines', function () {
        assert.doesNotThrow(function () {
            automock.loadMockFromFile(__dirname+'/../mock/mock-data-multi-empty-line.json')
        }, Error)
    })

    it('should throw error when loading mock data file with bad data', function () {
        assert.throws(function () {
            automock.loadMockFromFile(__dirname+'/../mock/mock-data-multi-error.json')
        }, Error)
    })

    it('should not throw error when loading mock data file with bad data if ignoreMockDataErrors flag is set', function () {
        assert.doesNotThrow(function () {
            automock.loadMockFromFile(__dirname+'/../mock/mock-data-multi-error.json', {ignoreMockDataErrors: true})
        }, Error)
    })
})