import { io, Socket } from 'socket.io-client';
import { useGameStore } from './store';

// We connect to the current host
// If hosted on GitHub Pages, the backend won't exist locally on that domain, 
// so this will fail gracefully or you can hardcode a production backend URL here.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || undefined;
export const socket: Socket = io(BACKEND_URL);

// 3. Sistema Multijugador - Arquitectura Frontend (WebSockets)
export function initSocket() {
  socket.on('connect', () => {
    useGameStore.getState().addChatMessage({ user: 'System', text: 'Connected to server!' });
  });

  socket.on('init', (data) => {
    if (data.zone) useGameStore.getState().setZone(data.zone.center, data.zone.radius);
    if (data.objectives) useGameStore.getState().setObjectives(data.objectives);
  });

  socket.on('zone_update', (zone) => {
    useGameStore.getState().setZone(zone.center, zone.radius);
  });

  socket.on('player_join', (player) => {
    useGameStore.getState().updatePlayer(player.id, player);
    useGameStore.getState().addChatMessage({ user: 'System', text: `Player ${player.id.substring(0, 4)} joined.` });
  });

  // Interpolación de posición/rotación se maneja en el componente OtherPlayer dentro de Scene
  socket.on('player_move', (data) => {
    useGameStore.getState().updatePlayer(data.id, { position: data.position, rotation: data.rotation });
  });

  socket.on('player_leave', (data) => {
    useGameStore.getState().removePlayer(data.id);
    useGameStore.getState().addChatMessage({ user: 'System', text: `Player ${data.id.substring(0, 4)} left.` });
  });

  socket.on('player_shoot', () => {
    // Aquí se podría instanciar un Muzzle Flash visual y sonido proveniente del jugador
  });

  socket.on('player_health', (data) => {
    if (data.id === socket.id) {
      useGameStore.getState().setHealth(data.health);
    } else {
      useGameStore.getState().updatePlayer(data.id, { health: data.health });
    }
  });
}
