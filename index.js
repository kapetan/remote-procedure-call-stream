var util = require('util')
var lpStream = require('length-prefixed-stream')
var Duplexify = require('duplexify')

var slice = Array.prototype.slice
var noop = function () {}

var serializeError = function (err) {
  if (!(err instanceof Error)) return ['object', err]
  return ['error', {
    name: err.name,
    message: err.message,
    stack: err.stack
  }]
}

var parseError = function (error) {
  var obj = error[1]

  if (error[0] === 'error') {
    var err = new Error(obj.message)
    err.name = obj.name
    err.stack = obj.stack
    return err
  }

  return obj
}

var Protocol = function () {
  Duplexify.call(this)

  var self = this
  var decode = lpStream.decode()
  var encode = lpStream.encode()

  decode.on('data', function (data) {
    try {
      data = JSON.parse(data.toString('utf-8'))
    } catch (err) {
      return self.destroy(err)
    }

    self.emit('message', data)
  })

  this.setWritable(decode)
  this.setReadable(encode)

  this._encode = encode
}

util.inherits(Protocol, Duplexify)

var Client = function () {
  if (!(this instanceof Client)) return new Client()
  Protocol.call(this)

  this._id = 0
  this._cbs = Object.create(null)

  var self = this

  var onclose = function () {
    Object.keys(self._cbs).forEach(function (key) {
      self._cbs[key](new Error('premature close'))
      delete self._cbs[key]
    })
  }

  this.on('close', onclose)
  this.on('finish', onclose)
  this.on('end', onclose)

  this.on('message', function (data) {
    var valid = Array.isArray(data) &&
      data.length === 2 &&
      Array.isArray(data[0]) &&
      (typeof data[1] === 'number' || typeof data[1] === 'string')

    if (!valid) return self.destroy(new Error('invalid response'))
    if (typeof data[1] === 'string') return this.emit('notify', data[1], data[0])

    var ret = data[0]
    var id = data[1]
    var error = ret[0]
    var cb = self._cbs[id]
    delete self._cbs[id]

    var validError = error == null || (
      Array.isArray(error) &&
      error.length === 2 &&
      (typeof error[0] === 'string'))

    if (!validError) return self.destroy(new Error('invalid response'))
    if (!cb) return self.destroy(new Error('invalid callback id'))

    if (error) ret[0] = parseError(error)
    cb.apply(null, ret)
  })
}

util.inherits(Client, Protocol)

Client.prototype.invoke = function (name, args, cb) {
  if (!cb && typeof args === 'function') {
    cb = args
    args = null
  }

  if (!args) args = []

  var request = [name, args]

  if (cb) {
    var id = this._id++
    request.push(id)
    this._cbs[id] = cb
  }

  this._encode.write(JSON.stringify(request))
}

var Server = function (handler) {
  if (!(this instanceof Server)) return new Server(handler)
  Protocol.call(this)

  var self = this

  this.on('message', function (data) {
    var valid = Array.isArray(data) &&
      (typeof data[0] === 'string') &&
      Array.isArray(data[1]) &&
      (data.length === 2 || (data.length === 3 && (typeof data[2] === 'number')))

    if (!valid) return self.destroy(new Error('invalid request'))

    var name = data[0]
    var args = data[1]
    var id = data[2]

    var respond = function (err) {
      var ret = slice.call(arguments)
      if (err) ret[0] = serializeError(err)
      var response = [ret, id]
      self._encode.write(JSON.stringify(response))
    }

    handler(name, args, data.length === 3 ? respond : noop)
  })
}

util.inherits(Server, Protocol)

Server.prototype.notify = function (name, args) {
  this._encode.write(JSON.stringify([args, name]))
}

exports.client = Client
exports.server = Server
