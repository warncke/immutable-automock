'use strict'

/* npm modules */
const Promise = require('bluebird')
const _ = require('lodash')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const stableId = require('stable-id')

/* exports */
module.exports = {
    // name of npm library that this module applies to
    libraryName: 'immutable-core',
    // public functions
    automock: automock,
    loadMock: loadMock,
    moduleCallStableId: moduleCallStableId,
    reset: reset,
}

// load mock functions for different mock data types
const loadMockFunctions = {
    moduleCall: loadMockModuleCall,
    moduleCallResolve: loadMockModuleCallResolve,
}

// global store of module call mocks keyed by hash of args
var moduleCallMocks = {}
// global store of module call resolve mocks keyed by moduleCallId
var moduleCallResolveMocks = {} 

/**
 * @function automock
 *
 * @param {function} method
 */
function automock (method) {
    // require function
    if (typeof method !== 'function') {
        throw new Error('automock error: automock must be called with function')
    }
    // create automock wrapper function
    var automockWrapper = function coreAutomockWrapper (args) {
        // require args to be object
        args = requireValidOptionalObject(args)
        // if the automock flag is set to false then call original method but
        // delete the automock flag from the session so that all subsequent
        // calls will be mocked
        if (args && args.session && args.session.automock === false) {
            // delete automock flag
            delete args.session.automock
            // call original method
            return method.apply(this, arguments)
        }
        // get stable id for args
        var stableId = moduleCallStableId({
            args: args,
            methodName: method.meta.methodName,
            moduleName: method.meta.moduleName,
        })
        // get mock data for moduleCall
        var moduleCallMock = moduleCallMocks[stableId]
        var moduleCallResolveMock = moduleCallMock && moduleCallResolveMocks[moduleCallMock.moduleCallId]
        // return mock data if moduleCall and ModuleCallResolve mocks exist
        if (moduleCallMock && moduleCallResolveMock) {
            // either resolve or reject - clone data to prevent mock pollution
            return moduleCallResolveMock.resolved
                ? Promise.resolve(_.cloneDeep(moduleCallResolveMock.moduleCallResolveData))
                : Promise.reject(_.cloneDeep(moduleCallResolveMock.moduleCallResolveData))
        }
        // if requireAutomock flag is set on session throw error
        else if (args && args.session && args.session.requireAutomock) {
            // create new error object
            var error = new Error('missing automock for method: '+method.meta.methodName+'.'+method.meta.moduleName)
            // add call data to error
            error.automockCallData = {
                args: args,
                methodName: method.meta.methodName,
                moduleName: method.meta.moduleName,
            }
            error.automockStableId = stableId
            // throw error
            throw error
        }
        // call original method with args
        return method.apply(this, arguments)
    }
    // set method meta data on wrapper
    automockWrapper.meta = method.meta
    // return wrapper
    return automockWrapper
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
 * @function loadMockModuleCall
 *
 * load moduleCall mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMockModuleCall (mockData, options) {
    // convert old data schema to new
    if (mockData.data && mockData.data.functionName) {
        mockData.data.methodName = mockData.data.functionName
        delete mockData.data.functionName
    }
    // get stable id for module call data with non-deterministic properites removed
    try {
        var stableId = moduleCallStableId(mockData.data)
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
    moduleCallMocks[stableId] = mockData.data
}

/**
 * @function loadMockModuleCallResolve
 *
 * load moduleCallResolve mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMockModuleCallResolve (mockData, options) {
    // store moduleCallResolve data keyed by moduleCallId
    moduleCallResolveMocks[mockData.data.moduleCallId] = mockData.data
}

/**
 * @function moduleCallStableId
 *
 * generate a stable id for module call data
 *
 * @param {object} data
 *
 * @returns {string}
 *
 * @throws {Error}
 */
function moduleCallStableId (data) {
    // require data to be object
    data = requireValidOptionalObject(data)
    // require args to be object
    data.args = requireValidOptionalObject(data.args)
    // require session to be object
    data.args.session = requireValidOptionalObject(data.args.session)
    // require stack to be array
    data.args.session.stack = requireValidOptionalArray(data.args.session.stack)
    // build object with only the deterministic properties of module call data
    var stableData = _.pick(data, ['methodName', 'moduleName'])
    // get all args except for the session
    stableData.args = _.omit(data.args, 'session')
    // get only the deterministic properties of session
    stableData.args.session = _.pick(data.args.session, ['requestId', 'sessionId', 'stack'])
    // generate 128bit hex id of stable stringified data
    var stableIdWithData = stableId(stableData, true)
    // reture id string
    return stableIdWithData.id
}

/**
 * @function requireValidOptionalArray
 *
 * throw error if arg is not an array, default to empty array on undefined
 *
 * @param {array|undefined} arg
 *
 * @returns {array}
 *
 * @throws {Error}
 */
function requireValidOptionalArray (arg) {
    // default to empty array
    if (arg === undefined) {
        return []
    }
    // throw error if arg is not array
    if (!Array.isArray(arg)) {
        throw new Error('argument error: argument must be an array')
    }
    // return array
    return arg
}

/**
 * @function reset
 *
 * clear mock data and remove automock from libraries
 */
function reset () {
    // reset global data stores
    moduleCallMocks = {}
    moduleCallResolveMocks = {}
}