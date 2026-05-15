import express from "express";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const server = createHttpServer(app);
  
  // 3. Sistema Multijugador (WebSockets) - Arquitectura Backend
  const io = new Server(server, { cors: { origin: "*" } });
  const PORT = 3000;

  // Estado simple en memoria para los jugadores
  const players = new Map();

  // Battle Royale Zone State
  let zone = { center: [0, 0], radius: 150 };
  let zoneTarget = { center: [10, -10], radius: 30 };
  
  const objectives = [
    { id: 'obj1', type: 'SUPPLY_DROP', position: [20, 0, 30], name: 'Drop Alpha' },
    { id: 'obj2', type: 'BOMB_SITE', position: [-40, 0, -20], name: 'Site B' },
    { id: 'obj3', type: 'EXTRACTION', position: [0, 0, -50], name: 'Heliport' }
  ];

  // Periodic Zone Shrink (Mocking BR mechanics)
  setInterval(() => {
    if (zone.radius > zoneTarget.radius) {
      zone.radius -= 0.5;
      zone.center[0] += (zoneTarget.center[0] - zone.center[0]) * 0.01;
      zone.center[1] += (zoneTarget.center[1] - zone.center[1]) * 0.01;
      io.emit("zone_update", zone);
    }
  }, 1000);

  io.on("connection", (socket) => {
    console.log("🎮 Player connected:", socket.id);
    
    // Inicializar jugador
    players.set(socket.id, {
      id: socket.id,
      position: [0, 5, 0],
      rotation: [0, 0, 0],
      health: 100
    });

    // Enviar configuración inicial al cliente
    socket.emit("init", { 
      id: socket.id, 
      players: Array.from(players.values()),
      zone,
      objectives
    });

    // Notificar a otros
    socket.broadcast.emit("player_join", players.get(socket.id));

    // Sincronización de posición y rotación
    socket.on("move", (data) => {
      const player = players.get(socket.id);
      if (player) {
        player.position = data.position;
        player.rotation = data.rotation;
        // Se emite en broadcast (a todos menos al remitente) a 15-30 ticks por segundo para optimización en prod
        socket.broadcast.emit("player_move", { id: socket.id, ...data });
      }
    });

    // Lógica de combate (Eventos)
    socket.on("shoot", (data) => {
      // En un entorno de producción seguro, el servidor validaría el Raycast (Server-Authoritative)
      socket.broadcast.emit("player_shoot", { id: socket.id, ...data });
    });

    socket.on("hit", (data) => {
      const target = players.get(data.targetId);
      if (target) {
        target.health -= data.damage;
        io.emit("player_health", { id: target.id, health: target.health });
      }
    });

    socket.on("disconnect", () => {
      console.log("👋 Player disconnected:", socket.id);
      players.delete(socket.id);
      io.emit("player_leave", { id: socket.id });
    });
  });

  app.get('/api/auth/github/url', (req, res) => {
    // Determine dynamically from origin context headers or default to hardcoded. Actually we use what oauth skill says, `window.location.origin` inside UI to get URL then pass it here, or just let client pass callback URL.
    const redirectUri = req.query.redirectUri as string;
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: redirectUri,
      scope: 'user:email',
    });
    const authUrl = `https://github.com/login/oauth/authorize?${params}`;
    res.json({ url: authUrl });
  });

  app.get(['/auth/github/callback', '/auth/github/callback/'], async (req, res) => {
    const { code } = req.query;
    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      
      if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          // Send success message to parent window and close popup
          res.send(`
            <html>
              <body>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${tokenData.access_token}' }, '*');
                    window.close();
                  } else {
                    window.location.href = '/';
                  }
                </script>
                <p>Authentication successful. This window should close automatically.</p>
              </body>
            </html>
          `);
          return;
      }
    } catch(e) { 
        console.error("Github Auth Error", e);
    }
  
    res.send(`<html><body><p>Authentication Failed</p></body></html>`);
  });

  // Vite Middleware para Development (o archivos estáticos en Prod)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Battle Royale Server running on port ${PORT}`);
  });
}

startServer();
