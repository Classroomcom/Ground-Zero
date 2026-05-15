import { PointerLockControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { EffectComposer, Bloom, SSAO, Vignette } from '@react-three/postprocessing';
import { Player } from './Player';
import { OtherPlayer } from './OtherPlayer';
import { useGameStore } from './store';
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

// 1. Motor de Renderizado (Three.js + WebGL)
export function GameScene() {
  const { otherPlayers, setLocked } = useGameStore();
  const otherPlayersArray = Array.from(otherPlayers.values());
  const { gl } = useThree();

  useEffect(() => {
    // Provide a localized polyfill for requestPointerLock on the canvas element
    // if the environment (e.g. restrictive iframe) doesn't provide it natively.
    if (gl.domElement && typeof gl.domElement.requestPointerLock !== 'function') {
      gl.domElement.requestPointerLock = function() {
        console.warn('Pointer lock is not available in this environment.');
        const doc = this.ownerDocument || document;
        try {
          Object.defineProperty(doc, 'pointerLockElement', {
            get: () => this,
            configurable: true
          });
        } catch (e) {}
        setTimeout(() => {
          doc.dispatchEvent(new Event('pointerlockchange'));
        }, 10);
      };
    }
  }, [gl]);

  return (
    <>
      <color attach="background" args={['#0c0d10']} />
      <fog attach="fog" args={['#0c0d10', 15, 100]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#a8ff78" />
      <directionalLight
        castShadow
        position={[50, 100, -50]}
        intensity={1}
        color="#ffffff"
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
      />
      <pointLight position={[0, 10, 0]} intensity={2} color="#00ff41" distance={30} castShadow />

      <Physics gravity={[0, -20, 0]}>
        <Player />

        {/* Instancias de Otros Jugadores */}
        {otherPlayersArray.map((p) => (
          <OtherPlayer key={p.id} id={p.id} position={p.position} rotation={p.rotation} />
        ))}

        {/* Detailed Map Generation */}
        <RigidBody type="fixed" colliders="trimesh">
          <group>
            {/* Ground */}
            <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[200, 200, 32, 32]} />
              <meshStandardMaterial color="#111215" roughness={0.9} metalness={0.2} />
            </mesh>
            
            {/* Grid overlay for ground */}
            <gridHelper args={[200, 100, '#00ff41', '#222222']} position={[0, 0.01, 0]} material-opacity={0.15} material-transparent />

            {/* Central Hub Structure */}
            <mesh castShadow receiveShadow position={[0, 2.5, 0]} userData={{ isTarget: true, name: 'CenterCube' }}>
              <boxGeometry args={[10, 5, 10]} />
              <meshStandardMaterial color="#1a1c23" roughness={0.7} metalness={0.5} />
            </mesh>
            
            {/* Neon Rings around Central Hub */}
            <mesh position={[0, 5.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
               <ringGeometry args={[3, 4, 32]} />
               <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={2} toneMapped={false} />
            </mesh>

            {/* Industrial Pillars */}
            {[[-15, -15], [15, -15], [-15, 15], [15, 15]].map(([x, z], i) => (
              <mesh key={i} castShadow receiveShadow position={[x, 10, z]} userData={{ isTarget: true, name: `Pillar_${i}` }}>
                <cylinderGeometry args={[2, 2, 20, 16]} />
                <meshStandardMaterial color="#0f1115" roughness={0.8} />
              </mesh>
            ))}

            {/* Ramp */}
            <mesh castShadow receiveShadow position={[0, 1.25, 10]} rotation={[-0.3, 0, 0]} userData={{ isTarget: true }}>
              <boxGeometry args={[4, 0.5, 12]} />
              <meshStandardMaterial color="#2a2c35" roughness={0.6} />
            </mesh>
            
            {/* Elevated Platform */}
            <mesh castShadow receiveShadow position={[0, 2.5, 15]} userData={{ isTarget: true }}>
               <boxGeometry args={[10, 0.5, 10]} />
               <meshStandardMaterial color="#2a2c35" roughness={0.6} />
            </mesh>

            {/* Cover Blocks */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const r = 25;
              const x = Math.cos(angle) * r;
              const z = Math.sin(angle) * r;
              return (
                <group key={`cover_${i}`} position={[x, 0, z]}>
                  {/* Base Block */}
                  <mesh castShadow receiveShadow position={[0, 2, 0]} userData={{ isTarget: true }}>
                    <boxGeometry args={[4, 4, 2]} />
                    <meshStandardMaterial color="#1e2129" roughness={0.8} metalness={0.3} />
                  </mesh>
                  {/* Angled deflector */}
                  <mesh castShadow receiveShadow position={[0, 4.5, 0.5]} rotation={[-0.5, 0, 0]} userData={{ isTarget: true }}>
                     <boxGeometry args={[4, 1.5, 0.2]} />
                     <meshStandardMaterial color="#2d303a" roughness={0.5} metalness={0.5} />
                  </mesh>
                  {/* Small neon accent */}
                  <mesh position={[0, 3, 1.01]}>
                    <planeGeometry args={[1, 0.1]} />
                    <meshStandardMaterial color="#ff4b2b" emissive="#ff4b2b" emissiveIntensity={2} />
                  </mesh>
                </group>
              );
            })}
          </group>
        </RigidBody>
      </Physics>

      {/* Controladores de Mouse FPS (Pointer Lock) */}
      <PointerLockControls 
        onLock={() => setLocked(true)} 
        onUnlock={() => setLocked(false)} 
      />

      {/* Post-procesamiento para realismo (Post-Processing) */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
        <SSAO radius={0.5} intensity={20} luminanceInfluence={0.5} color="black" />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
}
