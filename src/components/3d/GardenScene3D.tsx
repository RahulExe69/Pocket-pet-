import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PetState, PetMood } from '../../types';
import { buildPetModel, PetNodes } from './petGeometries';
import {
  buildGardenEnvironment,
  GardenNodes,
  GardenButterfly,
  CollectibleItem,
  InteractiveGardenObject,
} from './gardenGeometries';
import { PetParticleSystem } from './petParticleSystem';
import { soundManager } from '../../utils/audio';

interface GardenScene3DProps {
  pet: PetState;
  mood: PetMood;
  onCatchButterfly: (butterfly: GardenButterfly) => void;
  onCollectItem: (type: 'coin' | 'star', value: number) => void;
  onInteractObject?: (objectName: string) => void;
  onHamsterClick?: () => void;
  gameActive?: boolean;
}

export const GardenScene3D: React.FC<GardenScene3DProps> = ({
  pet,
  mood,
  onCatchButterfly,
  onCollectItem,
  onInteractObject,
  onHamsterClick,
  gameActive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const petNodesRef = useRef<PetNodes | null>(null);
  const gardenNodesRef = useRef<GardenNodes | null>(null);
  const particlesRef = useRef<PetParticleSystem | null>(null);

  // Hamster movement & animation refs
  const currentPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0.5));
  const targetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0.5));
  const headingRef = useRef<number>(0);
  const animStateRef = useRef<'idle' | 'walking' | 'happy'>('idle');
  const animTimeRef = useRef<number>(0);

  // Watering can & interactive action states
  const wateringActionRef = useRef<{ active: boolean; timer: number; target: THREE.Vector3 } | null>(null);
  const birdBathSplashRef = useRef<{ active: boolean; timer: number } | null>(null);
  const flowerWiggleRef = useRef<{ group: THREE.Group; timer: number } | null>(null);

  // Pulse ring marker for ground tap
  const ringMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);

  // Trigger happy hamster reaction
  const triggerHappyReaction = useCallback(() => {
    animStateRef.current = 'happy';
    animTimeRef.current = 0;
    soundManager.playPurr();
    if (particlesRef.current && petNodesRef.current) {
      particlesRef.current.spawnHearts(
        currentPosRef.current.clone().add(new THREE.Vector3(0, 0.8, 0)),
        5
      );
      particlesRef.current.spawnDanceSparkles(
        currentPosRef.current.clone().add(new THREE.Vector3(0, 0.5, 0)),
        6
      );
    }
  }, []);

  // Main Three.js setup & animation loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe); // Soft sunny sky blue
    sceneRef.current = scene;

    // 2. Camera - comfortable perspective showing garden, path, trees, and hamster
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 40);
    camera.position.set(0, 3.1, 5.2);
    camera.lookAt(0, 0.5, 0.2);
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

    // 4. Lighting - Warm sunny outdoor illumination
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x48bb78, 1.15);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.25);
    sunLight.position.set(4, 7, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 18;
    sunLight.shadow.camera.left = -4.5;
    sunLight.shadow.camera.right = 4.5;
    sunLight.shadow.camera.top = 4.5;
    sunLight.shadow.camera.bottom = -4.5;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    // 5. Garden Environment
    const gardenNodes = buildGardenEnvironment();
    gardenNodesRef.current = gardenNodes;
    scene.add(gardenNodes.group);

    // 6. 3D Pet Hamster (exact matching scale 0.95)
    const petNodes = buildPetModel(pet.type, pet.customization);
    petNodes.root.scale.set(0.95, 0.95, 0.95);
    petNodes.root.position.copy(currentPosRef.current);
    petNodesRef.current = petNodes;
    scene.add(petNodes.root);

    // 7. Particle System
    const particles = new PetParticleSystem();
    particlesRef.current = particles;
    scene.add(particles.group);

    // 8. Floor tap destination indicator marker (pulsing ring)
    const markerGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.14, 0.22, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    ringMatRef.current = ringMat;
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.02;
    markerGroup.add(ringMesh);

    const dotGeo = new THREE.CircleGeometry(0.06, 18);
    dotGeo.rotateX(-Math.PI / 2);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    dotMesh.position.y = 0.025;
    markerGroup.add(dotMesh);

    markerGroupRef.current = markerGroup;
    scene.add(markerGroup);

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Pointer / Click Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!container || !camera) return;
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      // (A) Check Butterflies Raycast
      if (gameActive && gardenNodes.butterflies) {
        for (const bf of gardenNodes.butterflies) {
          if (bf.isCaught) continue;
          // Raycast against butterfly meshes
          const intersects = raycaster.intersectObjects(bf.group.children, true);
          if (intersects.length > 0 || intersects.some((i) => i.distance < 15)) {
            // Check distance to butterfly position for touch friendliness
            const dist = raycaster.ray.distanceToPoint(bf.group.position);
            if (dist < 0.65) {
              catchButterflyInternal(bf);
              return;
            }
          }
        }
      }

      // (B) Check Collectibles (Coins & Stars)
      for (const col of gardenNodes.collectibles) {
        if (col.isCollected) continue;
        const intersects = raycaster.intersectObject(col.collider, false);
        if (intersects.length > 0 || raycaster.ray.distanceToPoint(col.group.position) < 0.5) {
          collectItemInternal(col);
          return;
        }
      }

      // (C) Check Interactive Objects (Watering can, bird bath, flower pot, flowerbeds)
      for (const obj of gardenNodes.interactiveObjects) {
        const intersects = raycaster.intersectObject(obj.collider, false);
        if (intersects.length > 0 || raycaster.ray.distanceToPoint(obj.position) < 0.5) {
          handleInteractiveObjectClick(obj);
          return;
        }
      }

      // (D) Check Pet Click
      if (petNodes) {
        const petHits = raycaster.intersectObjects(petNodes.root.children, true);
        if (petHits.length > 0) {
          triggerHappyReaction();
          if (onHamsterClick) onHamsterClick();
          return;
        }
      }

      // (E) Floor / Walking Path Tap-to-Move
      const groundHits = raycaster.intersectObjects([gardenNodes.groundMesh, ...gardenNodes.pathMeshes], false);
      if (groundHits.length > 0) {
        const hitPoint = groundHits[0].point;
        // Clamp to garden perimeter
        const maxRadius = 3.2;
        const distFromCenter = Math.hypot(hitPoint.x, hitPoint.z);
        if (distFromCenter > maxRadius) {
          hitPoint.x = (hitPoint.x / distFromCenter) * maxRadius;
          hitPoint.z = (hitPoint.z / distFromCenter) * maxRadius;
        }

        targetPosRef.current.set(hitPoint.x, 0, hitPoint.z);
        animStateRef.current = 'walking';
        animTimeRef.current = 0;

        // Position pulse ring marker
        markerGroup.position.set(hitPoint.x, 0.015, hitPoint.z);
        if (ringMatRef.current) ringMatRef.current.opacity = 0.9;
        soundManager.playPop();
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('click', handlePointerDown);
    domEl.addEventListener('touchstart', handlePointerDown, { passive: true });

    // Catch butterfly helper
    const catchButterflyInternal = (bf: GardenButterfly) => {
      bf.isCaught = true;
      soundManager.playPop();

      // Particle sparkles at caught location
      particles.spawnDanceSparkles(bf.group.position.clone(), 8);

      // Animate butterfly disappearing with spin
      bf.group.scale.set(0.01, 0.01, 0.01);

      // Hamster turns and hops with joy
      targetPosRef.current.set(
        Math.max(-2.5, Math.min(2.5, bf.group.position.x * 0.6)),
        0,
        Math.max(-2.2, Math.min(2.2, bf.group.position.z * 0.6))
      );
      triggerHappyReaction();

      onCatchButterfly(bf);

      // Respawn butterfly after 4 seconds
      setTimeout(() => {
        bf.isCaught = false;
        bf.group.position.set(
          (Math.random() - 0.5) * 3.0,
          0.6 + Math.random() * 0.9,
          (Math.random() - 0.5) * 3.0
        );
        bf.group.scale.set(1.2, 1.2, 1.2);
      }, 4000);
    };

    // Collect coin / star helper
    const collectItemInternal = (col: CollectibleItem) => {
      col.isCollected = true;
      col.respawnTime = Date.now() + 8000;
      soundManager.playCoin();

      particles.spawnDanceSparkles(col.group.position.clone(), 6);
      col.group.scale.set(0.01, 0.01, 0.01);

      onCollectItem(col.type, col.value);
      triggerHappyReaction();
    };

    // Interactive object handler
    const handleInteractiveObjectClick = (obj: InteractiveGardenObject) => {
      soundManager.playPop();

      if (obj.type === 'watering-can') {
        wateringActionRef.current = {
          active: true,
          timer: 0,
          target: new THREE.Vector3(-1.3, 0.3, 0.6),
        };
        soundManager.playPurr();
        if (onInteractObject) onInteractObject('Watering the Flowers 💧🌸');
      } else if (obj.type === 'bird-bath') {
        birdBathSplashRef.current = { active: true, timer: 0 };
        particles.spawnWaterDroplets(new THREE.Vector3(1.4, 0.55, 0.4), 6);
        if (onInteractObject) onInteractObject('Bird Bath Splash 🦆💦');
      } else if (obj.type === 'flower-pot') {
        particles.spawnHearts(new THREE.Vector3(0.8, 0.45, 1.4), 4);
        if (onInteractObject) onInteractObject('Sprout Care 🌱✨');
      } else if (obj.type === 'flower') {
        flowerWiggleRef.current = { group: obj.group, timer: 0 };
        particles.spawnDanceSparkles(obj.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 5);
        if (onInteractObject) onInteractObject('Flower Sparkles 🌸✨');
      }
    };

    // 11. Main Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let footstepTimer = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      // Check collectible respawns
      gardenNodes.respawnCollectibles();

      // (A) Update Butterflies Flying
      if (gardenNodes.butterflies) {
        gardenNodes.butterflies.forEach((bf) => {
          if (bf.isCaught) return;

          bf.flightTimer += delta;

          // Wing flapping (14-18 Hz)
          const wingFlap = Math.sin(t * bf.flutterSpeed + bf.phaseOffset) * 0.75;
          bf.leftWing.rotation.y = wingFlap;
          bf.rightWing.rotation.y = -wingFlap;

          // Flight path: Smooth wandering towards target
          const dir = new THREE.Vector3().subVectors(bf.targetPosition, bf.group.position);
          const dist = dir.length();

          if (dist < 0.25 || bf.flightTimer > 5) {
            // Pick new target near flowers or trees
            bf.flightTimer = 0;
            bf.targetPosition.set(
              (Math.random() - 0.5) * 3.4,
              0.55 + Math.random() * 0.9,
              (Math.random() - 0.5) * 3.4
            );
          } else {
            dir.normalize();
            // Undulating wave motion
            const waveY = Math.sin(t * 3.5 + bf.phaseOffset) * 0.008;
            bf.group.position.addScaledVector(dir, bf.speed * delta);
            bf.group.position.y += waveY;

            // Orient butterfly facing flight direction
            const targetYaw = Math.atan2(dir.x, dir.z);
            bf.group.rotation.y = THREE.MathUtils.lerp(bf.group.rotation.y, targetYaw, 0.06);
            bf.group.rotation.z = Math.sin(t * 5.0) * 0.12;
          }
        });
      }

      // (B) Rotate & Bob Collectibles
      gardenNodes.collectibles.forEach((col) => {
        if (!col.isCollected) {
          col.group.rotation.y += delta * 2.2;
          col.group.position.y = col.baseY + Math.sin(t * 3.0 + col.baseY) * 0.04;
        }
      });

      // (C) Tree Foliage Sway (Gentle Garden Breeze)
      gardenNodes.trees.forEach((tr, i) => {
        tr.rotation.z = Math.sin(t * 1.4 + i) * 0.02;
      });

      // (D) Interactive Actions Animation
      if (wateringActionRef.current && wateringActionRef.current.active) {
        const wAction = wateringActionRef.current;
        wAction.timer += delta;
        // Tilt can
        if (wAction.timer < 1.4) {
          gardenNodes.wateringCan.rotation.z = -0.6;
          if (wAction.timer % 0.15 < delta) {
            particles.spawnWaterDroplets(
              gardenNodes.wateringCan.position.clone().add(new THREE.Vector3(0.25, 0.3, 0)),
              3
            );
          }
        } else {
          gardenNodes.wateringCan.rotation.z = 0;
          wAction.active = false;
        }
      }

      if (birdBathSplashRef.current && birdBathSplashRef.current.active) {
        const bSplash = birdBathSplashRef.current;
        bSplash.timer += delta;
        gardenNodes.birdBathWater.scale.set(
          1 + Math.sin(bSplash.timer * 20) * 0.06,
          1 + Math.sin(bSplash.timer * 20) * 0.06,
          1
        );
        if (bSplash.timer > 1.2) {
          bSplash.active = false;
          gardenNodes.birdBathWater.scale.set(1, 1, 1);
        }
      }

      if (flowerWiggleRef.current) {
        const fWiggle = flowerWiggleRef.current;
        fWiggle.timer += delta;
        fWiggle.group.rotation.z = Math.sin(fWiggle.timer * 22) * 0.15;
        if (fWiggle.timer > 0.8) {
          fWiggle.group.rotation.z = 0;
          flowerWiggleRef.current = null;
        }
      }

      // (E) Destination Marker Ring Fade
      if (ringMatRef.current && ringMatRef.current.opacity > 0) {
        ringMatRef.current.opacity = Math.max(0, ringMatRef.current.opacity - delta * 1.5);
      }

      // (F) Pet Hamster Movement & Posture Animation
      if (petNodes) {
        const currentPos = currentPosRef.current;
        const targetPos = targetPosRef.current;
        const distToTarget = currentPos.distanceTo(targetPos);

        if (animStateRef.current === 'walking' && distToTarget > 0.08) {
          // Move towards target
          const moveDir = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
          const moveSpeed = 1.35;
          currentPos.addScaledVector(moveDir, moveSpeed * delta);

          // Face movement direction
          const targetHeading = Math.atan2(moveDir.x, moveDir.z);
          headingRef.current = THREE.MathUtils.lerp(headingRef.current, targetHeading, 0.15);
          petNodes.root.rotation.y = headingRef.current;

          // Cute waddling gait
          const walkStep = Math.sin(t * 14);
          petNodes.bodyGroup.position.y = 0.55 + Math.abs(walkStep) * 0.06;
          petNodes.bodyGroup.rotation.z = walkStep * 0.08;
          petNodes.leftLeg.rotation.x = walkStep * 0.5;
          petNodes.rightLeg.rotation.x = -walkStep * 0.5;
          petNodes.leftArm.rotation.x = -walkStep * 0.4;
          petNodes.rightArm.rotation.x = walkStep * 0.4;

          // Footstep dust
          footstepTimer += delta;
          if (footstepTimer > 0.18) {
            footstepTimer = 0;
            particles.spawnFootstepDust(currentPos.clone());
          }
        } else if (animStateRef.current === 'walking') {
          // Arrived at destination
          animStateRef.current = 'idle';
          animTimeRef.current = 0;
          petNodes.leftLeg.rotation.x = 0;
          petNodes.rightLeg.rotation.x = 0;
          petNodes.leftArm.rotation.x = 0;
          petNodes.rightArm.rotation.x = 0;
          petNodes.bodyGroup.rotation.z = 0;
        }

        // Happy celebration animation
        if (animStateRef.current === 'happy') {
          animTimeRef.current += delta;
          const jumpProgress = Math.min(1, animTimeRef.current / 0.9);
          const jumpHeight = Math.sin(jumpProgress * Math.PI) * 0.55;
          petNodes.bodyGroup.position.y = 0.55 + jumpHeight;
          petNodes.bodyGroup.rotation.y = jumpProgress * Math.PI * 2;

          petNodes.leftArm.rotation.x = Math.sin(t * 22) * 0.8;
          petNodes.rightArm.rotation.x = -Math.sin(t * 22) * 0.8;

          if (jumpProgress >= 1) {
            petNodes.bodyGroup.rotation.y = 0;
            animStateRef.current = 'idle';
            animTimeRef.current = 0;
          }
        } else if (animStateRef.current === 'idle') {
          // Gentle idle breathing
          const breathe = Math.sin(t * 3.0) * 0.02;
          petNodes.bodyGroup.position.y = 0.55 + breathe;
          petNodes.bodyGroup.scale.set(1 + breathe * 0.5, 1 - breathe * 0.3, 1 + breathe * 0.5);

          // Subtle head tilt
          petNodes.headGroup.rotation.z = Math.sin(t * 1.8) * 0.04;
          petNodes.headGroup.rotation.y = Math.sin(t * 1.2) * 0.05;

          // Occasional ear twitch
          petNodes.leftEar.rotation.z = Math.sin(t * 4.5) * 0.05;
          petNodes.rightEar.rotation.z = -Math.sin(t * 4.5) * 0.05;
        }

        petNodes.root.position.copy(currentPos);
      }

      // Update Particle System
      particles.update(delta);

      // Render
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domEl.removeEventListener('click', handlePointerDown);
      domEl.removeEventListener('touchstart', handlePointerDown);
      renderer.dispose();
      scene.clear();
    };
  }, [pet.type, pet.customization, gameActive, onCatchButterfly, onCollectItem, onInteractObject, onHamsterClick, triggerHappyReaction]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[340px] flex items-center justify-center overflow-hidden select-none cursor-pointer"
      title="Garden: Tap butterflies to catch them! Tap ground to walk! Tap coins & flowers!"
    />
  );
};
