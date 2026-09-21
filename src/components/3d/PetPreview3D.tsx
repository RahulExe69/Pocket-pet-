import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PetType } from '../../types';
import { buildPetModel, PetNodes } from './petGeometries';
import { loadGLTFPet, buildGLTFPetNodes } from './petModelLoader';

interface PetPreview3DProps {
  type: PetType;
}

export const PetPreview3D: React.FC<PetPreview3DProps> = ({ type }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 220;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 20);
    camera.position.set(0, 1.2, 3.2);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    container.replaceChildren(renderer.domElement);

    // Soft lighting
    const ambient = new THREE.AmbientLight(0xfff8ee, 1.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffe6c2, 1.8);
    dirLight.position.set(2, 4, 3);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.6);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);

    // Display pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.14, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xffeaa7,
      roughness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.07;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Initial procedural pet model (NO sprout/leaf accessory on hamster or any pet)
    let activePetNodes: PetNodes = buildPetModel(type, {});
    scene.add(activePetNodes.root);

    let isDisposed = false;

    // Load authentic 3D GLTF textured model (NO sprout/leaf accessory)
    loadGLTFPet(type).then((gltf) => {
      if (gltf && !isDisposed) {
        const gltfPetNodes = buildGLTFPetNodes(gltf, type, {});
        gltfPetNodes.root.rotation.y = activePetNodes.root.rotation.y;
        scene.remove(activePetNodes.root);
        activePetNodes = gltfPetNodes;
        scene.add(activePetNodes.root);
      }
    });

    // Interactive Dragging & Rotation State
    let isDragging = false;
    let startPointerX = 0;
    let startPointerY = 0;
    let isRotating = false;
    let hasDecidedDirection = false;
    let currentRotationY = 0;
    let targetRotationY = 0;
    let lastInteractionTime = Date.now();

    const domElement = renderer.domElement;
    domElement.style.touchAction = 'pan-y';
    domElement.style.cursor = 'grab';

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      lastInteractionTime = Date.now();

      if (e.pointerType === 'mouse') {
        isRotating = true;
        hasDecidedDirection = true;
        domElement.style.cursor = 'grabbing';
      } else {
        isRotating = false;
        hasDecidedDirection = false;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startPointerX;
      const deltaY = e.clientY - startPointerY;

      if (!hasDecidedDirection && e.pointerType === 'touch') {
        if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
          hasDecidedDirection = true;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal drag -> rotate 3D pet
            isRotating = true;
            domElement.style.cursor = 'grabbing';
            try {
              domElement.setPointerCapture(e.pointerId);
            } catch {}
          } else {
            // Vertical swipe -> yield to native page scroll
            isDragging = false;
            isRotating = false;
            return;
          }
        } else {
          return;
        }
      }

      if (isRotating) {
        startPointerX = e.clientX;
        targetRotationY += deltaX * 0.015;
        lastInteractionTime = Date.now();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging || isRotating) {
        isDragging = false;
        isRotating = false;
        hasDecidedDirection = false;
        domElement.style.cursor = 'grab';
        try {
          domElement.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth dampening to target rotation
      currentRotationY += (targetRotationY - currentRotationY) * 0.15;

      // Gentle auto-rotation kicks in after 2 seconds of inactivity
      if (!isRotating && Date.now() - lastInteractionTime > 2000) {
        targetRotationY += 0.008;
      }

      if (activePetNodes) {
        activePetNodes.root.rotation.y = currentRotationY;

        // Breathing bob
        const breathe = Math.sin(elapsed * 3.5) * 0.02;
        activePetNodes.bodyGroup.position.y = 0.55 + breathe;

        // Ear gentle twitch
        activePetNodes.leftEar.rotation.z = Math.sin(elapsed * 2) * 0.05;
        activePetNodes.rightEar.rotation.z = -Math.sin(elapsed * 2) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
    };
  }, [type]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center select-none touch-pan-y"
    />
  );
};
