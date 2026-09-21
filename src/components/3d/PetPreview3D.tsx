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

    const width = container.clientWidth || 190;
    const height = container.clientHeight || 190;

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
    const ambient = new THREE.AmbientLight(0xfff8ee, 1.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffe6c2, 1.8);
    dirLight.position.set(2, 4, 3);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.6);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);

    // Cute small display pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.14, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xffeaa7,
      roughness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.07;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Initial procedural pet model for instant visual feedback
    let activePetNodes: PetNodes = buildPetModel(type, {
      accessory: type === 'hamster' ? 'hat-sprout' : undefined,
    });
    scene.add(activePetNodes.root);

    let isDisposed = false;

    // Load authentic 3D GLTF textured model
    loadGLTFPet(type).then((gltf) => {
      if (gltf && !isDisposed) {
        const gltfPetNodes = buildGLTFPetNodes(gltf, type, {
          accessory: type === 'hamster' ? 'hat-sprout' : undefined,
        });
        gltfPetNodes.root.rotation.y = activePetNodes.root.rotation.y;
        scene.remove(activePetNodes.root);
        activePetNodes = gltfPetNodes;
        scene.add(activePetNodes.root);
      }
    });

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle rotation on pedestal
      if (activePetNodes) {
        activePetNodes.root.rotation.y = elapsed * 0.8;

        // Breathing bob
        const breathe = Math.sin(elapsed * 3.5) * 0.02;
        activePetNodes.bodyGroup.position.y = 0.55 + breathe;

        // Sprout or ear gentle bob
        activePetNodes.leftEar.rotation.z = Math.sin(elapsed * 2) * 0.05;
        activePetNodes.rightEar.rotation.z = -Math.sin(elapsed * 2) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, [type]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center select-none pointer-events-none"
    />
  );
};
