import { useGLTF, useAnimations, Clone } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { Group } from 'three';

export function Character({ actionName = 'idle', ...props }: any) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('https://raw.githubusercontent.com/classroomcom/Ground-Zero/main/low_poly_soldier.glb');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (!actions) return;
    const availableActions = Object.keys(actions);
    if (availableActions.length === 0) return;

    // Try to find matching action (case insensitive)
    const matchedKey = availableActions.find(k => k.toLowerCase().includes(actionName.toLowerCase()));
    
    // Default to first action
    const nameToPlay = matchedKey || availableActions[0];

    const targetAction = actions[nameToPlay];
    if (targetAction) {
      targetAction.reset().fadeIn(0.2).play();
      return () => { targetAction.fadeOut(0.2); };
    }
  }, [actionName, actions]);

  return (
    <group ref={group} {...props} dispose={null}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  );
}

useGLTF.preload('https://raw.githubusercontent.com/classroomcom/Ground-Zero/main/low_poly_soldier.glb');
