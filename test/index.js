var test = require('tape')

var rpc = require('../')

test('simple call', function (t) {
  t.plan(2)

  var client = rpc.client()
  var server = rpc.server({
    test: function (cb) {
      t.ok(typeof cb === 'function')
      cb()
    }
  })

  client.pipe(server).pipe(client)

  client.invoke('test', function () {
    t.equals(arguments.length, 0)
  })
})

test('call with arguments', function (t) {
  t.plan(4)

  var client = rpc.client()
  var server = rpc.server({
    test: function (a, cb) {
      t.equals(a, 'test-arg')
      t.ok(typeof cb === 'function')
      cb(null, 'test-res')
    }
  })

  client.pipe(server).pipe(client)

  client.invoke('test', 'test-arg', function (err, result) {
    t.notOk(err, 'no error')
    t.equals(result, 'test-res')
  })
})

test('respond with error', function (t) {
  t.plan(2)

  var client = rpc.client()
  var server = rpc.server({
    test: function (cb) {
      cb(new Error('failed'))
    }
  })

  client.pipe(server).pipe(client)

  client.invoke('test', function (err) {
    t.ok(err instanceof Error, 'should be error')
    t.equals(err.message, 'failed')
  })
})

test('multiple different calls', function (t) {
  t.plan(6)

  var client = rpc.client()
  var server = rpc.server({
    test1: function (a, cb) {
      t.equals(a, 'test-arg-1')
      cb(null, 'test-res-1')
    },
    test2: function (a, cb) {
      t.equals(a, 'test-arg-2')
      cb(null, 'test-res-2')
    }
  })

  client.pipe(server).pipe(client)

  client.invoke('test1', 'test-arg-1', function (err, result) {
    t.notOk(err, 'no error')
    t.equals(result, 'test-res-1')
  })

  client.invoke('test2', 'test-arg-2', function (err, result) {
    t.notOk(err, 'no error')
    t.equals(result, 'test-res-2')
  })
})

test('invalid function call', function (t) {
  t.plan(1)

  var client = rpc.client()
  var server = rpc.server({
    test: function (cb) {
      t.fail('should not call')
    }
  })

  server.on('error', function (err) {
    t.equals(err.message, 'invalid function name')
  })

  client.pipe(server).pipe(client)

  client.invoke('example', function () {
    t.fail('should not  call')
  })
})
