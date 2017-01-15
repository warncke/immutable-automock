'use strict'

/* npm modules */
const Promise = require('bluebird')
const _ = require('lodash')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const stableId = require('stable-id')

/* exports */
module.exports = {
    // name of npm library that this module applies to
    libraryName: 'immutable-database-mariasql',
    // public functions
    automock: automock,
    dbQueryStableId: dbQueryStableId,
    loadMock: loadMock,
    reset: reset,
}


/* global variables */

// get reference to global singleton instance
var immutableAutomock
// initialize global singleton instance if not yet defined
if (!global.__immutable_automock__) {
    immutableAutomock = global.__immutable_automock__ = {}
}
// use existing singleton instance
else {
    immutableAutomock = global.__immutable_automock__
}

// global store of db query mocks
if (!immutableAutomock.dbQueryMocks) {
    immutableAutomock.dbQueryMocks = {}
}
// global store of db response mocks
if (!immutableAutomock.dbResponseMocks) {
    immutableAutomock.dbResponseMocks = {}
}

// load mock functions for different mock data types
const loadMockFunctions = {
    dbQuery: loadMockDbQuery,
    dbResponse: loadMockDbResponse,
}

/**
 * @function automock
 *
 * @param {object} dbClient
 */
function automock (dbClient) {
    // require db client to have a query method
    if (typeof dbClient.query !== 'function') {
        throw new Error('automock error: db-client must have query method')
    }
    // capture original query method
    var queryFunction = dbClient.query
    // create wrapper for queryPromise method
    dbClient.query = function dbClientQueryAutomockWrapper (query, params, options, session) {
        // if query is not a string then pass through to original
        if (typeof query !== 'string') {
            return queryFunction.apply(this, arguments)
        }
        // require params options and session to be objects
        params = requireValidOptionalObject(params)
        options = requireValidOptionalObject(options)
        session = requireValidOptionalObject(session)
        // get stable id for args
        var stableId = dbQueryStableId({
            moduleCallSignature: session.moduleCallSignature,
            options: options,
            params: params,
            query: query,
            requestId: session.requestId,
            stack: session.stack,
        })
        // get mock data for db query
        var dbQueryMock = immutableAutomock.dbQueryMocks[stableId]
        var dbResponseMock = dbQueryMock && immutableAutomock.dbResponseMocks[dbQueryMock.dbQueryId]
        // both query and response mock data exist
        if (dbQueryMock && dbResponseMock) {
            // mock data is a successful query
            if (dbResponseMock.dbResponseSuccess) {
                // clone mock data before returning to prevent mock pollution
                var res = _.cloneDeep(dbResponseMock.data)
                // add info to res
                res.info = _.cloneDeep(dbResponseMock.info)
                // resolve with mock data
                return Promise.resolve(res)
            }
            // mock data is a query error
            else {
                // build mock error object
                var err = new Error(dbResponseMock.data.message)
                err.code = dbResponseMock.data.code
                err.isOperational = dbResponseMock.data.isOperational
                // reject with mock error object
                return Promise.reject(err)
            }
        }
        // if requireAutomock flag is set on session throw error
        else if (session.requireAutomock) {
            // create new error object
            var error = new Error('missing automock for query: '+query)
            // add call data to error
            error.automockCallData = {
                moduleCallId: session.moduleCallId,
                options: options,
                params: params,
                query: query,
                requestId: session.requestId,
            }
            error.automockStableId = stableId
            // throw error
            throw error
        }
        // do original query
        else {
            return queryFunction.apply(this, arguments)
        }
    }
}

/**
 * @function dbQueryStableId
 *
 * generate a stable id for db query data
 *
 * @param {object} data
 *
 * @returns {string}
 *
 * @throws {Error}
 */
function dbQueryStableId (data) {
    // require data to be object
    data = requireValidOptionalObject(data)
    // build object with only the deterministic properties of db query
    var stableData = _.pick(data, ['moduleCallSignature', 'options', 'params', 'query', 'requestId', 'stack'])
    // generate 128bit hex id of stable stringified data
    var stableIdWithData = stableId(stableData, true)
    // reture id string
    return stableIdWithData.id
}

/**
 * @function loadMock
 *
 * load mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMock (mockData, options) {
    // get load mock function by type
    loadMockFunctions[mockData.type](mockData, options)
}

/**
 * @function loadMockDbQuery
 *
 * load dbQuery mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMockDbQuery (mockData, options) {
    // get stable id for http request data with non-deterministic properites removed
    try {
        var stableId = dbQueryStableId(mockData.data)
    }
    // catch errors if ignore option is set
    catch (ex) {
        if (options.ignoreInvalidMockData) {
            return
        }
        else {
            throw new Error('automock error: invalid mock data')
        }
    }
    // store moduleCall data keyed by stable id
    immutableAutomock.dbQueryMocks[stableId] = mockData.data
}

/**
 * @function loadMockDbResponse
 *
 * load dbResponse mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMockDbResponse (mockData, options) {
    immutableAutomock.dbResponseMocks[mockData.data.dbQueryId] = mockData.data
}

/**
 * @function reset
 *
 * clear mock data and remove automock from libraries
 */
function reset () {
    // reset global data stores
    immutableAutomock.dbQueryMocks = {}
    immutableAutomock.dbResponseMocks = {}
}