import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PetState, PetMood } from '../../types';
import { buildPetModel, PetNodes, buildCustomizationItems } from './petGeometries';
import { buildRoomEnvironment, RoomNodes, populateFoodBowl } from './roomGeometries';
import { PetParticleSystem } from './petParticleSystem';
import { soundManager } from '../../utils/audio';
import { RotateCw, ZoomIn, Eye, Sparkles } from 'lucide-react';

export type AnimationState =
  | 'idle'
  | 'walking'
  | 'eating'
  | 'drinking'
  | 'sleeping'
  | 'happy'
  | 'bathing';

export interface FeedTriggerData {
  foodId: string;
  timestamp: number;
}

export interface WaterTriggerData {
  timestamp: number;
}

interface PetScene3DProps {
  pet: PetState;
  mood: PetMood;
  onPetClick: () => void;
  onOpenFeed?: () => void;
  onGiveWater?: () => void;
  onToggleSleep?: () => void;
  feedTrigger?: FeedTriggerData | null;
  waterTrigger?: WaterTriggerData | null;
  onEatingComplete?: () => void;
  onDrinkingComplete?: () => void;
  isBathing?: boolean;
  cleanProgress?: number;
  interactive?: boolean;
}

export const PetScene3D: React.FC<PetScene3DProps> = ({
  pet,
  mood,
  onPetClick,
  onOpenFeed,
  onGiveWater,
  onToggleSleep,
  feedTrigger,
  waterTrigger,
  onEatingComplete,
  onDrinkingComplete,
  isBathing = false,
  cleanProgress = 0,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const petNodesRef = useRef<PetNodes | null>(null);
  const roomNodesRef = useRef<RoomNodes | null>(null);
  const particlesRef = useRef<PetParticleSystem | null>(null);

  // Animation controller refs
  const animStateRef = useRef<AnimationState>('idle');
  const animTimeRef = useRef<number>(0);
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentRotYRef = useRef<number>(0);
  const isWalkingRef = useRef<boolean>(false);
  const lastStateChangeRef = useRef<number>(Date.now());
  const blinkTimerRef = useRef<number>(2.0);
  const activeIntentRef = useRef<'none' | 'food' | 'water'>('none');

  // Stable callbacks container for animation loop
  const callbacksRef = useRef({ onEatingComplete, onDrinkingComplete });
  useEffect(() => {
    callbacksRef.current = { onEatingComplete, onDrinkingComplete };
  });

  // Camera Orbit State
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0,
    phi: 0.45,
    radius: 5.6,
  });
  const targetAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0,
    phi: 0.45,
    radius: 5.6,
  });
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedPointerRef = useRef<boolean>(false);

  // UI Helper states
  const [cameraMode, setCameraMode] = useState<'front' | 'angled' | 'top'>('front');

  // Trigger happy jump animation
  const triggerHappyAnimation = useCallback(() => {
    animStateRef.current = 'happy';
    animTimeRef.current = 0;
    if (particlesRef.current && petNodesRef.current) {
      particlesRef.current.spawnHearts(
        petNodesRef.current.root.position.clone().add(new THREE.Vector3(0, 0.8, 0)),
        6
      );
    }
  }, []);

  // Trigger eating animation
  const triggerEatAnimation = useCallback((foodId: string = 'seeds') => {
    if (!roomNodesRef.current) return;
    if (animStateRef.current === 'sleeping') {
      animStateRef.current = 'idle';
    }
    populateFoodBowl(roomNodesRef.current.foodPelletsGroup, foodId);
    roomNodesRef.current.foodPelletsGroup.scale.set(1, 1, 1);
    roomNodesRef.current.foodPelletsGroup.visible = true;

    activeIntentRef.current = 'food';
    targetPosRef.current.copy(roomNodesRef.current.foodBowlPosition).add(new THREE.Vector3(0.55, 0, 0.25));
    animStateRef.current = 'walking';
    isWalkingRef.current = true;
    animTimeRef.current = 0;
  }, []);

  // Trigger drinking animation
  const triggerDrinkAnimation = useCallback(() => {
    if (!roomNodesRef.current) return;
    if (animStateRef.current === 'sleeping') {
      animStateRef.current = 'idle';
    }
    activeIntentRef.current = 'water';
    targetPosRef.current.copy(roomNodesRef.current.waterBowlPosition).add(new THREE.Vector3(0.55, 0, 0.2));
    animStateRef.current = 'walking';
    isWalkingRef.current = true;
    animTimeRef.current = 0;
  }, []);

  // Watch external Feed Trigger (from UI buttons or drawers)
  useEffect(() => {
    if (!feedTrigger || !roomNodesRef.current) return;
    triggerEatAnimation(feedTrigger.foodId);
  }, [feedTrigger, triggerEatAnimation]);

  // Watch external Water Trigger (from UI buttons)
  useEffect(() => {
    if (!waterTrigger || !roomNodesRef.current) return;
    triggerDrinkAnimation();
  }, [waterTrigger, triggerDrinkAnimation]);

  // Camera presets
  const handleCameraPreset = (mode: 'front' | 'angled' | 'top') => {
    setCameraMode(mode);
    soundManager.playPop();
    if (mode === 'front') {
      targetAngleRef.current = { theta: 0, phi: 0.42, radius: 5.4 };
    } else if (mode === 'angled') {
      targetAngleRef.current = { theta: 0.45, phi: 0.52, radius: 5.8 };
    } else if (mode === 'top') {
      targetAngleRef.current = { theta: -0.3, phi: 0.82, radius: 6.2 };
    }
  };

  // Sync pet sleep state with 3D scene
  useEffect(() => {
    if (pet.isSleeping) {
      if (roomNodesRef.current) {
        targetPosRef.current.copy(roomNodesRef.current.bedPosition).add(new THREE.Vector3(0, 0.15, 0));
        currentPosRef.current.copy(targetPosRef.current);
        if (petNodesRef.current) {
          petNodesRef.current.root.position.copy(targetPosRef.current);
        }
      }
      animStateRef.current = 'sleeping';
    } else {
      if (animStateRef.current === 'sleeping') {
        animStateRef.current = 'idle';
        targetPosRef.current.set(0, 0, 0);
      }
    }
  }, [pet.isSleeping]);

  // Sync customization updates in real-time
  useEffect(() => {
    if (petNodesRef.current) {
      buildCustomizationItems(
        petNodesRef.current.accessoryGroup,
        petNodesRef.current.headGroup,
        petNodesRef.current.bodyGroup,
        pet.customization,
        pet.type
      );
    }
  }, [pet.customization, pet.type]);

  // Sync room customization updates
  useEffect(() => {
    if (!sceneRef.current || !roomNodesRef.current) return;
    sceneRef.current.background = pet.isSleeping
      ? new THREE.Color(0x2d1a33)
      : new THREE.Color(0xffe9f0);
    const oldRoom = roomNodesRef.current.group;
    sceneRef.current.remove(oldRoom);

    const newRoom = buildRoomEnvironment(pet.room, pet.isSleeping);
    roomNodesRef.current = newRoom;
    sceneRef.current.add(newRoom.group);
  }, [pet.room, pet.isSleeping]);

  // Bathing suds update
  useEffect(() => {
    if (isBathing && particlesRef.current && petNodesRef.current) {
      animStateRef.current = 'bathing';
      particlesRef.current.spawnBubbles(
        petNodesRef.current.root.position.clone().add(new THREE.Vector3(0, 0.6, 0)),
        5
      );
    }
  }, [isBathing, cleanProgress]);

  // Main Three.js Setup & Animation Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = pet.isSleeping ? new THREE.Color(0x2d1a33) : new THREE.Color(0xffe9f0);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 30);
    camera.position.set(0, 3.2, 5.6);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Build 3D Room
    const roomNodes = buildRoomEnvironment(pet.room, pet.isSleeping);
    roomNodesRef.current = roomNodes;
    scene.add(roomNodes.group);

    // 5. Build 3D Pet
    const petNodes = buildPetModel(pet.type, pet.customization);
    petNodesRef.current = petNodes;
    scene.add(petNodes.root);

    // If sleeping at start, position in bed
    if (pet.isSleeping) {
      currentPosRef.current.copy(roomNodes.bedPosition).add(new THREE.Vector3(0, 0.15, 0));
      targetPosRef.current.copy(currentPosRef.current);
      petNodes.root.position.copy(currentPosRef.current);
      animStateRef.current = 'sleeping';
    }

    // 6. Particle System
    const particles = new PetParticleSystem();
    particlesRef.current = particles;
    scene.add(particles.group);

    // 7. Raycaster for clicking 3D objects
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Touch / Mouse handlers for Orbit Camera & Object Clicking
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      hasMovedPointerRef.current = false;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedPointerRef.current = true;
      }

      // Rotate camera around room
      targetAngleRef.current.theta -= dx * 0.007;
      targetAngleRef.current.phi = Math.max(
        0.2,
        Math.min(0.95, targetAngleRef.current.phi + dy * 0.005)
      );

      // Clamp theta so player stays within pleasant room viewing cone (-0.8 to +0.8 rad)
      targetAngleRef.current.theta = Math.max(-0.85, Math.min(0.85, targetAngleRef.current.theta));

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;

      // If user tapped without dragging, raycast to click pet or room objects
      if (!hasMovedPointerRef.current && interactive) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Check if pet clicked
        const petIntersects = raycaster.intersectObjects(petNodes.bodyGroup.children, true);
        if (petIntersects.length > 0) {
          if (!pet.isSleeping) {
            triggerHappyAnimation();
            onPetClick();
          } else {
            // Wake up if tapped bed
            if (onToggleSleep) onToggleSleep();
          }
          return;
        }

        // Check if food bowl clicked
        const foodIntersects = raycaster.intersectObjects(roomNodes.foodBowlGroup.children, true);
        if (foodIntersects.length > 0) {
          triggerEatAnimation();
          if (onOpenFeed) onOpenFeed();
          return;
        }

        // Check if water bowl clicked
        const waterIntersects = raycaster.intersectObjects(roomNodes.waterBowlGroup.children, true);
        if (waterIntersects.length > 0) {
          triggerDrinkAnimation();
          if (onGiveWater) onGiveWater();
          return;
        }

        // Check if bed clicked
        const bedIntersects = raycaster.intersectObjects(roomNodes.bedGroup.children, true);
        if (bedIntersects.length > 0) {
          if (onToggleSleep) onToggleSleep();
          return;
        }

        // Check if toy clicked
        const toyIntersects = raycaster.intersectObjects(roomNodes.toyGroup.children, true);
        if (toyIntersects.length > 0) {
          soundManager.playPop();
          targetPosRef.current.copy(roomNodes.toyPosition).add(new THREE.Vector3(-0.4, 0, -0.2));
          animStateRef.current = 'walking';
          isWalkingRef.current = true;
          return;
        }

        // Check if floor clicked -> pet waddles over to investigated tap
        const floorIntersects = raycaster.intersectObject(roomNodes.floorMesh);
        if (floorIntersects.length > 0 && !pet.isSleeping) {
          const pt = floorIntersects[0].point;
          // Clamp inside playable room area
          const targetX = Math.max(-1.8, Math.min(1.8, pt.x));
          const targetZ = Math.max(-1.8, Math.min(1.8, pt.z));
          targetPosRef.current.set(targetX, 0, targetZ);
          animStateRef.current = 'walking';
          isWalkingRef.current = true;
          soundManager.playPop();
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 9. Animation Loop
    let clock = new THREE.Clock();
    let animFrameId: number;
    let zzzSpawnTimer = 0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      animTimeRef.current += delta;
      const t = animTimeRef.current;

      // Smooth camera orbit damping
      const curCam = cameraAngleRef.current;
      const tarCam = targetAngleRef.current;
      curCam.theta += (tarCam.theta - curCam.theta) * 0.08;
      curCam.phi += (tarCam.phi - curCam.phi) * 0.08;
      curCam.radius += (tarCam.radius - curCam.radius) * 0.08;

      const camX = curCam.radius * Math.sin(curCam.theta) * Math.sin(curCam.phi);
      const camY = curCam.radius * Math.cos(curCam.phi);
      const camZ = curCam.radius * Math.cos(curCam.theta) * Math.sin(curCam.phi);
      camera.position.set(camX, camY + 0.5, camZ);
      camera.lookAt(0, 0.7, 0);

      // Random spontaneous pet activity when idle
      if (
        !pet.isSleeping &&
        animStateRef.current === 'idle' &&
        Date.now() - lastStateChangeRef.current > 7000 &&
        Math.random() < 0.015
      ) {
        lastStateChangeRef.current = Date.now();
        // Wander to a random cozy spot in room
        const randomX = (Math.random() - 0.5) * 2.8;
        const randomZ = (Math.random() - 0.5) * 2.5;
        targetPosRef.current.set(randomX, 0, randomZ);
        animStateRef.current = 'walking';
        isWalkingRef.current = true;
      }

      // Blink animation (only when awake)
      if (animStateRef.current !== 'sleeping') {
        blinkTimerRef.current -= delta;
        if (blinkTimerRef.current <= 0) {
          blinkTimerRef.current = 2.5 + Math.random() * 3.0;
          petNodes.leftEye.scale.y = 0.08;
          petNodes.rightEye.scale.y = 0.08;
          setTimeout(() => {
            if (petNodesRef.current && animStateRef.current !== 'sleeping') {
              petNodesRef.current.leftEye.scale.y = 1.05;
              petNodesRef.current.rightEye.scale.y = 1.05;
            }
          }, 130);
        }
      }

      // Pet position interpolation & walking waddle
      const distToTarget = currentPosRef.current.distanceTo(targetPosRef.current);

      if (isWalkingRef.current && distToTarget > 0.08) {
        const moveDir = targetPosRef.current.clone().sub(currentPosRef.current).normalize();
        const speed = 1.4;
        currentPosRef.current.addScaledVector(moveDir, speed * delta);

        // Turn towards movement direction
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetAngle - currentRotYRef.current;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        currentRotYRef.current += diff * 0.15;

        // Cute waddle animation
        const walkFreq = 14;
        const waddleBob = Math.abs(Math.sin(t * walkFreq)) * 0.12;
        petNodes.bodyGroup.position.y = 0.55 + waddleBob;
        petNodes.bodyGroup.rotation.z = Math.sin(t * walkFreq) * 0.12;

        // Legs swinging
        petNodes.leftLeg.rotation.x = Math.sin(t * walkFreq) * 0.6;
        petNodes.rightLeg.rotation.x = -Math.sin(t * walkFreq) * 0.6;

        // Arms swinging
        petNodes.leftArm.rotation.x = -Math.sin(t * walkFreq) * 0.4;
        petNodes.rightArm.rotation.x = Math.sin(t * walkFreq) * 0.4;

        // Ear wiggles
        petNodes.leftEar.rotation.z = Math.sin(t * walkFreq) * 0.15;
        petNodes.rightEar.rotation.z = -Math.sin(t * walkFreq) * 0.15;
      } else if (isWalkingRef.current) {
        // Reached destination!
        isWalkingRef.current = false;
        petNodes.leftLeg.rotation.x = 0;
        petNodes.rightLeg.rotation.x = 0;
        petNodes.leftArm.rotation.x = 0;
        petNodes.rightArm.rotation.x = 0;
        petNodes.bodyGroup.rotation.z = 0;

        // Check if arrived at bowl, bed, or toy
        if (targetPosRef.current.distanceTo(roomNodes.foodBowlPosition) < 0.9) {
          animStateRef.current = 'eating';
          animTimeRef.current = 0;
          soundManager.playEat();
          particles.spawnCrumbs(roomNodes.foodBowlPosition.clone().add(new THREE.Vector3(0, 0.28, 0)), 8);
        } else if (targetPosRef.current.distanceTo(roomNodes.waterBowlPosition) < 0.9) {
          animStateRef.current = 'drinking';
          animTimeRef.current = 0;
          soundManager.playDrink();
          particles.spawnWaterDroplets(roomNodes.waterBowlPosition.clone().add(new THREE.Vector3(0, 0.28, 0)), 8);
        } else if (targetPosRef.current.distanceTo(roomNodes.toyPosition) < 0.8) {
          animStateRef.current = 'happy';
          animTimeRef.current = 0;
          particles.spawnHearts(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.8, 0)), 5);
        } else {
          animStateRef.current = 'idle';
        }
      }

      // STATE-SPECIFIC ANIMATIONS
      const state = animStateRef.current;

      if (state === 'idle') {
        // Gentle breathing bob
        const breathe = Math.sin(t * 3.2) * 0.025;
        petNodes.bodyGroup.position.y = 0.55 + breathe;
        petNodes.bodyGroup.scale.set(1.0 - breathe * 0.5, 1.0 + breathe, 1.0 - breathe * 0.5);

        // Occasional ear wiggle
        const earWiggle = Math.sin(t * 1.5) * 0.05;
        petNodes.leftEar.rotation.z = earWiggle;
        petNodes.rightEar.rotation.z = -earWiggle;

        // Sprout bobble
        petNodes.accessoryGroup.rotation.z = Math.sin(t * 2.8) * 0.08;
      } else if (state === 'eating') {
        // Fast chomping head bob and cheek chewing
        const chomp = Math.sin(t * 18) * 0.14;
        petNodes.headGroup.position.y = 0.22 - Math.abs(chomp);
        petNodes.headGroup.position.z = 0.06 + Math.abs(chomp) * 0.7;
        petNodes.cheeksGroup.scale.set(1.0 + Math.abs(chomp) * 1.1, 1.0, 1.0);

        // Paws rhythmic feeding motion
        petNodes.leftArm.rotation.x = -0.6 + Math.sin(t * 18) * 0.25;
        petNodes.rightArm.rotation.x = -0.6 - Math.sin(t * 18) * 0.25;

        // Dynamic food shrinking in the bowl as hamster eats
        const eatProgress = Math.min(1.0, t / 2.2);
        const foodScale = Math.max(0.02, 1.0 - eatProgress * 0.92);
        roomNodes.foodPelletsGroup.scale.set(foodScale, foodScale, foodScale);

        // Sound crunch repeats midway
        if (t > 1.1 && t - delta <= 1.1) {
          soundManager.playEat();
        }

        if (t % 0.5 < 0.05) {
          particles.spawnCrumbs(roomNodes.foodBowlPosition.clone().add(new THREE.Vector3(0, 0.25, 0)), 3);
        }

        if (t > 2.4) {
          // Finished eating! Joyful squeak, hearts and celebration
          animStateRef.current = 'happy';
          animTimeRef.current = 0;
          soundManager.playSqueak();
          particles.spawnHearts(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.8, 0)), 6);
          callbacksRef.current.onEatingComplete?.();
        }
      } else if (state === 'drinking') {
        // Head dipping down into water bowl
        const dip = Math.sin(t * 9) * 0.1;
        petNodes.headGroup.position.y = 0.18 - Math.abs(dip);

        // Paws placed near bowl
        petNodes.leftArm.rotation.x = -0.4;
        petNodes.rightArm.rotation.x = -0.4;

        // Animated expanding water ripple ring
        const rippleMesh = roomNodes.waterBowlGroup.getObjectByName('water-ripple-mesh') as THREE.Mesh;
        if (rippleMesh) {
          const phase = (t * 2.5) % 1.0;
          rippleMesh.scale.set(1 + phase * 2.2, 1 + phase * 2.2, 1);
          if (rippleMesh.material) {
            (rippleMesh.material as any).opacity = Math.max(0, 0.85 - phase);
          }
        }

        // Glistening water surface movement
        roomNodes.waterSurfaceMesh.scale.set(
          1.0 + Math.sin(t * 14) * 0.04,
          1.0,
          1.0 + Math.sin(t * 14) * 0.04
        );

        // Repeat water slurp sound midway
        if (t > 1.0 && t - delta <= 1.0) {
          soundManager.playDrink();
        }

        if (t % 0.45 < 0.04) {
          particles.spawnWaterDroplets(roomNodes.waterBowlPosition.clone().add(new THREE.Vector3(0, 0.25, 0)), 3);
        }

        if (t > 2.2) {
          // Finished drinking! Happy little wiggle and hearts
          animStateRef.current = 'happy';
          animTimeRef.current = 0;
          soundManager.playPurr();
          particles.spawnHearts(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.8, 0)), 4);
          callbacksRef.current.onDrinkingComplete?.();
        }
      } else if (state === 'sleeping') {
        // Curled up cozy inside the bed
        petNodes.leftEye.scale.y = 0.08;
        petNodes.rightEye.scale.y = 0.08;
        const sleepBreathe = Math.sin(t * 2.0) * 0.02;
        petNodes.bodyGroup.position.y = 0.48 + sleepBreathe;
        petNodes.bodyGroup.rotation.x = 0.15;

        // Spawn gentle Zzz particles periodically
        zzzSpawnTimer += delta;
        if (zzzSpawnTimer > 1.8) {
          zzzSpawnTimer = 0;
          particles.spawnZzz(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.6, 0)));
        }
      } else if (state === 'happy') {
        // Joyful jump / 360 spin
        const jumpProgress = Math.min(1, t / 1.0);
        const jumpHeight = Math.sin(jumpProgress * Math.PI) * 0.6;
        petNodes.bodyGroup.position.y = 0.55 + jumpHeight;
        petNodes.bodyGroup.rotation.y = jumpProgress * Math.PI * 2;

        // Arms waving
        petNodes.leftArm.rotation.x = Math.sin(t * 20) * 0.8;
        petNodes.rightArm.rotation.x = -Math.sin(t * 20) * 0.8;

        if (jumpProgress >= 1) {
          petNodes.bodyGroup.rotation.y = 0;
          animStateRef.current = 'idle';
          animTimeRef.current = 0;
        }
      } else if (state === 'bathing') {
        // Cute shake wiggle
        petNodes.bodyGroup.rotation.z = Math.sin(t * 22) * 0.18;
        petNodes.leftEar.rotation.z = Math.sin(t * 25) * 0.25;
        petNodes.rightEar.rotation.z = -Math.sin(t * 25) * 0.25;

        if (t > 1.2) {
          animStateRef.current = 'idle';
          petNodes.bodyGroup.rotation.z = 0;
        }
      }

      // 1) Hamster face always front-facing looking at camera
      const toCam = camera.position.clone().sub(currentPosRef.current);
      const targetRotY = Math.atan2(toCam.x, toCam.z);

      let rotDiff = targetRotY - currentRotYRef.current;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      currentRotYRef.current += rotDiff * 0.18;

      // Apply root positions and front-facing rotation towards camera
      petNodes.root.position.copy(currentPosRef.current);
      petNodes.root.rotation.y = currentRotYRef.current;

      // Soft natural head tracking so face and shiny eyes look directly at the player/camera
      const horizontalDist = Math.max(0.1, Math.sqrt(toCam.x * toCam.x + toCam.z * toCam.z));
      const pitchAngle = Math.atan2(toCam.y - (currentPosRef.current.y + 0.45), horizontalDist);
      const clampedPitch = Math.max(-0.25, Math.min(0.32, pitchAngle));
      if (state !== 'eating' && state !== 'drinking') {
        petNodes.headGroup.rotation.x = -clampedPitch * 0.75;
      }

      // Update particle physics
      particles.update(delta);

      // Render frame
      renderer.render(scene, camera);
    };

    animate();

    // Clean up on unmount
    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
      particles.clear();
    };
  }, [pet.type]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        id="pet-3d-canvas-container"
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Touch-Friendly 3D Bowl Quick Tap Badges (Over Bowls Area) */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 pointer-events-auto">
        <button
          id="btn-3d-bowl-feed"
          onClick={() => {
            soundManager.playPop();
            if (onOpenFeed) onOpenFeed();
          }}
          title="Interact with Food Bowl"
          className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-white/90 backdrop-blur-md border border-amber-300/80 shadow-xs text-[11px] font-bubble font-bold text-amber-900 active:scale-95 transition-transform hover:bg-amber-50"
        >
          <span>🥣</span>
          <span>Feed 🌻</span>
        </button>

        <button
          id="btn-3d-bowl-water"
          onClick={() => {
            soundManager.playPop();
            if (onGiveWater) onGiveWater();
          }}
          title="Interact with Water Bowl"
          className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-white/90 backdrop-blur-md border border-sky-300/80 shadow-xs text-[11px] font-bubble font-bold text-sky-900 active:scale-95 transition-transform hover:bg-sky-50"
        >
          <span>💧</span>
          <span>Water</span>
        </button>
      </div>

      {/* 3D Scene Controls Overlay (Floating Top-Right) */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2 py-1 rounded-2xl border border-amber-200/80 shadow-xs">
        <button
          id="btn-camera-preset-front"
          onClick={() => handleCameraPreset('front')}
          title="Front View"
          className={`p-1.5 rounded-xl transition-all ${
            cameraMode === 'front'
              ? 'bg-amber-500 text-white shadow-xs font-bold'
              : 'text-stone-600 hover:bg-amber-100/60'
          }`}
        >
          <Eye size={14} />
        </button>
        <button
          id="btn-camera-preset-angled"
          onClick={() => handleCameraPreset('angled')}
          title="Angled Room View"
          className={`p-1.5 rounded-xl transition-all ${
            cameraMode === 'angled'
              ? 'bg-amber-500 text-white shadow-xs font-bold'
              : 'text-stone-600 hover:bg-amber-100/60'
          }`}
        >
          <RotateCw size={14} />
        </button>
        <button
          id="btn-camera-preset-top"
          onClick={() => handleCameraPreset('top')}
          title="Top Isometric View"
          className={`p-1.5 rounded-xl transition-all ${
            cameraMode === 'top'
              ? 'bg-amber-500 text-white shadow-xs font-bold'
              : 'text-stone-600 hover:bg-amber-100/60'
          }`}
        >
          <ZoomIn size={14} />
        </button>
      </div>

      {/* Swipe to Rotate Guide Hint (Appears gently at bottom of stage) */}
      <div className="absolute bottom-1 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-stone-500/80 bg-white/60 backdrop-blur-[1px] px-2.5 py-0.5 rounded-full border border-stone-200/50">
        <Sparkles size={10} className="text-amber-500" />
        <span>Drag to rotate 3D room • Tap pet or items</span>
      </div>
    </div>
  );
};
