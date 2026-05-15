import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, MathUtils } from 'three';

interface OtherPlayerProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export function OtherPlayer({ id, position, rotation }: OtherPlayerProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    
    // 3. Sistema Multijugador - Interpolación de Entidades (Entity Interpolation)
    // Para evitar saltos lagosos de red, interpolamos LERP desde la posición visual actual
    // hacia la posición lógica más reciente recibida por red.
    meshRef.current.position.lerp({ x: position[0], y: position[1], z: position[2] }, 0.2);
    
    // Smooth rotation using slerp would be best, using simple lerp or angles for now
    meshRef.current.rotation.x = MathUtils.lerp(meshRef.current.rotation.x, rotation[0], 0.2);
    meshRef.current.rotation.y = MathUtils.lerp(meshRef.current.rotation.y, rotation[1], 0.2);
    meshRef.current.rotation.z = MathUtils.lerp(meshRef.current.rotation.z, rotation[2], 0.2);
  });

  return (
    <mesh ref={meshRef} position={position} userData={{ isPlayer: true, playerId: id }}>
      <capsuleGeometry args={[0.5, 1, 4, 8]} />
      <meshStandardMaterial color="red" roughness={0.7} />
    </mesh>
  );
}
