import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { GameScene } from './Scene';
import { UI } from './UI';
import { initSocket } from './socket';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
  { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
  { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
  { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'sprint', keys: ['Shift'] },
  { name: 'fire', keys: ['Click'] }, // Virtual mapping for fire is complex, usually handled via DOM events or specific hooks, but we'll use a custom state or mouse listener in Player
  { name: 'reload', keys: ['KeyR', 'r', 'R'] }
];

export default function App() {
  useEffect(() => {
    initSocket();
  }, []);

  // Para poder usar "fire" en KeyboardControls, un truco sencillo es mapear el clic
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Click', key: 'Click' }));
        setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Click', key: 'Click' })), 50);
      }
    };
    window.addEventListener('mousedown', handleMouse);
    return () => window.removeEventListener('mousedown', handleMouse);
  }, []);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000 }}>
          <GameScene />
        </Canvas>
        <UI />
      </KeyboardControls>
    </div>
  );
}
