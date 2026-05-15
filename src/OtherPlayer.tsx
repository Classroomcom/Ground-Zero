import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, Vector3 } from 'three';
import { Character } from './Character';

interface OtherPlayerProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export function OtherPlayer({ id, position, rotation }: OtherPlayerProps) {
  const groupRef = useRef<Group>(null);
  const [action, setAction] = useState('idle');
  const actionRef = useRef('idle');
  const lastPos = useRef(new Vector3(...position));

  useFrame(() => {
    if (!groupRef.current) return;
    
    const targetPos = new Vector3(...position);
    const dist = targetPos.distanceTo(lastPos.current);
    
    const nextAction = dist > 0.05 ? 'run' : 'idle';
    if (actionRef.current !== nextAction) {
      actionRef.current = nextAction;
      setAction(nextAction);
    }
    
    lastPos.current.lerp(targetPos, 0.2);
    
    groupRef.current.position.copy(lastPos.current);
    groupRef.current.position.y -= 1; // Align to floor
    
    // Add Math.PI so they face the direction properly if model implies it
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, rotation[1] + Math.PI, 0.2);
  });

  return (
    <group ref={groupRef} userData={{ isPlayer: true, playerId: id }}>
       <mesh position={[0, 1, 0]} visible={false} userData={{ isPlayer: true, playerId: id }}>
         <capsuleGeometry args={[0.5, 1, 4, 8]} />
         <meshBasicMaterial transparent opacity={0.5} color="red" />
       </mesh>
      <Character actionName={action} />
    </group>
  );
}
