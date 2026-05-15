import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, useRapier, RapierRigidBody } from '@react-three/rapier';
import { Vector3, MathUtils, Raycaster, Group } from 'three';
import { Character } from './Character';
import { socket } from './socket';
import { useGameStore } from './store';

const SPEED = 5;
const SPRINT_SPEED = 8;
const JUMP_FORCE = 6;
const RECOIL_AMOUNT = 0.05;

const direction = new Vector3();
const frontVector = new Vector3();
const sideVector = new Vector3();
const raycaster = new Raycaster();

export function Player() {
  const { camera, scene } = useThree();
  const rb = useRef<RapierRigidBody>(null);
  const characterRef = useRef<Group>(null);
  const [, getKeys] = useKeyboardControls();
  const { rapier, world } = useRapier();
  const [lastShot, setLastShot] = useState(0);

  const [action, setAction] = useState('idle');
  const actionRef = useRef('idle');

  const { isLocked, setAmmo, ammo, maxAmmo, setMyPosition, setHealth, health, zone, isReloading, setIsReloading } = useGameStore();

  const targetPitch = useRef(0);
  const recoilPitch = useRef(0);
  const isReloadingRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!rb.current) return;
      const pos = rb.current.translation();
      const rot = camera.rotation;

      setMyPosition([pos.x, pos.y, pos.z], rot.y);

      // Zone Damage Logic
      const dx = pos.x - zone.center[0];
      const dz = pos.z - zone.center[1];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > zone.radius) {
         setHealth(useGameStore.getState().health - 1);
      }

      socket.emit("move", {
        position: [pos.x, pos.y, pos.z],
        rotation: [rot.x, rot.y, rot.z]
      });
    }, 50); 
    return () => clearInterval(interval);
  }, [camera, zone]);

  useFrame((state) => {
    if (!rb.current) return;

    const keys = getKeys();
    const velocity = rb.current.linvel();
    const pos = rb.current.translation();

    // Ground Detection 
    const groundRayOrigin = { x: pos.x, y: pos.y - 1.05, z: pos.z };
    const groundRayDir = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(groundRayOrigin, groundRayDir);
    const hit = world.castRay(ray, 0.2, true);
    const isGrounded = hit && hit.toi < 0.2;

    frontVector.set(0, 0, (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0));
    sideVector.set((keys.left ? 1 : 0) - (keys.right ? 1 : 0), 0, 0);

    const currentSpeed = keys.sprint ? SPRINT_SPEED : SPEED;
    
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(currentSpeed).applyEuler(camera.rotation);

    if (isLocked) {
      rb.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);
    }

    if (keys.jump && isGrounded && isLocked) {
      rb.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
    }

    // Animation State
    const speedMag = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    let nextAction = 'idle';
    if (!isGrounded) nextAction = 'jump'; 
    else if (speedMag > 0.5) nextAction = 'run';
    
    if (actionRef.current !== nextAction) {
      actionRef.current = nextAction;
      setAction(nextAction);
    }

    // TPS Camera Setup
    const idealOffset = new Vector3(0.5, 0.5, 2.5);
    idealOffset.applyEuler(camera.rotation);
    camera.position.set(pos.x, pos.y + 0.5, pos.z).add(idealOffset);

    // Character Follow 
    if (characterRef.current) {
       characterRef.current.position.set(pos.x, pos.y - 1, pos.z);
       characterRef.current.rotation.y = camera.rotation.y + Math.PI;
    }

    // Reload Mechanics
    if ((keys.reload || ammo <= 0) && ammo < maxAmmo && !isReloadingRef.current && isLocked) {
      isReloadingRef.current = true;
      setIsReloading(true);
      setTimeout(() => {
        useGameStore.getState().setAmmo(useGameStore.getState().maxAmmo);
        useGameStore.getState().setIsReloading(false);
        isReloadingRef.current = false;
      }, 2000);
    }

    // Shooting mechanics
    if (keys.fire && state.clock.elapsedTime - lastShot > 0.1 && ammo > 0 && isLocked && !isReloadingRef.current) {
      setLastShot(state.clock.elapsedTime);
      setAmmo(ammo - 1);
      
      recoilPitch.current += RECOIL_AMOUNT;
      socket.emit("shoot", { time: state.clock.elapsedTime });

      // Raycast from camera center
      raycaster.setFromCamera({ x: 0, y: 0 }, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      const hitObj = intersects.find(obj => obj.object.userData?.isTarget || obj.object.userData?.isPlayer);
      if (hitObj) {
        if (hitObj.object.userData?.playerId) {
          socket.emit("hit", { targetId: hitObj.object.userData.playerId, damage: 15 });
        }
      }
    }

    targetPitch.current = MathUtils.lerp(targetPitch.current, 0, 0.1);
    recoilPitch.current = MathUtils.lerp(recoilPitch.current, targetPitch.current, 0.1);
    camera.rotation.x += recoilPitch.current;
  });

  return (
    <>
      <RigidBody ref={rb} colliders="capsule" mass={1} type="dynamic" position={[0, 5, 0]} enabledRotations={[false, false, false]}>
         <mesh visible={false}>
           <capsuleGeometry args={[0.5, 1, 4, 8]} />
         </mesh>
      </RigidBody>

      <group ref={characterRef}>
         <Character actionName={action} />
      </group>
    </>
  );
}
