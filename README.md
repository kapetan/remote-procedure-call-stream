# remote-procedure-call-stream

Binary RPC protocol stream.

    npm install remote-procedure-call-stream

## Usage

Client and server example.

```javascript
var rpc = require('remote-procedure-call-stream')

var client = rpc.client()

// Pipe into a duplex stream, e.g. TCP socket
client.pipe(stream).pipe(client)

client.invoke('example', 'hello', function (err, response) {
  console.log(response) // Prints 'world'
})
```

```javascript
var rpc = require('remote-procedure-call-stream')

var server = rcp.server({
  example: function (a, cb) {
    console.log(a) // Prints 'hello'
    cb(null, 'world')
  }
})

server.pipe(stream).pipe(server)
```
