const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket Server läuft auf Port ${PORT}`);

// Warteschlange und Paarungen
const waiting = [];
const pairs = new Map();

wss.on('connection', ws => {
  console.log('Neuer Nutzer verbunden!');

  ws.on('message', message => {
    const data = JSON.parse(message);

    if (data.type === 'find') {
      ws.nickname = data.nickname || 'Anon';

      if (waiting.length > 0) {
        const partner = waiting.shift();
        pairs.set(ws, partner);
        pairs.set(partner, ws);

        ws.send(JSON.stringify({ type: 'paired' }));
        partner.send(JSON.stringify({ type: 'paired' }));
      } else {
        waiting.push(ws);
        ws.send(JSON.stringify({ type: 'sys', text: 'Suche Partner…' }));
      }
    }

    if (data.type === 'msg') {
      const partner = pairs.get(ws);
      if (partner && partner.readyState === WebSocket.OPEN) {
        partner.send(JSON.stringify({
          type: 'msg',
          text: data.text,
          nickname: ws.nickname
        }));
      }
    }

    if (data.type === 'typing') {
      const partner = pairs.get(ws);
      if (partner && partner.readyState === WebSocket.OPEN) {
        partner.send(JSON.stringify({
          type: 'typing',
          on: data.on
        }));
      }
    }
  });

  ws.on('close', () => {
    const partner = pairs.get(ws);
    if (partner && partner.readyState === WebSocket.OPEN) {
      partner.send(JSON.stringify({ type: 'left' }));
      pairs.delete(partner);
    }

    pairs.delete(ws);

    const index = waiting.indexOf(ws);
    if (index !== -1) waiting.splice(index, 1);

    console.log('Nutzer getrennt!');
  });
});
