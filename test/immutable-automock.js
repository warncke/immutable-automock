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