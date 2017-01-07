'use strict'

/* npm modules */
const Promise = require('bluebird')
const _ = require('lodash')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const stableId = require('stable-id')

/* exports */
module.exports = {
    // name of npm library that this module applies to
    libraryName: 'immutable-http-client',
    // public functions
    automock: automock,
    httpRequestStableId: httpRequestStableId,
    loadMock: loadMock,
    reset: reset,
}

// load mock functions for different mock data types
const loadMockFunctions = {
    httpRequest: loadMockHttpRequest,
    httpRequestError: loadMockHttpRequestError,
    httpResponse: loadMockHttpResponse,
}

// global stores for mocks - reset empties these
var httpRequestMocks = {}
var httpRequestErrorMocks = {}
var httpResponseMocks = {}

/**
 * @function automock
 *
 * @param {object} httpClient
 */
function automock (httpClient) {
    // require function
    if (typeof httpClient.request !== 'function') {
        throw new Error('automock error: http-client must have request method')
    }
    // return automock function
    return function httpClientAutomockWrapper (options, session) {
        // require options and session to be objects
        options = requireValidOptionalObject(options)
        session = requireValidOptionalObject(session)
        // get stable id for args
        var stableId = httpRequestStableId({
            moduleCallId: session.moduleCallId,
            options: options,
            requestId: session.requestId,
        })
        // get mock data for http request
        var httpRequestMock = httpRequestMocks[stableId]
        var httpRequestErrorMock = httpRequestMock && httpRequestErrorMocks[httpRequestMock.httpRequestId]
        var httpResponseMock = httpRequestMock && httpResponseMocks[httpRequestMock.httpRequestId]
        // return mock data for success if it exists - clone objects to prevent mock pollution
        if (httpRequestMock && httpResponseMock) {
            return Promise.resolve({
                body: httpResponseMock.httpResponseBody,
                rawHeaders: _.cloneDeep(httpResponseMock.httpResponseHeader),
                statusCode: httpResponseMock.httpResponseStatusCode,
            })
        }
        // return mock data for error if it exists
        else if (httpRequestMock && httpRequestErrorMock) {
            return Promise.reject(new Error(httpRequestErrorMock.httpRequestError))
        }
        // if requireAutomock flag is set on session throw error
        else if (session.requireAutomock) {
            // create new error object
            var error = new Error('missing automock for http: '+options.method+' '+options.uri)
            // add call data to error
            error.automockCallData = {
                moduleCallId: session.moduleCallId,
                options: options,
                requestId: session.requestId,
            }
            error.automockStableId = stableId
            // throw error
            throw error
        }
        // do original http request
        else {
            // shallow clone session to set automock flag in this scope only
            session = _.clone(session)
            // set automock flag to false so that regular request will be done
            session.automock = false
            // call original method
            return httpClient.request.apply(this, [options, session])
        }
    }
}

/**
 * @function httpRequestStableId
 *
 * generate a stable id for http request data
 *
 * @param {object} data
 *
 * @returns {string}
 *
 * @throws {Error}
 */
function httpRequestStableId (data) {
    // require data to be object
    data = requireValidOptionalObject(data)
    // build object with only the deterministic properties of module call data
    var stableData = _.pick(data, ['options', 'moduleCallId', 'requestId'])
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
 * @function loadMockHttpRequest
 *
 * load httpRequest mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMockHttpRequest (mockData, options) {
    // get stable id for http request data with non-deterministic properites removed
    try {
        var stableId = httpRequestStableId(mockData.data)
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
    httpRequestMocks[stableId] = mockData.data
}

/**
 * @function loadMockHttpRequestError
 *
 * load httpRequestError mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMockHttpRequestError (mockData, options) {
    httpRequestErrorMocks[mockData.data.httpRequestId] = mockData.data
}

/**
 * @function loadMockhttpResponse
 *
 * load httpResponse mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMockHttpResponse (mockData, options) {
    httpResponseMocks[mockData.data.httpRequestId] = mockData.data
}

/**
 * @function reset
 *
 * clear mock data and remove automock from libraries
 */
function reset () {
    // reset global data stores
    httpRequestMocks = {}
    httpRequestErrorMocks = {}
    httpResponseMocks = {}
}