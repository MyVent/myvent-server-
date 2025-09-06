const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket Server läuft auf Port ${PORT}`);

function findPartner(ws) {
  // Hier implementierst du die Logik, um zwei Nutzer zu verbinden
  // Zum Beispiel zufälliger freier Partner
}

function broadcastLiveUsers() {
  const msg = JSON.stringify({
    type: "live_users",
    count: wss.clients.size
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', ws => {
  console.log('Neuer Nutzer verbunden!');
  
  broadcastLiveUsers(); // optional, falls du Live Users nutzen willst

  ws.on('message', message => {
    const data = JSON.parse(message);

    if (data.type === 'msg') {
      const partner = findPartner(ws);
      if (partner && partner.readyState === WebSocket.OPEN) {
        partner.send(JSON.stringify({
          type: 'msg',
          text: data.text,
          nickname: data.nickname
        }));
      }
    }
  });

  ws.on('close', () => {
    console.log('Nutzer getrennt!');
    broadcastLiveUsers(); // optional
  });
});
