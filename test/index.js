var test = require('tape')

var rpc = require('../')

test('simple call', function (t) {
  t.plan(2)

  var client = rpc.client()
  var server = rpc.server(function (name, args, cb) {
    t.equals(name, 'test')
    cb()
  })

  client.pipe(server).pipe(client)

  client.invoke('test', function () {
    t.equals(arguments.length, 0)
  })
})

test('call with arguments', function (t) {
  t.plan(4)

  var client = rpc.client()
  var server = rpc.server(function (name, args, cb) {
    t.equals(name, 'test')
    t.deepEquals(args, ['test-arg'])
    cb(null, 'test-res')
  })

  client.pipe(server).pipe(client)

  client.invoke('test', ['test-arg'], function (err, result) {
    t.notOk(err, 'no error')
    t.equals(result, 'test-res')
  })
})

test('respond with error', function (t) {
  t.plan(3)

  var client = rpc.client()
  var server = rpc.server(function (name, args, cb) {
    t.equals(name, 'test')
    cb(new Error('failed'))
  })

  client.pipe(server).pipe(client)

  client.invoke('test', function (err) {
    t.ok(err instanceof Error, 'should be error')
    t.equals(err.message, 'failed')
  })
})

test('multiple different calls', function (t) {
  t.plan(8)

  var handler = function (name, args, cb) {
    t.equals(name, 'test1')
    t.deepEquals(args, ['test-arg-1'])
    cb(null, 'test-res-1')

    handler = function (name, args, cb) {
      t.equals(name, 'test2')
      t.deepEquals(args, ['test-arg-2'])
      cb(null, 'test-res-2')
    }
  }

  var client = rpc.client()
  var server = rpc.server(function (name, args, cb) {
    handler(name, args, cb)
  })

  client.pipe(server).pipe(client)

  client.invoke('test1', ['test-arg-1'], function (err, result) {
    t.notOk(err, 'no error')
    t.equals(result, 'test-res-1')
  })

  client.invoke('test2', ['test-arg-2'], function (err, result) {
    t.notOk(err, 'no error')
    t.equals(result, 'test-res-2')
  })
})

test('error on close', function (t) {
  t.plan(2)

  var client = rpc.client()
  var server = rpc.server(function () {
    // Hang
  })

  client.pipe(server).pipe(client)

  client.invoke('test', function (err) {
    t.ok(err instanceof Error, 'should be error')
    t.equals(err.message, 'premature close')
  })

  server.destroy()
})
