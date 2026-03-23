# WebSockets

> Bifröst integrates Socket.io. Enable it with a single option.

---

## Contents

- [Enabling WebSockets](#enabling-websockets)
- [Handling events](#handling-events)
- [Rooms and namespaces](#rooms-and-namespaces)
- [Accessing io from controllers](#accessing-io-from-controllers)
- [Advanced Socket.io options](#advanced-socketio-options)
- [Graceful shutdown](#graceful-shutdown)

---

## Enabling WebSockets

```js
const { io } = await app.startup({
    port:   3000,
    socket: true,   // enables Socket.io
});
```

`io` is a Socket.io `Server` instance. If `socket: false`, `io` is `null`.

The default configuration forces the WebSocket transport and allows all origins:

```js
// defaults applied internally:
{
    cors:       { origin: '*' },
    transports: ['websocket'],
}
```

---

## Handling events

```js
io.on('connection', ($socket) => {
    console.log('Client connected:', $socket.id);

    $socket.on('chat:message', ($data) => {
        // Validate input before processing
        if (typeof $data?.text !== 'string') return;
        io.emit('chat:message', { id: $socket.id, text: $data.text });
    });

    $socket.on('disconnect', () => {
        console.log('Client disconnected:', $socket.id);
    });
});
```

---

## Rooms and namespaces

```js
io.on('connection', ($socket) => {
    // Join a room
    $socket.on('room:join', ($roomId) => {
        $socket.join($roomId);
        $socket.to($roomId).emit('room:joined', { id: $socket.id });
    });

    // Broadcast to room
    $socket.on('room:message', ({ roomId, text }) => {
        io.to(roomId).emit('room:message', { from: $socket.id, text });
    });
});

// Namespaces
const adminNs = io.of('/admin');
adminNs.on('connection', ($socket) => {
    // only admin clients
});
```

---

## Accessing io from controllers

The `BifrostApp` instance exposes `app.io`:

```js
export default class NotifyController extends BBController {
    static path    = '/api/notify';
    static methods = ['post'];

    async post() {
        const { message } = this.body;
        // Broadcast to all connected clients
        this.app.io.emit('notification', { message });
        this.json({ sent: true });
    }
}
```

---

## Advanced Socket.io options

Pass custom options as the second argument to override the defaults:

```js
// Using BifrostApp:
await app.startup({ socket: true });

// Or using Bifrost directly:
const io = await bifrost.attachSockets({
    cors: {
        origin:  'https://my-domain.com',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout:  10000,
    pingInterval: 5000,
});
```

All Socket.io `ServerOptions` are accepted.

---

## Graceful shutdown

```js
import process from 'node:process';

process.on('SIGTERM', async () => {
    await bifrost.extinguish();  // closes HTTP server and Socket.io
    process.exit(0);
});
```

`extinguish()` closes the HTTP server, disconnects all sockets, and sets `io` to `null`.
