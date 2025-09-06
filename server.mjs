import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';

const wss = new WebSocketServer({ port: 8787, path: '/ws' });
const queue = [];

function say(ws, obj) {
  try { ws.send(JSON.stringify(obj)); } catch {}
}
function pair(a, b) {
  const aid = nanoid(6), bid = nanoid(6);
  a.partner = b; b.partner = a;
  say(a, { type: 'paired', peerId: bid });
  say(b, { type: 'paired', peerId: aid });
}

wss.on('connection', (ws) => {
  ws.on('message', (buf) => {
    let data = {};
    try { data = JSON.parse(buf.toString()); } catch {}
    if (data.type === 'find') {
      if (queue.length) {
        const other = queue.shift();
        pair(ws, other);
      } else queue.push(ws);
    }
    if (data.type === 'msg' && ws.partner) say(ws.partner, { type: 'msg', text: data.text });
    if (data.type === 'typing' && ws.partner) say(ws.partner, { type: 'typing', on: !!data.on });
  });
  ws.on('close', () => {
    const idx = queue.indexOf(ws);
    if (idx >= 0) queue.splice(idx, 1);
    if (ws.partner) say(ws.partner, { type: 'left' });
  });
});

console.log("MyVent Server läuft auf ws://localhost:8787/ws");
