import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, useRapier, RapierRigidBody } from '@react-three/rapier';
import { Vector3, MathUtils, Euler, Raycaster, Group } from 'three';
import { socket } from './socket';
import { useGameStore } from './store';

// 2. Controlador FPS Técnico + Mecánicas de Combate (Raycasting)
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
  const weaponGroup = useRef<Group>(null);
  const [, getKeys] = useKeyboardControls();
  const { rapier, world } = useRapier();
  const [lastShot, setLastShot] = useState(0);

  const { isLocked, setAmmo, ammo } = useGameStore();

  // Variables for visual recoil & sway
  const targetPitch = useRef(0);
  const recoilPitch = useRef(0);
  
  const prevCameraRot = useRef(new Euler());
  const weaponSway = useRef(new Vector3(0, 0, 0));

  // Send position via WS
  useEffect(() => {
    const interval = setInterval(() => {
      if (!rb.current) return;
      const pos = rb.current.translation();
      const rot = camera.rotation;

      // Broadcast position to others
      socket.emit("move", {
        position: [pos.x, pos.y, pos.z],
        rotation: [rot.x, rot.y, rot.z]
      });
    }, 50); // ~20 ticks per sec
    return () => clearInterval(interval);
  }, [camera]);

  useFrame((state) => {
    if (!rb.current) return;

    // Movement Physics
    const keys = getKeys();
    const velocity = rb.current.linvel();
    const pos = rb.current.translation();

    // Ground Detection Raycast
    const groundRayOrigin = { x: pos.x, y: pos.y - 1.05, z: pos.z };
    const groundRayDir = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(groundRayOrigin, groundRayDir);
    const hit = world.castRay(ray, 0.2, true);
    const isGrounded = hit && hit.toi < 0.2;

    frontVector.set(0, 0, (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0));
    sideVector.set((keys.left ? 1 : 0) - (keys.right ? 1 : 0), 0, 0);

    const currentSpeed = keys.sprint ? SPRINT_SPEED : SPEED;
    
    // Normalize combined vector
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(currentSpeed).applyEuler(camera.rotation);

    if (isLocked) {
      rb.current.setLinvel({
        x: direction.x,
        y: velocity.y, // Maintain gravity
        z: direction.z
      }, true);
    }

    if (keys.jump && isGrounded && isLocked) {
      rb.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
    }

    // Attach camera to rigidBody
    camera.position.set(pos.x, pos.y + 0.6, pos.z);

    // Shooting mechanics (Raycasting)
    if (keys.fire && state.clock.elapsedTime - lastShot > 0.1 && ammo > 0 && isLocked) {
      setLastShot(state.clock.elapsedTime);
      setAmmo(ammo - 1);
      
      // Visual Recoil application
      recoilPitch.current += RECOIL_AMOUNT;

      // Weapon Kickback (visual punch)
      if (weaponGroup.current) {
        weaponGroup.current.position.z += 0.05;
        weaponGroup.current.rotation.x -= 0.05;
      }

      socket.emit("shoot", { time: state.clock.elapsedTime });

      raycaster.setFromCamera({ x: 0, y: 0 }, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      const hitObj = intersects.find(obj => obj.object.userData?.isTarget || obj.object.userData?.isPlayer);
      if (hitObj) {
        if (hitObj.object.userData?.playerId) {
          socket.emit("hit", { targetId: hitObj.object.userData.playerId, damage: 15 });
        }
      }
    }

    // Camera Recoil recovery interpolation
    targetPitch.current = MathUtils.lerp(targetPitch.current, 0, 0.1);
    recoilPitch.current = MathUtils.lerp(recoilPitch.current, targetPitch.current, 0.1);
    camera.rotation.x += recoilPitch.current;

    // --- Weapon Sway & Bobbing ---
    if (weaponGroup.current) {
      // 1. Walk bobbing
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
      const isMoving = speed > 0.5 && isGrounded;
      const bobTime = state.clock.elapsedTime * (keys.sprint ? 15 : 10);
      
      const targetWeaponY = isMoving ? Math.sin(bobTime) * 0.01 - 0.25 : -0.25;
      const targetWeaponX = isMoving ? Math.cos(bobTime / 2) * 0.01 + 0.3 : 0.3;

      // 2. Look Sway (reacting to mouse turn)
      const rotDeltaX = camera.rotation.y - prevCameraRot.current.y;
      const rotDeltaY = camera.rotation.x - prevCameraRot.current.x;
      
      // We clamp the delta to prevent crazy snap glitches when looking around fast
      const maxSway = 0.05;
      const swayX = MathUtils.clamp(rotDeltaX * 0.5, -maxSway, maxSway);
      const swayY = MathUtils.clamp(rotDeltaY * 0.5, -maxSway, maxSway);

      weaponSway.current.x = MathUtils.lerp(weaponSway.current.x, swayX, 0.1);
      weaponSway.current.y = MathUtils.lerp(weaponSway.current.y, swayY, 0.1);

      // Apply positions with lerp for smoothness
      weaponGroup.current.position.x = MathUtils.lerp(weaponGroup.current.position.x, targetWeaponX + weaponSway.current.x, 0.1);
      weaponGroup.current.position.y = MathUtils.lerp(weaponGroup.current.position.y, targetWeaponY - weaponSway.current.y, 0.1);
      weaponGroup.current.position.z = MathUtils.lerp(weaponGroup.current.position.z, -0.6, 0.1);
      
      // Reset rotation recovery from kickback
      weaponGroup.current.rotation.x = MathUtils.lerp(weaponGroup.current.rotation.x, 0, 0.1);
      weaponGroup.current.rotation.y = MathUtils.lerp(weaponGroup.current.rotation.y, Math.PI, 0.1); // Face forward relative to camera
      
      prevCameraRot.current.copy(camera.rotation);
    }
  });

  return (
    <>
      <RigidBody ref={rb} colliders="capsule" mass={1} type="dynamic" position={[0, 5, 0]} enabledRotations={[false, false, false]}>
         {/* Cuerpo físico invisible, la cámara lo sigue */}
      </RigidBody>

      {/* Render Weapon in Camera Space */}
      {createPortal(
        <group ref={weaponGroup} position={[0.3, -0.25, -0.6]} rotation={[0, Math.PI, 0]}>
          <group scale={0.5}>
            {/* Main Receiver */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.1, 0.2, 0.8]} />
              <meshStandardMaterial color="#1a1c23" roughness={0.8} metalness={0.4} />
            </mesh>
            {/* Barrel */}
            <mesh position={[0, 0.02, 0.6]} castShadow>
              <cylinderGeometry args={[0.02, 0.025, 0.5]} rotation={[Math.PI / 2, 0, 0]} />
              <meshStandardMaterial color="#0c0d10" roughness={0.5} metalness={0.8} />
            </mesh>
            {/* Holographic Sight */}
            <mesh position={[0, 0.15, 0.1]} castShadow>
              <boxGeometry args={[0.04, 0.1, 0.08]} />
              <meshStandardMaterial color="#00ff41" emissive="#00ff41" emissiveIntensity={1} />
            </mesh>
            {/* Front Grip */}
            <mesh position={[0, -0.15, 0.3]} rotation={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.06, 0.15, 0.08]} />
              <meshStandardMaterial color="#2d303a" roughness={0.9} />
            </mesh>
            {/* Magazine */}
            <mesh position={[0, -0.2, 0]} rotation={[-0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.08, 0.25, 0.15]} />
              <meshStandardMaterial color="#222222" roughness={0.7} />
            </mesh>
          </group>
        </group>,
        camera
      )}
    </>
  );
}
