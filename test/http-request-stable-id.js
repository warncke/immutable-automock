'use strict'

const assert = require('chai').assert
const httpRequestStableId = require('../lib/automock/http-client').httpRequestStableId

describe('immutable-automock: http request stable id', function () {

    it('should generate a 128bit hex id', function () {
        assert.match(httpRequestStableId({}), /^[0-9a-z]{32}$/)
    })

    it('should generate same id for requests with same options', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
        }
        var httpRequestData2 = {
            options: {
                foo: true,
            },
        }
        assert.strictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

    it('should generate same id for requests with same options and same requestId', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
            requestId: 'foo',
        }
        var httpRequestData2 = {
            options: {
                foo: true,
            },
            requestId: 'foo',
        }
        assert.strictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

    it('should generate same id for requests with same options and same moduleCallId', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
            moduleCallId: 'foo',
        }
        var httpRequestData2 = {
            options: {
                foo: true,
            },
            moduleCallId: 'foo',
        }
        assert.strictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

    it('should generate same id for requests with same options and different moduleCallId', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
            moduleCallId: 'foo',
            requestId: 'foo',
        }
        var httpRequestData2 = {
            options: {
                foo: true,
            },
            moduleCallId: 'bar',
            requestId: 'foo',
        }
        assert.strictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

    it('should generate same id for requests with same options, moduleCallSignature, and stack', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
            moduleCallSignature: 'Foo.foo',
            requestId: 'foo',
            stack: ['foo'],
        }
        var httpRequestData2 = {
            options: {
                foo: true,
            },
            moduleCallSignature: 'Foo.foo',
            requestId: 'foo',
            stack: ['foo'],
        }
        assert.strictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

    it('should generate different ids for requests with same options and different requestId', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
            moduleCallId: 'foo',
            requestId: 'foo',
        }
        var httpRequestData2 = {
            options: {
                foo: true,
            },
            moduleCallId: 'foo',
            requestId: 'bar',
        }
        assert.notStrictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

    it('should generate different ids for requests with same options and different moduleCallSignature', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
            moduleCallSignature: 'Foo.foo',
            requestId: 'foo',
        }
        var httpRequestData2 = {
            options: {
                foo: true,
            },
            moduleCallSignature: 'Foo.bar',
            requestId: 'foo',
        }
        assert.notStrictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

    it('should generate different ids for requests with same options and moduleCallSignature but different stack', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
            moduleCallSignature: 'Foo.foo',
            requestId: 'foo',
            stack: ['foo'],
        }
        var httpRequestData2 = {
            options: {
                foo: true,
            },
            moduleCallSignature: 'Foo.foo',
            requestId: 'foo',
            stack: ['bar'],
        }
        assert.notStrictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

    it('should generate different ids for requests with different options', function () {
        var httpRequestData1 = {
            options: {
                foo: true,
            },
            moduleCallId: 'foo',
            requestId: 'foo',
        }
        var httpRequestData2 = {
            options: {
                foo: false,
            },
            moduleCallId: 'foo',
            requestId: 'foo',
        }
        assert.notStrictEqual(httpRequestStableId(httpRequestData1), httpRequestStableId(httpRequestData2))
    })

})