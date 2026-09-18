import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PetState, PetMood, MultiplayerPlayer, MultiplayerMiniGameType } from '../../types';
import { buildPetModel, PetNodes, buildCustomizationItems } from './petGeometries';
import { buildRoomEnvironment, RoomNodes, populateFoodBowl } from './roomGeometries';
import { PetParticleSystem } from './petParticleSystem';
import { createPetNameTagSprite, createHamsterPlayBall } from './threeHelpers';
import { soundManager } from '../../utils/audio';
import { RotateCw, ZoomIn, Eye, Sparkles } from 'lucide-react';

export type AnimationState =
  | 'idle'
  | 'walking'
  | 'eating'
  | 'drinking'
  | 'sleeping'
  | 'happy'
  | 'bathing'
  | 'dance'
  | 'sing';

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
  danceTrigger?: { timestamp: number } | null;
  singTrigger?: { timestamp: number } | null;
  onEatingComplete?: () => void;
  onDrinkingComplete?: () => void;
  onDanceComplete?: () => void;
  onSingComplete?: () => void;
  isBathing?: boolean;
  cleanProgress?: number;
  interactive?: boolean;
  friendPet?: MultiplayerPlayer | null;
  onTapFloorMove?: (pos: { x: number; z: number }) => void;
  activeGame?: MultiplayerMiniGameType | null;
  isTalking?: boolean;
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
  danceTrigger,
  singTrigger,
  onEatingComplete,
  onDrinkingComplete,
  onDanceComplete,
  onSingComplete,
  isBathing = false,
  cleanProgress = 0,
  interactive = true,
  friendPet = null,
  onTapFloorMove,
  activeGame = null,
  isTalking = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const petNodesRef = useRef<PetNodes | null>(null);
  const roomNodesRef = useRef<RoomNodes | null>(null);
  const particlesRef = useRef<PetParticleSystem | null>(null);

  // Friend Hamster 3D Refs (Multiplayer in same pink room)
  const friendNodesRef = useRef<PetNodes | null>(null);
  const friendCurrentPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0.8, 0, 0.4));
  const friendTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0.8, 0, 0.4));
  const friendHeadingRef = useRef<number>(0);
  const friendNameTagRef = useRef<THREE.Sprite | null>(null);
  const playerNameTagRef = useRef<THREE.Sprite | null>(null);
  const ballGroupRef = useRef<THREE.Group | null>(null);

  // Animation controller refs
  const animStateRef = useRef<AnimationState>('idle');
  const animTimeRef = useRef<number>(0);
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0.2));
  const currentPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0.2));
  const currentRotYRef = useRef<number>(0);
  const isWalkingRef = useRef<boolean>(false);
  const lastStateChangeRef = useRef<number>(Date.now());
  const blinkTimerRef = useRef<number>(2.0);
  const activeIntentRef = useRef<'none' | 'food' | 'water'>('none');

  // Stable callbacks container for animation loop
  const callbacksRef = useRef({ onEatingComplete, onDrinkingComplete, onDanceComplete, onSingComplete });
  useEffect(() => {
    callbacksRef.current = { onEatingComplete, onDrinkingComplete, onDanceComplete, onSingComplete };
  });

  // Floor target marker ref
  const floorMarkerRef = useRef<{ ring: THREE.Mesh; dot: THREE.Mesh; life: number } | null>(null);
  const lastNoteSpawnTimeRef = useRef<number>(0);

  // Camera Orbit State - balanced framing showing hamster centered in foreground with surrounding 3D room
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0,
    phi: 0.46,
    radius: 5.4,
  });
  const targetAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0,
    phi: 0.46,
    radius: 5.4,
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

  // Trigger dancing animation (music, spins, groove)
  const triggerDanceAnimation = useCallback(() => {
    if (animStateRef.current === 'sleeping') {
      animStateRef.current = 'idle';
    }
    soundManager.stopAllMusic();
    soundManager.playDanceMusic();
    animStateRef.current = 'dance';
    animTimeRef.current = 0;
    isWalkingRef.current = false;
    if (particlesRef.current && petNodesRef.current) {
      particlesRef.current.spawnDanceSparkles(
        petNodesRef.current.root.position.clone().add(new THREE.Vector3(0, 0.4, 0)),
        8
      );
    }
  }, []);

  // Trigger singing animation (song, mouth movement, music notes)
  const triggerSingAnimation = useCallback(() => {
    if (animStateRef.current === 'sleeping') {
      animStateRef.current = 'idle';
    }
    soundManager.stopAllMusic();
    soundManager.playSingSong();
    animStateRef.current = 'sing';
    animTimeRef.current = 0;
    isWalkingRef.current = false;
    lastNoteSpawnTimeRef.current = 0;
    if (particlesRef.current && petNodesRef.current) {
      particlesRef.current.spawnMusicNotes(
        petNodesRef.current.root.position.clone().add(new THREE.Vector3(0, 0.95, 0.2)),
        2
      );
    }
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

  // Watch external Dance Trigger
  useEffect(() => {
    if (!danceTrigger) return;
    triggerDanceAnimation();
  }, [danceTrigger, triggerDanceAnimation]);

  // Watch external Sing Trigger
  useEffect(() => {
    if (!singTrigger) return;
    triggerSingAnimation();
  }, [singTrigger, triggerSingAnimation]);

  // Watch isTalking state to control mouth animation and posture reset
  const isTalkingRef = useRef<boolean>(false);
  useEffect(() => {
    isTalkingRef.current = !!isTalking;
    if (!isTalking && petNodesRef.current) {
      petNodesRef.current.mouthGroup.scale.set(0.9, 0.22, 0.7);
      petNodesRef.current.mouthGroup.position.set(0, 0.022, 0.636);
      petNodesRef.current.cheeksGroup.scale.set(1, 1, 1);
      petNodesRef.current.leftArm.rotation.set(0, 0, 0);
      petNodesRef.current.rightArm.rotation.set(0, 0, 0);
      petNodesRef.current.headGroup.rotation.set(0, 0, 0);
      petNodesRef.current.leftEye.scale.y = 1.05;
      petNodesRef.current.rightEye.scale.y = 1.05;
    }
  }, [isTalking]);

  // Camera presets
  const handleCameraPreset = (mode: 'front' | 'angled' | 'top') => {
    setCameraMode(mode);
    soundManager.playPop();
    if (mode === 'front') {
      targetAngleRef.current = { theta: 0, phi: 0.46, radius: 5.4 };
    } else if (mode === 'angled') {
      targetAngleRef.current = { theta: 0.42, phi: 0.52, radius: 5.8 };
    } else if (mode === 'top') {
      targetAngleRef.current = { theta: -0.25, phi: 0.80, radius: 6.2 };
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
        targetPosRef.current.set(0, 0, 0.2);
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

  // Sync friend hamster 3D model and name tag in the pink room
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (friendPet) {
      if (!friendNodesRef.current || friendNodesRef.current.root.userData.petId !== friendPet.petId) {
        if (friendNodesRef.current) {
          scene.remove(friendNodesRef.current.root);
          friendNodesRef.current = null;
        }

        const fNodes = buildPetModel(friendPet.petType || 'hamster', friendPet.customization || { accessory: 'bow-pink' });
        fNodes.root.scale.set(0.95, 0.95, 0.95);
        fNodes.root.userData.petId = friendPet.petId;
        friendNodesRef.current = fNodes;

        const spawnPos = new THREE.Vector3(friendPet.position?.x ?? 0.8, 0, friendPet.position?.z ?? 0.4);
        friendCurrentPosRef.current.copy(spawnPos);
        friendTargetPosRef.current.copy(spawnPos);
        fNodes.root.position.copy(spawnPos);

        // Add 3D Billboard Name Tag for friend's hamster
        const friendTag = createPetNameTagSprite(friendPet.petName, friendPet.petId, true);
        friendNameTagRef.current = friendTag;
        fNodes.root.add(friendTag);

        scene.add(fNodes.root);

        // Add host's name tag if not present
        if (petNodesRef.current && !playerNameTagRef.current) {
          const playerTag = createPetNameTagSprite(pet.name, pet.id, false);
          playerNameTagRef.current = playerTag;
          petNodesRef.current.root.add(playerTag);
        }
      }
    } else {
      if (friendNodesRef.current) {
        scene.remove(friendNodesRef.current.root);
        friendNodesRef.current = null;
      }
      if (playerNameTagRef.current && petNodesRef.current) {
        petNodesRef.current.root.remove(playerNameTagRef.current);
        playerNameTagRef.current = null;
      }
    }
  }, [friendPet?.petId, friendPet?.petName, friendPet?.petType, pet.name, pet.id]);

  // Sync friend target position
  useEffect(() => {
    if (!friendPet) return;
    if (friendPet.targetPosition) {
      friendTargetPosRef.current.set(friendPet.targetPosition.x, 0, friendPet.targetPosition.z);
    } else if (friendPet.position) {
      friendTargetPosRef.current.set(friendPet.position.x, 0, friendPet.position.z);
    }
  }, [friendPet?.position?.x, friendPet?.position?.z, friendPet?.targetPosition?.x, friendPet?.targetPosition?.z]);

  // Sync Ball Play 3D toy ball
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (activeGame === 'ball-play') {
      if (!ballGroupRef.current) {
        const ball = createHamsterPlayBall();
        ball.position.set(0, 0, 0);
        ballGroupRef.current = ball;
        scene.add(ball);
      }
    } else {
      if (ballGroupRef.current) {
        scene.remove(ballGroupRef.current);
        ballGroupRef.current = null;
      }
    }
  }, [activeGame]);

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

    // 2. Camera - balanced perspective showing hamster and room environment
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 30);
    camera.position.set(0, 2.8, 5.4);
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

    // 5. Build 3D Pet - cute, naturally proportioned, fully visible from head to body
    const petNodes = buildPetModel(pet.type, pet.customization);
    petNodes.root.scale.set(0.95, 0.95, 0.95);
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

    // 7. Floor tap destination indicator marker (pulse ring + inner dot)
    const markerGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.14, 0.22, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.015;

    const dotGeo = new THREE.CircleGeometry(0.07, 20);
    dotGeo.rotateX(-Math.PI / 2);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    dotMesh.position.y = 0.016;

    markerGroup.add(ringMesh);
    markerGroup.add(dotMesh);
    scene.add(markerGroup);
    floorMarkerRef.current = { ring: ringMesh, dot: dotMesh, life: 0 };

    // 8. Raycaster for clicking 3D objects and tap-to-move
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Touch / Mouse handlers for Orbit Camera & Object Clicking
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      hasMovedPointerRef.current = false;
      startPointerRef.current = { x: e.clientX, y: e.clientY };
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;

      const totalDist = Math.hypot(
        e.clientX - startPointerRef.current.x,
        e.clientY - startPointerRef.current.y
      );
      if (totalDist > 9) {
        hasMovedPointerRef.current = true;
      }

      // Rotate camera around room
      targetAngleRef.current.theta -= dx * 0.007;
      targetAngleRef.current.phi = Math.max(
        0.2,
        Math.min(0.95, targetAngleRef.current.phi + dy * 0.005)
      );

      // Clamp theta so player stays within pleasant room viewing cone (-0.85 to +0.85 rad)
      targetAngleRef.current.theta = Math.max(-0.85, Math.min(0.85, targetAngleRef.current.theta));

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;

      // If user tapped without dragging, raycast to interact or walk
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
            // Wake up if tapped pet in bed
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

        // 1) Tap to Move anywhere on the floor!
        const floorIntersects = raycaster.intersectObject(roomNodes.floorMesh);
        let floorPoint: THREE.Vector3 | null = null;
        if (floorIntersects.length > 0) {
          floorPoint = floorIntersects[0].point;
        } else {
          // Raycast fallback to the Y=0 room floor plane
          const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hit = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(floorPlane, hit)) {
            if (Math.abs(hit.x) <= 2.2 && Math.abs(hit.z) <= 2.2) {
              floorPoint = hit;
            }
          }
        }

        if (floorPoint) {
          // Clamp inside playable room boundary so hamster stays inside walls comfortably
          const targetX = Math.max(-1.85, Math.min(1.85, floorPoint.x));
          const targetZ = Math.max(-1.85, Math.min(1.85, floorPoint.z));

          soundManager.stopAllMusic();
          if (pet.isSleeping && onToggleSleep) {
            onToggleSleep();
          }

          targetPosRef.current.set(targetX, 0, targetZ);
          animStateRef.current = 'walking';
          isWalkingRef.current = true;
          animTimeRef.current = 0;
          soundManager.playPop();

          if (onTapFloorMove) {
            onTapFloorMove({ x: targetX, z: targetZ });
          }

          // Show animated destination floor marker
          if (floorMarkerRef.current) {
            floorMarkerRef.current.ring.position.set(targetX, 0.015, targetZ);
            floorMarkerRef.current.dot.position.set(targetX, 0.016, targetZ);
            floorMarkerRef.current.ring.scale.set(1, 1, 1);
            floorMarkerRef.current.dot.scale.set(1, 1, 1);
            (floorMarkerRef.current.ring.material as THREE.MeshBasicMaterial).opacity = 0.9;
            (floorMarkerRef.current.dot.material as THREE.MeshBasicMaterial).opacity = 1.0;
            floorMarkerRef.current.life = 1.0;
          }
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
      camera.position.set(camX, camY + 0.4, camZ);
      camera.lookAt(0, 0.65, 0.1);

      // Hamster always standing front center: gently return to front if displaced
      if (
        !pet.isSleeping &&
        animStateRef.current === 'idle' &&
        currentPosRef.current.distanceTo(new THREE.Vector3(0, 0, 0.2)) > 0.15 &&
        !isWalkingRef.current
      ) {
        targetPosRef.current.set(0, 0, 0.2);
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

      // Update floor marker animation
      if (floorMarkerRef.current && floorMarkerRef.current.life > 0) {
        floorMarkerRef.current.life -= delta * 0.9;
        const pulse = 1.0 + Math.sin(t * 10) * 0.15;
        floorMarkerRef.current.ring.scale.set(pulse, 1, pulse);
        const opacity = Math.max(0, floorMarkerRef.current.life);
        (floorMarkerRef.current.ring.material as THREE.MeshBasicMaterial).opacity = opacity * 0.85;
        (floorMarkerRef.current.dot.material as THREE.MeshBasicMaterial).opacity = opacity;
        if (floorMarkerRef.current.life <= 0) {
          (floorMarkerRef.current.ring.material as THREE.MeshBasicMaterial).opacity = 0;
          (floorMarkerRef.current.dot.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // Pet position interpolation & walking waddle
      const distToTarget = currentPosRef.current.distanceTo(targetPosRef.current);

      if (isWalkingRef.current && distToTarget > 0.06) {
        const moveDir = targetPosRef.current.clone().sub(currentPosRef.current).normalize();
        const speed = Math.min(1.6, Math.max(0.45, distToTarget * 1.9));
        currentPosRef.current.addScaledVector(moveDir, speed * delta);

        // Turn towards movement direction
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetAngle - currentRotYRef.current;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        currentRotYRef.current += diff * 0.22;

        // Cute waddle animation with speed-adjusted tempo
        const walkFreq = 14;
        const waddleBob = Math.abs(Math.sin(t * walkFreq)) * 0.12;
        petNodes.bodyGroup.position.y = 0.55 + waddleBob;
        petNodes.bodyGroup.rotation.z = Math.sin(t * walkFreq) * 0.12;
        petNodes.bodyGroup.rotation.x = 0.08;

        // Legs swinging
        petNodes.leftLeg.rotation.x = Math.sin(t * walkFreq) * 0.65;
        petNodes.rightLeg.rotation.x = -Math.sin(t * walkFreq) * 0.65;

        // Arms swinging
        petNodes.leftArm.rotation.x = -Math.sin(t * walkFreq) * 0.45;
        petNodes.rightArm.rotation.x = Math.sin(t * walkFreq) * 0.45;

        // Ear wiggles
        petNodes.leftEar.rotation.z = Math.sin(t * walkFreq) * 0.16;
        petNodes.rightEar.rotation.z = -Math.sin(t * walkFreq) * 0.16;

        // Step dust puff
        if (t % 0.28 < 0.04) {
          particles.spawnFootstepDust(currentPosRef.current.clone().add(new THREE.Vector3(0, 0, -0.08)));
        }
      } else if (isWalkingRef.current) {
        // Reached destination!
        isWalkingRef.current = false;
        petNodes.leftLeg.rotation.x = 0;
        petNodes.rightLeg.rotation.x = 0;
        petNodes.leftArm.rotation.x = 0;
        petNodes.rightArm.rotation.x = 0;
        petNodes.bodyGroup.rotation.z = 0;
        petNodes.bodyGroup.rotation.x = 0;

        if (floorMarkerRef.current) {
          floorMarkerRef.current.life = Math.min(floorMarkerRef.current.life, 0.2);
        }

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
      } else if (state === 'dance') {
        // Multi-phase dance choreography with music, spins, and sparkles!
        if (t < 1.2) {
          // Phase 1: Bouncy side-to-side groove
          const bounce = Math.abs(Math.sin(t * 12)) * 0.16;
          petNodes.bodyGroup.position.y = 0.55 + bounce;
          petNodes.bodyGroup.position.x = Math.sin(t * 10) * 0.15;
          petNodes.bodyGroup.rotation.z = Math.sin(t * 10) * 0.16;

          petNodes.leftArm.rotation.x = -1.2 + Math.sin(t * 14) * 0.5;
          petNodes.rightArm.rotation.x = -1.2 - Math.sin(t * 14) * 0.5;

          petNodes.leftLeg.rotation.x = Math.sin(t * 12) * 0.4;
          petNodes.rightLeg.rotation.x = -Math.sin(t * 12) * 0.4;

          petNodes.leftEar.rotation.z = Math.sin(t * 16) * 0.35;
          petNodes.rightEar.rotation.z = -Math.sin(t * 16) * 0.35;

          if (t % 0.35 < delta) {
            particles.spawnDanceSparkles(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.4, 0)), 4);
          }
        } else if (t < 2.4) {
          // Phase 2: Joyful leap & full 360 Spin!
          const spinProgress = (t - 1.2) / 1.2;
          const jumpHeight = Math.sin(spinProgress * Math.PI) * 0.7;
          petNodes.bodyGroup.position.y = 0.55 + jumpHeight;
          petNodes.bodyGroup.position.x = 0;
          petNodes.bodyGroup.rotation.z = 0;
          // Full 360 degree spin
          petNodes.bodyGroup.rotation.y = spinProgress * Math.PI * 2;

          petNodes.leftArm.rotation.x = -1.5;
          petNodes.rightArm.rotation.x = -1.5;
          petNodes.leftLeg.rotation.x = 0.3;
          petNodes.rightLeg.rotation.x = -0.3;

          if (t - delta < 1.25) {
            particles.spawnDanceSparkles(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.7, 0)), 8);
          }
        } else if (t < 3.2) {
          // Phase 3: Fast foot-tap shuffle and head bop
          petNodes.bodyGroup.rotation.y = 0;
          petNodes.bodyGroup.position.x = 0;
          petNodes.bodyGroup.position.y = 0.55 + Math.abs(Math.sin(t * 18)) * 0.1;
          petNodes.bodyGroup.rotation.z = Math.sin(t * 16) * 0.14;

          petNodes.headGroup.rotation.z = Math.sin(t * 14) * 0.18;
          petNodes.leftLeg.rotation.x = Math.sin(t * 22) * 0.55;
          petNodes.rightLeg.rotation.x = -Math.sin(t * 22) * 0.55;

          petNodes.leftArm.rotation.x = -0.6 + Math.sin(t * 18) * 0.4;
          petNodes.rightArm.rotation.x = -0.6 - Math.sin(t * 18) * 0.4;
        } else if (t < 4.2) {
          // Phase 4: Reverse 360 Spin Leap!
          const spinProgress2 = (t - 3.2) / 1.0;
          const jumpHeight2 = Math.sin(spinProgress2 * Math.PI) * 0.65;
          petNodes.bodyGroup.position.y = 0.55 + jumpHeight2;
          // Reverse 360 degree spin
          petNodes.bodyGroup.rotation.y = -spinProgress2 * Math.PI * 2;

          petNodes.leftArm.rotation.x = -1.5;
          petNodes.rightArm.rotation.x = -1.5;

          if (t - delta < 3.25) {
            particles.spawnDanceSparkles(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.7, 0)), 8);
          }
        } else {
          // Dance completed!
          petNodes.bodyGroup.rotation.y = 0;
          petNodes.bodyGroup.rotation.z = 0;
          petNodes.bodyGroup.position.x = 0;
          petNodes.bodyGroup.position.y = 0.55;
          petNodes.leftArm.rotation.x = 0;
          petNodes.rightArm.rotation.x = 0;
          petNodes.leftLeg.rotation.x = 0;
          petNodes.rightLeg.rotation.x = 0;
          petNodes.headGroup.rotation.z = 0;

          animStateRef.current = 'happy';
          animTimeRef.current = 0;
          soundManager.playSqueak();
          particles.spawnHearts(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.8, 0)), 6);
          callbacksRef.current.onDanceComplete?.();
        }
      } else if (state === 'sing') {
        // Sings cute song with animated mouth and floating musical notes!
        // 1. Mouth opening & closing in sync with notes
        const mouthPulse = Math.pow(Math.abs(Math.sin(t * 10)), 1.4);
        petNodes.mouthGroup.scale.set(
          1.0 + mouthPulse * 0.35,
          0.3 + mouthPulse * 1.8,
          0.7 + mouthPulse * 0.4
        );
        petNodes.mouthGroup.position.y = 0.022 - mouthPulse * 0.012;

        // Cheeks puff with vocal notes
        petNodes.cheeksGroup.scale.set(1.0 + mouthPulse * 0.22, 1.0, 1.0);

        // Vocalist cute posture: arms holding hands near chest
        petNodes.leftArm.rotation.x = -0.85 + Math.sin(t * 5) * 0.12;
        petNodes.rightArm.rotation.x = -0.85 - Math.sin(t * 5) * 0.12;
        petNodes.leftArm.rotation.z = 0.28;
        petNodes.rightArm.rotation.z = -0.28;

        // Head swaying passionately to melody
        petNodes.headGroup.rotation.z = Math.sin(t * 4.2) * 0.14;
        petNodes.headGroup.rotation.x = -0.16 + Math.sin(t * 8) * 0.08;

        // Body gentle sway & bob
        petNodes.bodyGroup.rotation.z = Math.sin(t * 4.2) * 0.06;
        petNodes.bodyGroup.position.y = 0.55 + Math.sin(t * 6) * 0.035;

        // Ears perk up and wiggle sweetly
        petNodes.leftEar.rotation.z = Math.sin(t * 7) * 0.15;
        petNodes.rightEar.rotation.z = -Math.sin(t * 7) * 0.15;

        // Spawn musical note particle on each note (~every 0.38s)
        if (t - lastNoteSpawnTimeRef.current >= 0.38) {
          lastNoteSpawnTimeRef.current = t;
          particles.spawnMusicNotes(
            currentPosRef.current.clone().add(new THREE.Vector3(0, 0.95, 0.2)),
            1
          );
        }

        if (t > 4.2) {
          // Finished singing!
          petNodes.mouthGroup.scale.set(0.9, 0.22, 0.7);
          petNodes.mouthGroup.position.set(0, 0.022, 0.636);
          petNodes.cheeksGroup.scale.set(1, 1, 1);
          petNodes.leftArm.rotation.set(0, 0, 0);
          petNodes.rightArm.rotation.set(0, 0, 0);
          petNodes.headGroup.rotation.set(0, 0, 0);
          petNodes.bodyGroup.rotation.set(0, 0, 0);

          animStateRef.current = 'happy';
          animTimeRef.current = 0;
          soundManager.playSqueak();
          particles.spawnHearts(currentPosRef.current.clone().add(new THREE.Vector3(0, 0.8, 0)), 6);
          callbacksRef.current.onSingComplete?.();
        }
      }

      // 1) Face camera smoothly when NOT walking and NOT in dance spinning state
      if (!isWalkingRef.current && state !== 'dance') {
        const toCam = camera.position.clone().sub(currentPosRef.current);
        const targetRotY = Math.atan2(toCam.x, toCam.z);

        let rotDiff = targetRotY - currentRotYRef.current;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        currentRotYRef.current += rotDiff * 0.15;

        // Soft natural head tracking so face and shiny eyes look directly at the player/camera
        const horizontalDist = Math.max(0.1, Math.sqrt(toCam.x * toCam.x + toCam.z * toCam.z));
        const pitchAngle = Math.atan2(toCam.y - (currentPosRef.current.y + 0.45), horizontalDist);
        const clampedPitch = Math.max(-0.25, Math.min(0.32, pitchAngle));
        petNodes.headGroup.rotation.x = -clampedPitch * 0.75;
      }

      // Talking mouth animation & expressive cute natural posture
      if (
        isTalkingRef.current &&
        !pet.isSleeping &&
        state !== 'dance'
      ) {
        // Natural syllable rhythm with multi-frequency harmonic articulation
        const syllableMotion = Math.sin(t * 11.0) * 0.55 + Math.sin(t * 16.5) * 0.25 + 0.2;
        const talkPulse = Math.max(0.04, Math.min(0.85, syllableMotion));

        // Smooth, natural mouth opening without exaggeration
        petNodes.mouthGroup.scale.set(
          0.92 + talkPulse * 0.22,
          0.26 + talkPulse * 0.62,
          0.70 + talkPulse * 0.12
        );
        petNodes.mouthGroup.position.y = 0.022 - talkPulse * 0.007;
        petNodes.cheeksGroup.scale.set(1.0 + talkPulse * 0.08, 1.0, 1.0);

        // Subtle conversational blinking synchronized during speech
        const speechBlinkCycle = (t * 0.45) % 1.0;
        if (speechBlinkCycle > 0.94) {
          // Soft 120ms natural eyelid dip
          petNodes.leftEye.scale.y = 0.12;
          petNodes.rightEye.scale.y = 0.12;
        } else {
          petNodes.leftEye.scale.y = 1.05;
          petNodes.rightEye.scale.y = 1.05;
        }

        // Small, subtle head movements (inquisitive micro-tilt, micro-nod, and micro-turn)
        const headTiltZ = Math.sin(t * 3.2) * 0.035 + Math.sin(t * 1.8) * 0.015;
        const headNodX = Math.sin(t * 5.2) * 0.022;
        const headTurnY = Math.sin(t * 2.2) * 0.028;

        petNodes.headGroup.rotation.z = headTiltZ;
        petNodes.headGroup.rotation.y = headTurnY;
        petNodes.headGroup.rotation.x += headNodX;

        // Gentle relaxed paws posture
        petNodes.leftArm.rotation.x = -0.35 + Math.sin(t * 3.6) * 0.06;
        petNodes.rightArm.rotation.x = -0.35 - Math.sin(t * 3.6) * 0.06;

        // Subtle gentle ear twitches
        petNodes.leftEar.rotation.z = Math.sin(t * 4.2) * 0.04;
        petNodes.rightEar.rotation.z = -Math.sin(t * 4.2) * 0.04;
      }

      // Apply root positions and heading rotation
      petNodes.root.position.copy(currentPosRef.current);
      petNodes.root.rotation.y = currentRotYRef.current;

      // Animate Friend Hamster (Multiplayer in same pink room)
      if (friendNodesRef.current && friendPet) {
        const fNodes = friendNodesRef.current;
        const fTarget = friendTargetPosRef.current;
        const fPos = friendCurrentPosRef.current;

        const fDist = fPos.distanceTo(fTarget);
        if (fDist > 0.05) {
          const fDir = new THREE.Vector3().subVectors(fTarget, fPos).normalize();
          const fSpeed = Math.min(fDist * 3.0, 1.8);
          fPos.addScaledVector(fDir, fSpeed * delta);
          fNodes.root.position.copy(fPos);

          const targetAngle = Math.atan2(fDir.x, fDir.z);
          let diff = targetAngle - friendHeadingRef.current;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          friendHeadingRef.current += diff * 0.18;
          fNodes.root.rotation.y = friendHeadingRef.current;

          const fStep = clock.getElapsedTime() * 14;
          fNodes.leftLeg.rotation.x = Math.sin(fStep) * 0.45;
          fNodes.rightLeg.rotation.x = -Math.sin(fStep) * 0.45;
          fNodes.leftArm.rotation.x = -Math.sin(fStep) * 0.35;
          fNodes.rightArm.rotation.x = Math.sin(fStep) * 0.35;
          fNodes.bodyGroup.position.y = 0.55 + Math.abs(Math.sin(fStep)) * 0.05;
        } else {
          const fIdleTime = clock.getElapsedTime();
          fNodes.bodyGroup.position.y = 0.55 + Math.sin(fIdleTime * 3.2 + 1.2) * 0.025;
          fNodes.leftLeg.rotation.x = 0;
          fNodes.rightLeg.rotation.x = 0;
          fNodes.leftArm.rotation.x = 0;
          fNodes.rightArm.rotation.x = 0;
        }

        // Friend special action sync
        if (friendPet.action === 'dance') {
          const fDanceTime = clock.getElapsedTime() * 6;
          fNodes.root.rotation.y += 0.14;
          fNodes.bodyGroup.position.y = 0.65 + Math.abs(Math.sin(fDanceTime)) * 0.22;
          fNodes.leftArm.rotation.z = Math.sin(fDanceTime) * 0.5;
          fNodes.rightArm.rotation.z = -Math.sin(fDanceTime) * 0.5;
        } else if (friendPet.action === 'sing') {
          const fSingTime = clock.getElapsedTime() * 8;
          fNodes.mouthGroup.scale.set(1.1, 0.4 + Math.abs(Math.sin(fSingTime)) * 1.6, 0.8);
          fNodes.mouthGroup.visible = true;
        }
      }

      // Animate Ball Play 3D toy ball
      if (ballGroupRef.current) {
        const ballTime = clock.getElapsedTime();
        ballGroupRef.current.position.y = 0.04 + Math.abs(Math.sin(ballTime * 3.2)) * 0.28;
        ballGroupRef.current.rotation.y += 0.025;
        ballGroupRef.current.rotation.x += 0.02;
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
      soundManager.stopAllMusic();
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

      {/* 3D Scene Controls Overlay (Floating Top-Right) */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-0.5 rounded-xl border border-pink-200/90 shadow-xs">
        <button
          id="btn-camera-preset-front"
          onClick={() => handleCameraPreset('front')}
          title="Front View"
          className={`p-1 rounded-lg transition-all ${
            cameraMode === 'front'
              ? 'bg-pink-500 text-white shadow-xs font-bold'
              : 'text-stone-600 hover:bg-pink-100/60'
          }`}
        >
          <Eye size={13} />
        </button>
        <button
          id="btn-camera-preset-angled"
          onClick={() => handleCameraPreset('angled')}
          title="Angled Room View"
          className={`p-1 rounded-lg transition-all ${
            cameraMode === 'angled'
              ? 'bg-pink-500 text-white shadow-xs font-bold'
              : 'text-stone-600 hover:bg-pink-100/60'
          }`}
        >
          <RotateCw size={13} />
        </button>
        <button
          id="btn-camera-preset-top"
          onClick={() => handleCameraPreset('top')}
          title="Top Isometric View"
          className={`p-1 rounded-lg transition-all ${
            cameraMode === 'top'
              ? 'bg-pink-500 text-white shadow-xs font-bold'
              : 'text-stone-600 hover:bg-pink-100/60'
          }`}
        >
          <ZoomIn size={13} />
        </button>
      </div>

      {/* Swipe to Rotate & Tap to Move Guide Hint */}
      <div className="absolute bottom-1 pointer-events-none z-10 flex items-center gap-1 text-[10px] font-bold text-stone-600/90 bg-white/80 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-pink-200/60 shadow-xs">
        <Sparkles size={9} className="text-pink-500" />
        <span>Tap floor to walk • Drag to rotate</span>
      </div>
    </div>
  );
};
