'use strict'

const assert = require('chai').assert
const moduleCallStableId = require('../lib/automock/core').moduleCallStableId

describe('immutable-automock: module call stable id', function () {

    it('should generate a 128bit hex id', function () {
        assert.match(moduleCallStableId({}), /^[0-9a-z]{32}$/)
    })

    it('should generate different ids for calls with different args', function () {
        var moduleCallData1 = {
            args: {
                foo: true,
            },
        }
        var moduleCallData2 = {
            args: {
                foo: false,
            },
        }
        assert.notStrictEqual(moduleCallStableId(moduleCallData1), moduleCallStableId(moduleCallData2))
    })

    it('should generate the same id for calls with the same args and different call times', function () {
        var moduleCallData1 = {
            args: {
                foo: true,
            },
            moduleCallCreateTime: '2016-11-22 10:28:57.999748',
        }
        var moduleCallData2 = {
            args: {
                foo: true,
            },
            moduleCallCreateTime: '2017-11-22 10:28:57.999748',
        }
        assert.strictEqual(moduleCallStableId(moduleCallData1), moduleCallStableId(moduleCallData2))
    })

    it('should generate the same id for calls with the same args and different moduleCallIds', function () {
        var moduleCallData1 = {
            args: {
                foo: true,
            },
            moduleCallId: 'FOO',
        }
        var moduleCallData2 = {
            args: {
                foo: true,
            },
            moduleCallId: 'BAR',
        }
        assert.strictEqual(moduleCallStableId(moduleCallData1), moduleCallStableId(moduleCallData2))
    })

    it('should generate the same id for calls with the same args and different session args', function () {
        var moduleCallData1 = {
            args: {
                foo: true,
                session: {
                    foo: true,
                },
            },
        }
        var moduleCallData2 = {
            args: {
                foo: true,
                session: {
                    foo: false,
                },
            },
        }
        assert.strictEqual(moduleCallStableId(moduleCallData1), moduleCallStableId(moduleCallData2))
    })

    it('should generate different ids for calls with the same args and different requestIds', function () {
        var moduleCallData1 = {
            args: {
                foo: true,
                session: {
                    requestId: 'FOO',
                },
            },
        }
        var moduleCallData2 = {
            args: {
                foo: true,
                session: {
                    requestId: 'BAR',
                },
            },
        }
        assert.notStrictEqual(moduleCallStableId(moduleCallData1), moduleCallStableId(moduleCallData2))
    })

    it('should generate different ids for calls with the same args and different sessionIds', function () {
        var moduleCallData1 = {
            args: {
                foo: true,
                session: {
                    sessionId: 'FOO',
                },
            },
        }
        var moduleCallData2 = {
            args: {
                foo: true,
                session: {
                    sessionId: 'BAR',
                },
            },
        }
        assert.notStrictEqual(moduleCallStableId(moduleCallData1), moduleCallStableId(moduleCallData2))
    })

    it('should generate different ids for calls with the same args and different stacks', function () {
        var moduleCallData1 = {
            args: {
                foo: true,
                session: {
                    stack: ['foo'],
                },
            },
        }
        var moduleCallData2 = {
            args: {
                foo: true,
                session: {
                    stack: ['bar'],
                },
            },
        }
        assert.notStrictEqual(moduleCallStableId(moduleCallData1), moduleCallStableId(moduleCallData2))
    })

    it('should throw error on invalid args', function () {
        assert.throws(function () {
            moduleCallStableId(null)
        })
        assert.throws(function () {
            moduleCallStableId([])
        })
        assert.throws(function () {
            moduleCallStableId({args: null})
        })
        assert.throws(function () {
            moduleCallStableId({args: []})
        })
        assert.throws(function () {
            moduleCallStableId({args: {session: null}})
        })
        assert.throws(function () {
            moduleCallStableId({args: {session: []}})
        })
        assert.throws(function () {
            moduleCallStableId({args: {session: {stack: null}}})
        })
        assert.throws(function () {
            moduleCallStableId({args: {session: {stack: {}}}})
        })
    })

})