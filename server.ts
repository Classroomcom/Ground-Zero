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
      players: Array.from(players.values()) 
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
