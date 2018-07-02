# remote-procedure-call-stream

Binary RPC protocol stream.

    npm install remote-procedure-call-stream

## Usage

Client and server example.

The `invoke` methods takes three arguments, the remote method name, an array of arguments and an optional callback which is called with the return value from the server. If the callback is omitted the server will not send a response, this can be used for fire-and-forget type events.

```javascript
var rpc = require('remote-procedure-call-stream')

var client = rpc.client()

// Pipe into a duplex stream, e.g. TCP socket
client.pipe(stream).pipe(client)

client.invoke('example', ['hello'], function (err, response) {
  console.log(response) // Prints 'world'
})
```

The server constructor accepts a handler function, it's always called with all three arguments, but the callback has no effect if the client didn't provide a callback function.

If the first argument passed to the callback function is an error instance the client will receive a corresponding instance.

```javascript
var rpc = require('remote-procedure-call-stream')

var server = rpc.server(function (name, args, cb) {
  console.log(name) // Prints 'example'
  console.log(args) // Prints ['hello']
  cb(null, 'world')
})

server.pipe(stream).pipe(server)
```

### Remote events

If you want the server to send data to the client without the client calling a function with a callback, you can
use remote events. You can emit them like this from the server.

```javascript
server.emitRemoteEvent({some: 'data'})
```

and then catch them like this on the client.


```javascript
client.on('remote-event', function(data) {
  console.log(data) // {some: 'data'}
})
```
