'use strict'

const assert = require('chai').assert
const dbQueryStableId = require('../lib/automock/db-client').dbQueryStableId

describe('immutable-automock: db query stable id', function () {

    it('should generate a 128bit hex id', function () {
        assert.match(dbQueryStableId({}), /^[0-9A-Z]{32}$/)
    })

    it('should generate different ids for queries with different query strings', function () {
        var dbQueryData1 = {
            query: 'FOO',
        }
        var dbQueryData2 = {
            query: 'BAR',
        }
        assert.notStrictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate different ids for queries with the same query strings and different options', function () {
        var dbQueryData1 = {
            options: {
                foo: true,
            },
            query: 'FOO',
        }
        var dbQueryData2 = {
            options: {
                foo: false,
            },
            query: 'FOO',
        }
        assert.notStrictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate different ids for queries with the same query strings and different params', function () {
        var dbQueryData1 = {
            params: {
                foo: true,
            },
            query: 'FOO',
        }
        var dbQueryData2 = {
            params: {
                foo: false,
            },
            query: 'FOO',
        }
        assert.notStrictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate different ids for queries with the same query strings and different requestIds', function () {
        var dbQueryData1 = {
            query: 'FOO',
            requestId: 'FOO',
        }
        var dbQueryData2 = {
            query: 'FOO',
            requestId: 'BAR',
        }
        assert.notStrictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate different ids for queries with the same query strings and different moduleCallSignatures', function () {
        var dbQueryData1 = {
            query: 'FOO',
            moduleCallSignature: 'FOO.bar',
        }
        var dbQueryData2 = {
            query: 'FOO',
            moduleCallSignature: 'BAR.bar',
        }
        assert.notStrictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate different ids for queries with the same query strings and moduleCallSignatures but different stacks', function () {
        var dbQueryData1 = {
            query: 'FOO',
            moduleCallSignature: 'FOO.bar',
            stack: ['foo'],
        }
        var dbQueryData2 = {
            query: 'FOO',
            moduleCallSignature: 'FOO.bar',
            stack: ['bar'],
        }
        assert.notStrictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })


    it('should generate the same id for queries with the same query strings and different moduleCallIds', function () {
        var dbQueryData1 = {
            moduleCallId: 'FOO',
            query: 'FOO',
        }
        var dbQueryData2 = {
            moduleCallId: 'BAR',
            query: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings', function () {
        var dbQueryData1 = {
            query: 'FOO',
        }
        var dbQueryData2 = {
            query: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings and the same moduleCallIds', function () {
        var dbQueryData1 = {
            moduleCallId: 'FOO',
            query: 'FOO',
        }
        var dbQueryData2 = {
            moduleCallId: 'FOO',
            query: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings and the same options', function () {
        var dbQueryData1 = {
            options: {
                foo: true,
            },
            query: 'FOO',
        }
        var dbQueryData2 = {
            options: {
                foo: true,
            },
            query: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings and the same params', function () {
        var dbQueryData1 = {
            params: {
                foo: true,
            },
            query: 'FOO',
        }
        var dbQueryData2 = {
            params: {
                foo: true,
            },
            query: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings and the same requestIds', function () {
        var dbQueryData1 = {
            query: 'FOO',
            requestId: 'FOO',
        }
        var dbQueryData2 = {
            query: 'FOO',
            requestId: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings and different connectionIds', function () {
        var dbQueryData1 = {
            connectionId: 'FOO',
            query: 'FOO',
        }
        var dbQueryData2 = {
            connectionId: 'BAR',
            query: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings and different dbQueryCreateTimes', function () {
        var dbQueryData1 = {
            dbQueryCreateTime: 'FOO',
            query: 'FOO',
        }
        var dbQueryData2 = {
            dbQueryCreateTime: 'BAR',
            query: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings and different dbQueryIds', function () {
        var dbQueryData1 = {
            dbQueryId: 'FOO',
            query: 'FOO',
        }
        var dbQueryData2 = {
            dbQueryId: 'BAR',
            query: 'FOO',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings and moduleCallSignatures', function () {
        var dbQueryData1 = {
            query: 'FOO',
            moduleCallSignature: 'FOO.bar',
        }
        var dbQueryData2 = {
            query: 'FOO',
            moduleCallSignature: 'FOO.bar',
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

    it('should generate the same id for queries with the same query strings. moduleCallSignatures, and stacks', function () {
        var dbQueryData1 = {
            query: 'FOO',
            moduleCallSignature: 'FOO.bar',
            stack: ['foo'],
        }
        var dbQueryData2 = {
            query: 'FOO',
            moduleCallSignature: 'FOO.bar',
            stack: ['foo'],
        }
        assert.strictEqual(dbQueryStableId(dbQueryData1), dbQueryStableId(dbQueryData2))
    })

})