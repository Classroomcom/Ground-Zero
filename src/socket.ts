import { io, Socket } from 'socket.io-client';
import { useGameStore } from './store';

// We connect to the current host
export const socket: Socket = io();

// 3. Sistema Multijugador - Arquitectura Frontend (WebSockets)
export function initSocket() {
  socket.on('connect', () => {
    useGameStore.getState().addChatMessage({ user: 'System', text: 'Connected to server!' });
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
