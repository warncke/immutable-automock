'use strict'

/* native modules */
const fs = require('fs')

/* npm modules */
const _ = require('lodash')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')

/* exports */
const automock = {
    loadMock: loadMock,
    loadMockFromFile: loadMockFromFile,
    mock: mock,
    module: {
        core: require('./automock/core'),
        dbClient: require('./automock/db-client'),
        httpClient: require('./automock/http-client'),
    },
    reset: reset,
}

module.exports = automock

// apply automock when first required
mock()

// mapping table of mock data type names to modules
const moduleNameByMockDataType = {
    dbQuery: 'dbClient',
    dbResponse: 'dbClient',
    moduleCall: 'core',
    moduleCallResolve: 'core',
    httpRequest: 'httpClient',
    httpRequestError: 'httpClient',
    httpResponse: 'httpClient',
}

/**
 * @function loadMock
 *
 * load mock data
 *
 * @param {object|array} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMock (mockData, options) {
    // make sure options is object
    options = requireValidOptionalObject(options)
    // load mock data from either array or object
    Array.isArray(mockData)
        // if data is array then load each mock in array
        ? _.each(mockData, mockData => _loadMock(mockData, options))
        // load mock data object
        : _loadMock(mockData, options)
}

/**
 * @function loadMockFromFile
 *
 * load mock data from file
 *
 * @param {string} fileName
 * @param {object} options
 *
 * @throws {Error}
 */
function loadMockFromFile (fileName, options) {
    // make sure options is object
    options = requireValidOptionalObject(options)
    // load data from file
    var fileData = fs.readFileSync(fileName, 'utf8')
    // split lines - each line should be valid JSON object
    var lines = fileData.split('\n')
    // load each line
    _.each(lines, (line, lineNum) => {
        // skip empty lines
        if (line === '') {
            return
        }
        // attempt to parse line
        try {
            var mockData = JSON.parse(line)
        }
        catch (ex) {
            // throw error unless ignore option is set
            if (options.ignoreMockDataErrors) {
                return
            }
            else {
                // get line number starting at 1 instead of 0
                lineNum = parseInt(lineNum) + 1
                // throw error
                throw new Error('immutable-automock: JSON parse error '+ex.message+' '+fileName+':'+lineNum)
            }
        }
        // load mock data
        loadMock(mockData, options)
    })
}

/**
 * @function mock
 *
 * apply automock to all mockable libraries
 *
 * @returns {ImmutableAutomock}
 *
 * @throws {Error}
 */
function mock () {
    // flag set if any library is successfully mocked
    var mocked = false

    // attempt to load mockable libraries
    _.each(automock.module, (module, name) => {
        // catch errors on libraries that are not available
        try {
            // load library to be mocked
            var library = require(module.libraryName)
            // apply automock function on library
            library.automock(module.automock)
            // set success flag
            mocked = true
        }
        catch (ex) {
            console.log(ex)
        }
    })

    // throw error if no libraries found
    if (!mocked) {
        throw new Error('immutable-automock: no mockable libraries found')
    }

    // return class instance for chaining
    return automock
}

/**
 * @function reset
 *
 * clear mock data and remove automock from libraries
 */
function reset () {
    // reset each sub-mobuld
    _.each(automock.module, module => module.reset())
    // return class instance for chaining
    return automock
}

/* private functions */

/**
 * @function _loadMock
 *
 * load mock data
 *
 * @param {object} mockData
 * @param {object} options
 *
 * @throws {Error}
 */
function _loadMock (mockData, options) {
    // require mockData to be object
    if (!mockData || typeof mockData !== 'object' || !mockData.data || typeof mockData.data !== 'object') {
        if (options.ignoreMockDataErrors) {
            return
        }
        else {
            throw new Error('automock error: mock data must be object')
        }
    }
    // require mockData to have type
    if (typeof mockData.type !== 'string') {
        if (options.ignoreMockDataErrors) {
            return
        }
        else {
            throw new Error('automock error: mock data must have type')
        }
    }
    // get automock module name by mock data type
    var moduleName = moduleNameByMockDataType[mockData.type]
    // require type to be defined with module name
    if (!moduleName) {
        if (options.ignoreInvalidMockDataType) {
            return
        }
        else {
            throw new Error('automock error: invalid mock data type - '+mockData.type)
        }
    }
    // load mock into target module
    automock.module[moduleName].loadMock(mockData, options)
}