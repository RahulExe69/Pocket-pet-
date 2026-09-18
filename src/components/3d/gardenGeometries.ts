import * as THREE from 'three';
import { getToonMaterial, getEmissiveMaterial } from './threeHelpers';

export interface InteractiveGardenObject {
  id: string;
  name: string;
  group: THREE.Group;
  collider: THREE.Mesh;
  type: 'watering-can' | 'bird-bath' | 'flower-pot' | 'flower' | 'coin' | 'star';
  position: THREE.Vector3;
  data?: any;
}

export interface CollectibleItem {
  id: string;
  type: 'coin' | 'star';
  group: THREE.Group;
  collider: THREE.Mesh;
  baseY: number;
  isCollected: boolean;
  respawnTime: number;
  value: number;
}

export interface GardenButterfly {
  id: string;
  group: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  colorName: string;
  colorHex: number;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  speed: number;
  flutterSpeed: number;
  flightTimer: number;
  phaseOffset: number;
  isCaught: boolean;
}

export interface GardenNodes {
  group: THREE.Group;
  groundMesh: THREE.Mesh;
  pathMeshes: THREE.Mesh[];
  interactiveObjects: InteractiveGardenObject[];
  collectibles: CollectibleItem[];
  butterflies: GardenButterfly[];
  trees: THREE.Group[];
  flowers: THREE.Group[];
  wateringCan: THREE.Group;
  birdBathWater: THREE.Mesh;
  respawnCollectibles: () => void;
}

// Materials Cache for Garden
const gardenMatCache = new Map<string, THREE.Material>();

function getGardenMaterial(color: number, roughness = 0.6, metalness = 0.1): THREE.MeshStandardMaterial {
  const key = `g_std_${color.toString(16)}_${roughness}_${metalness}`;
  if (!gardenMatCache.has(key)) {
    gardenMatCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
      })
    );
  }
  return gardenMatCache.get(key) as THREE.MeshStandardMaterial;
}

export function buildGardenEnvironment(): GardenNodes {
  const group = new THREE.Group();
  group.name = 'garden-environment';

  const interactiveObjects: InteractiveGardenObject[] = [];
  const collectibles: CollectibleItem[] = [];
  const pathMeshes: THREE.Mesh[] = [];
  const trees: THREE.Group[] = [];
  const flowers: THREE.Group[] = [];

  // ==========================================
  // 1. LUSH SUNNY GARDEN GROUND
  // ==========================================
  const groundGeo = new THREE.CylinderGeometry(4.4, 4.6, 0.5, 48);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x48bb78, // Vibrant sunny grass green
    roughness: 0.8,
    metalness: 0.05,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.name = 'garden-ground';
  groundMesh.position.y = -0.25;
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // Soft grassy mounds for organic topography
  const moundGeos = [
    { pos: new THREE.Vector3(-2.2, -0.05, -2.0), scale: new THREE.Vector3(1.4, 0.45, 1.4) },
    { pos: new THREE.Vector3(2.3, -0.05, -1.8), scale: new THREE.Vector3(1.5, 0.5, 1.3) },
    { pos: new THREE.Vector3(-2.5, -0.05, 1.5), scale: new THREE.Vector3(1.3, 0.4, 1.3) },
    { pos: new THREE.Vector3(2.6, -0.05, 1.2), scale: new THREE.Vector3(1.2, 0.35, 1.2) },
  ];
  const moundMat = new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.85 });
  moundGeos.forEach((m) => {
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), moundMat);
    mound.position.copy(m.pos);
    mound.scale.copy(m.scale);
    mound.receiveShadow = true;
    group.add(mound);
  });

  // Grass tufts scattered around
  const grassBladeGeo = new THREE.ConeGeometry(0.04, 0.22, 5);
  const grassBladeMat = getGardenMaterial(0x52c41a, 0.7);
  const tuftPositions = [
    [-1.2, 0.8], [1.1, 0.9], [-0.8, -1.2], [1.4, -0.8],
    [-2.0, -0.5], [2.2, 0.2], [-1.6, 1.8], [1.8, 1.6],
    [-0.3, -2.1], [0.6, -2.0], [-2.3, 0.7], [2.1, -1.5]
  ];
  tuftPositions.forEach(([x, z]) => {
    const tuft = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(grassBladeGeo, grassBladeMat);
      blade.position.set((Math.random() - 0.5) * 0.08, 0.11, (Math.random() - 0.5) * 0.08);
      blade.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
      tuft.add(blade);
    }
    tuft.position.set(x, 0, z);
    group.add(tuft);
  });

  // ==========================================
  // 2. WINDING STEPPING-STONE PATH
  // ==========================================
  const pathPoints = [
    new THREE.Vector3(0, 0.015, 2.3),
    new THREE.Vector3(-0.3, 0.015, 1.7),
    new THREE.Vector3(-0.5, 0.015, 1.1),
    new THREE.Vector3(-0.2, 0.015, 0.5),
    new THREE.Vector3(0.2, 0.015, 0.0),
    new THREE.Vector3(0.6, 0.015, -0.5),
    new THREE.Vector3(0.9, 0.015, -1.1),
    new THREE.Vector3(1.2, 0.015, -1.7),
  ];

  const stoneColors = [0xe2e8f0, 0xcbd5e1, 0xd8b4fe, 0xfef08a, 0xfce7f3];
  pathPoints.forEach((pt, idx) => {
    const radius = 0.28 + (idx % 2 === 0 ? 0.04 : -0.02);
    const stoneGeo = new THREE.CylinderGeometry(radius, radius + 0.03, 0.04, 18);
    stoneGeo.scale(1.15, 1, 0.88);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: idx === 0 ? 0xf8fafc : stoneColors[idx % stoneColors.length],
      roughness: 0.75,
    });
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.copy(pt);
    stone.rotation.y = (idx * 0.6) % Math.PI;
    stone.receiveShadow = true;
    group.add(stone);
    pathMeshes.push(stone);
  });

  // ==========================================
  // 3. COLORFUL BLOOMING FLOWERS
  // ==========================================
  // Helper to build a flower
  function createFlower(type: 'daisy' | 'tulip' | 'sunflower' | 'lavender', colorHex: number): THREE.Group {
    const flGroup = new THREE.Group();

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.35, 8);
    const stemMat = getGardenMaterial(0x48bb78);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.175;
    flGroup.add(stem);

    // Leaves
    const leafGeo = new THREE.ConeGeometry(0.04, 0.16, 5);
    leafGeo.scale(1.2, 0.3, 1);
    const leaf1 = new THREE.Mesh(leafGeo, stemMat);
    leaf1.position.set(0.04, 0.12, 0);
    leaf1.rotation.z = -0.7;
    flGroup.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeo, stemMat);
    leaf2.position.set(-0.04, 0.15, 0);
    leaf2.rotation.z = 0.7;
    flGroup.add(leaf2);

    if (type === 'daisy') {
      // Center
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), getGardenMaterial(0xf59e0b, 0.4));
      center.position.y = 0.35;
      flGroup.add(center);

      // Petals
      const petalGeo = new THREE.ConeGeometry(0.035, 0.12, 6);
      petalGeo.scale(1, 0.4, 1);
      const petalMat = getGardenMaterial(colorHex, 0.5);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(angle) * 0.08, 0.35, Math.sin(angle) * 0.08);
        petal.rotation.y = -angle + Math.PI / 2;
        petal.rotation.z = Math.PI / 2;
        flGroup.add(petal);
      }
    } else if (type === 'tulip') {
      const petalMat = getGardenMaterial(colorHex, 0.4);
      const cupGeo = new THREE.SphereGeometry(0.09, 14, 12);
      cupGeo.scale(0.85, 1.25, 0.85);
      const cup = new THREE.Mesh(cupGeo, petalMat);
      cup.position.y = 0.38;
      flGroup.add(cup);
    } else if (type === 'sunflower') {
      const center = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 14), getGardenMaterial(0x451a03, 0.6));
      center.position.y = 0.42;
      center.rotation.x = 0.2;
      flGroup.add(center);

      const petalGeo = new THREE.ConeGeometry(0.04, 0.15, 6);
      petalGeo.scale(1, 0.3, 1);
      const petalMat = getGardenMaterial(0xfacc15, 0.4);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(angle) * 0.12, 0.42, Math.sin(angle) * 0.12);
        petal.rotation.y = -angle + Math.PI / 2;
        petal.rotation.z = Math.PI / 2;
        flGroup.add(petal);
      }
    } else if (type === 'lavender') {
      const flowerMat = getGardenMaterial(colorHex, 0.5);
      for (let i = 0; i < 6; i++) {
        const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.05 - i * 0.005, 8, 8), flowerMat);
        blossom.position.y = 0.25 + i * 0.045;
        flGroup.add(blossom);
      }
    }

    return flGroup;
  }

  // Flower patch coordinates & configurations
  const flowerConfigs = [
    // Left flowerbed
    { type: 'tulip' as const, color: 0xff6b81, pos: [-1.4, 0.8] },
    { type: 'tulip' as const, color: 0xff4757, pos: [-1.6, 0.6] },
    { type: 'daisy' as const, color: 0xffffff, pos: [-1.3, 0.4] },
    { type: 'daisy' as const, color: 0xfef08a, pos: [-1.7, 1.0] },
    { type: 'lavender' as const, color: 0xa855f7, pos: [-1.9, 0.8] },
    { type: 'lavender' as const, color: 0xc084fc, pos: [-1.8, 0.5] },

    // Right flowerbed
    { type: 'sunflower' as const, color: 0xfacc15, pos: [1.8, -0.6] },
    { type: 'sunflower' as const, color: 0xfbbf24, pos: [2.1, -0.4] },
    { type: 'tulip' as const, color: 0xec4899, pos: [1.5, -0.8] },
    { type: 'daisy' as const, color: 0xffffff, pos: [1.7, -1.0] },
    { type: 'daisy' as const, color: 0x38bdf8, pos: [2.0, -0.8] },

    // Back perimeter flowers
    { type: 'tulip' as const, color: 0xf43f5e, pos: [-0.6, -1.8] },
    { type: 'tulip' as const, color: 0xfb923c, pos: [-0.9, -1.6] },
    { type: 'lavender' as const, color: 0x818cf8, pos: [0.1, -1.9] },
    { type: 'daisy' as const, color: 0xffffff, pos: [-0.3, -1.7] },
  ];

  flowerConfigs.forEach((cfg, idx) => {
    const fl = createFlower(cfg.type, cfg.color);
    fl.position.set(cfg.pos[0], 0, cfg.pos[1]);
    fl.scale.set(1.1, 1.1, 1.1);
    group.add(fl);
    flowers.push(fl);

    // Make select flower clusters interactive
    if (idx % 3 === 0) {
      const colliderGeo = new THREE.SphereGeometry(0.28, 8, 8);
      const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
      const collider = new THREE.Mesh(colliderGeo, colliderMat);
      collider.position.set(cfg.pos[0], 0.25, cfg.pos[1]);
      group.add(collider);

      interactiveObjects.push({
        id: `flower-patch-${idx}`,
        name: 'Blooming Flowers',
        group: fl,
        collider,
        type: 'flower',
        position: new THREE.Vector3(cfg.pos[0], 0.25, cfg.pos[1]),
        data: { color: cfg.color },
      });
    }
  });

  // ==========================================
  // 4. SMALL STYLIZED GARDEN TREES
  // ==========================================
  function createGardenTree(scale = 1.0): THREE.Group {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 1.1 * scale, 10);
    const trunkMat = getGardenMaterial(0x78350f, 0.85);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = (0.55 * scale);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Layered cloud foliage
    const foliageMat1 = getGardenMaterial(0x22c55e, 0.7);
    const foliageMat2 = getGardenMaterial(0x16a34a, 0.75);
    const foliageMat3 = getGardenMaterial(0x4ade80, 0.65);

    const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.55 * scale, 16, 14), foliageMat1);
    f1.position.set(0, 1.3 * scale, 0);
    f1.castShadow = true;
    treeGroup.add(f1);

    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 14, 12), foliageMat2);
    f2.position.set(-0.25 * scale, 1.15 * scale, 0.15 * scale);
    f2.castShadow = true;
    treeGroup.add(f2);

    const f3 = new THREE.Mesh(new THREE.SphereGeometry(0.44 * scale, 14, 12), foliageMat3);
    f3.position.set(0.28 * scale, 1.2 * scale, -0.12 * scale);
    f3.castShadow = true;
    treeGroup.add(f3);

    const fTop = new THREE.Mesh(new THREE.SphereGeometry(0.35 * scale, 12, 10), foliageMat1);
    fTop.position.set(0.05 * scale, 1.65 * scale, 0.05 * scale);
    fTop.castShadow = true;
    treeGroup.add(fTop);

    return treeGroup;
  }

  // Tree 1: Left Orchard Tree
  const tree1 = createGardenTree(1.15);
  tree1.position.set(-2.5, 0, -1.2);
  group.add(tree1);
  trees.push(tree1);

  // Tree 2: Right Corner Tree
  const tree2 = createGardenTree(1.0);
  tree2.position.set(2.4, 0, -1.5);
  group.add(tree2);
  trees.push(tree2);

  // Tree 3: Small Sapling Tree
  const tree3 = createGardenTree(0.75);
  tree3.position.set(-2.3, 0, 1.6);
  group.add(tree3);
  trees.push(tree3);

  // ==========================================
  // 5. NATURAL GARDEN ROCKS & BOULDERS
  // ==========================================
  const rockGeo = new THREE.DodecahedronGeometry(0.25, 1);
  const rockMat = getGardenMaterial(0x64748b, 0.9);
  const mossMat = getGardenMaterial(0x15803d, 0.85);

  const rockPositions = [
    { pos: new THREE.Vector3(-1.1, 0.1, -1.5), scale: new THREE.Vector3(1.3, 0.9, 1.1) },
    { pos: new THREE.Vector3(-1.3, 0.08, -1.7), scale: new THREE.Vector3(0.8, 0.6, 0.8) },
    { pos: new THREE.Vector3(1.3, 0.12, 0.8), scale: new THREE.Vector3(1.2, 0.8, 1.0) },
    { pos: new THREE.Vector3(1.6, 0.09, 0.9), scale: new THREE.Vector3(0.7, 0.6, 0.7) },
    { pos: new THREE.Vector3(-0.9, 0.07, 1.8), scale: new THREE.Vector3(0.9, 0.7, 0.9) },
    { pos: new THREE.Vector3(2.5, 0.16, 0.3), scale: new THREE.Vector3(1.5, 1.1, 1.3) },
  ];

  rockPositions.forEach((r, idx) => {
    const rock = new THREE.Mesh(rockGeo, idx % 2 === 0 ? mossMat : rockMat);
    rock.position.copy(r.pos);
    rock.scale.copy(r.scale);
    rock.rotation.set(idx * 0.4, idx * 0.7, idx * 0.2);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  });

  // ==========================================
  // 6. INTERACTIVE GARDEN OBJECTS
  // ==========================================

  // (A) WATERING CAN
  const wateringCanGroup = new THREE.Group();
  wateringCanGroup.name = 'watering-can';

  // Body
  const canBodyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.24, 16);
  const canMat = getGardenMaterial(0x0284c7, 0.35, 0.25); // Shiny sky blue metallic
  const canBody = new THREE.Mesh(canBodyGeo, canMat);
  canBody.position.y = 0.12;
  wateringCanGroup.add(canBody);

  // Spout
  const spoutGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.25, 10);
  const spout = new THREE.Mesh(spoutGeo, canMat);
  spout.position.set(0.12, 0.17, 0);
  spout.rotation.z = -Math.PI / 4;
  wateringCanGroup.add(spout);

  // Sprinkler head
  const sprinklerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.04, 12), getGardenMaterial(0xf59e0b, 0.2, 0.6));
  sprinklerHead.position.set(0.22, 0.26, 0);
  sprinklerHead.rotation.z = -Math.PI / 4;
  wateringCanGroup.add(sprinklerHead);

  // Handle
  const handleCurve = new THREE.TorusGeometry(0.09, 0.018, 8, 16, Math.PI);
  const handle = new THREE.Mesh(handleCurve, canMat);
  handle.position.set(-0.11, 0.14, 0);
  handle.rotation.z = Math.PI / 2;
  wateringCanGroup.add(handle);

  wateringCanGroup.position.set(-0.85, 0, 0.9);
  wateringCanGroup.scale.set(1.1, 1.1, 1.1);
  group.add(wateringCanGroup);

  const canCollider = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.36, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  canCollider.position.set(-0.85, 0.18, 0.9);
  group.add(canCollider);

  interactiveObjects.push({
    id: 'interactive-watering-can',
    name: 'Garden Watering Can',
    group: wateringCanGroup,
    collider: canCollider,
    type: 'watering-can',
    position: new THREE.Vector3(-0.85, 0.18, 0.9),
  });

  // (B) BIRD BATH & SPLASH FOUNTAIN
  const birdBathGroup = new THREE.Group();
  birdBathGroup.name = 'bird-bath';

  // Base & Column
  const bbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.08, 18), getGardenMaterial(0x94a3b8, 0.7));
  bbBase.position.y = 0.04;
  birdBathGroup.add(bbBase);

  const bbColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.38, 16), getGardenMaterial(0x94a3b8, 0.7));
  bbColumn.position.y = 0.25;
  birdBathGroup.add(bbColumn);

  // Basin
  const bbBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.24, 0.14, 24), getGardenMaterial(0x94a3b8, 0.7));
  bbBasin.position.y = 0.48;
  birdBathGroup.add(bbBasin);

  // Water surface
  const waterGeo = new THREE.CircleGeometry(0.38, 24);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.85,
  });
  const birdBathWater = new THREE.Mesh(waterGeo, waterMat);
  birdBathWater.position.y = 0.52;
  birdBathGroup.add(birdBathWater);

  // Tiny yellow rubber ducky floating in the bird bath!
  const duckGroup = new THREE.Group();
  const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), getGardenMaterial(0xfacc15, 0.3));
  duckBody.scale.set(1.2, 0.9, 0.9);
  duckGroup.add(duckBody);
  const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), getGardenMaterial(0xfacc15, 0.3));
  duckHead.position.set(0.05, 0.05, 0);
  duckGroup.add(duckHead);
  const duckBeak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.03, 6), getGardenMaterial(0xf97316, 0.3));
  duckBeak.position.set(0.09, 0.045, 0);
  duckBeak.rotation.z = -Math.PI / 2;
  duckGroup.add(duckBeak);
  duckGroup.position.set(0.08, 0.54, 0.05);
  birdBathGroup.add(duckGroup);

  birdBathGroup.position.set(1.4, 0, 0.4);
  group.add(birdBathGroup);

  const bbCollider = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.65, 14),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  bbCollider.position.set(1.4, 0.35, 0.4);
  group.add(bbCollider);

  interactiveObjects.push({
    id: 'interactive-bird-bath',
    name: 'Bird Bath & Duck',
    group: birdBathGroup,
    collider: bbCollider,
    type: 'bird-bath',
    position: new THREE.Vector3(1.4, 0.35, 0.4),
  });

  // (C) FLOWER SPROUT POT
  const potGroup = new THREE.Group();
  potGroup.name = 'sprout-pot';

  const potMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.12, 0.22, 16),
    getGardenMaterial(0xc2410c, 0.8) // Terracotta orange
  );
  potMesh.position.y = 0.11;
  potGroup.add(potMesh);

  // Soil
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.16, 14), getGardenMaterial(0x451a03, 0.95));
  soil.rotateX(-Math.PI / 2);
  soil.position.y = 0.21;
  potGroup.add(soil);

  // Sprout / Flower in pot
  const potFlower = createFlower('daisy', 0xf472b6);
  potFlower.scale.set(0.8, 0.8, 0.8);
  potFlower.position.y = 0.21;
  potGroup.add(potFlower);

  potGroup.position.set(0.8, 0, 1.4);
  group.add(potGroup);

  const potCollider = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.4, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  potCollider.position.set(0.8, 0.2, 1.4);
  group.add(potCollider);

  interactiveObjects.push({
    id: 'interactive-flower-pot',
    name: 'Terracotta Sprout Pot',
    group: potGroup,
    collider: potCollider,
    type: 'flower-pot',
    position: new THREE.Vector3(0.8, 0.2, 1.4),
  });

  // (D) WOODEN GARDEN BENCH
  const benchGroup = new THREE.Group();
  const woodMat = getGardenMaterial(0x92400e, 0.8);
  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.35), woodMat);
  seat.position.y = 0.25;
  benchGroup.add(seat);
  // Backrest
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.04), woodMat);
  back.position.set(0, 0.42, -0.15);
  benchGroup.add(back);
  // Legs
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8);
  [[-0.38, 0.12, 0.12], [0.38, 0.12, 0.12], [-0.38, 0.12, -0.12], [0.38, 0.12, -0.12]].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(x, y, z);
    benchGroup.add(leg);
  });
  benchGroup.position.set(-1.8, 0, -0.4);
  benchGroup.rotation.y = 0.7;
  group.add(benchGroup);

  // ==========================================
  // 7. COLLECTIBLE COINS & STARS
  // ==========================================
  function create3DCoin(): THREE.Group {
    const coinGroup = new THREE.Group();
    const coinGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.035, 20);
    coinGeo.rotateZ(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.25,
      metalness: 0.85,
    });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    coinGroup.add(coinMesh);

    // Inner embossed star
    const starGeo = new THREE.OctahedronGeometry(0.07, 0);
    const starMat = getEmissiveMaterial(0xfffbeb, 0.5);
    const starMesh = new THREE.Mesh(starGeo, starMat);
    coinGroup.add(starMesh);

    return coinGroup;
  }

  function create3DStar(): THREE.Group {
    const starGroup = new THREE.Group();
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffb703,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.6,
    });

    // 5-point star or faceted diamond
    const diamond1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), starMat);
    diamond1.scale.set(1.2, 1.2, 0.4);
    starGroup.add(diamond1);

    const diamond2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), starMat);
    diamond2.rotation.z = Math.PI / 4;
    diamond2.scale.set(1.2, 1.2, 0.4);
    starGroup.add(diamond2);

    return starGroup;
  }

  const collectibleConfigs = [
    { type: 'coin' as const, pos: new THREE.Vector3(-0.4, 0.35, 1.3), value: 5 },
    { type: 'coin' as const, pos: new THREE.Vector3(0.5, 0.35, -0.4), value: 5 },
    { type: 'star' as const, pos: new THREE.Vector3(1.1, 0.4, -1.3), value: 10 },
    { type: 'coin' as const, pos: new THREE.Vector3(-1.4, 0.35, 0.3), value: 5 },
    { type: 'star' as const, pos: new THREE.Vector3(-0.6, 0.4, -1.2), value: 10 },
  ];

  collectibleConfigs.forEach((c, idx) => {
    const itemGroup = c.type === 'coin' ? create3DCoin() : create3DStar();
    itemGroup.position.copy(c.pos);
    group.add(itemGroup);

    const collider = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    collider.position.copy(c.pos);
    group.add(collider);

    collectibles.push({
      id: `garden-collectible-${idx}`,
      type: c.type,
      group: itemGroup,
      collider,
      baseY: c.pos.y,
      isCollected: false,
      respawnTime: 0,
      value: c.value,
    });

    interactiveObjects.push({
      id: `garden-collectible-${idx}`,
      name: c.type === 'coin' ? 'Golden Coin' : 'Lucky Star',
      group: itemGroup,
      collider,
      type: c.type,
      position: c.pos.clone(),
      data: { value: c.value },
    });
  });

  // ==========================================
  // 8. 3D BUTTERFLIES (FOR CATCH THE BUTTERFLIES)
  // ==========================================
  const BUTTERFLY_PALETTES = [
    { name: 'Monarch Orange', hex: 0xff6b35 },
    { name: 'Morpho Blue', hex: 0x00b4d8 },
    { name: 'Sunshine Yellow', hex: 0xffd166 },
    { name: 'Sakura Pink', hex: 0xff70a6 },
    { name: 'Emerald Green', hex: 0x06d6a0 },
    { name: 'Royal Violet', hex: 0x9b5de5 },
    { name: 'Coral Red', hex: 0xf72585 },
  ];

  const butterflies: GardenButterfly[] = [];

  function buildButterflyModel(colorHex: number): {
    group: THREE.Group;
    leftWing: THREE.Group;
    rightWing: THREE.Group;
  } {
    const bfRoot = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.14, 8);
    const bodyMat = getGardenMaterial(0x1e293b, 0.4);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    bfRoot.add(body);

    // Head with antennae
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), bodyMat);
    head.position.set(0, 0, 0.08);
    bfRoot.add(head);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // Left Wing Group (pivots at body center)
    const leftWing = new THREE.Group();
    const foreWingGeo = new THREE.CircleGeometry(0.11, 14, 0, Math.PI);
    foreWingGeo.scale(1.25, 0.9, 1);
    const leftForeWing = new THREE.Mesh(foreWingGeo, wingMat);
    leftForeWing.rotation.z = Math.PI / 2;
    leftForeWing.position.set(-0.01, 0, 0.03);
    leftWing.add(leftForeWing);

    const hindWingGeo = new THREE.CircleGeometry(0.08, 12, 0, Math.PI);
    hindWingGeo.scale(1.1, 0.85, 1);
    const leftHindWing = new THREE.Mesh(hindWingGeo, wingMat);
    leftHindWing.rotation.z = Math.PI / 2;
    leftHindWing.position.set(-0.01, 0, -0.05);
    leftWing.add(leftHindWing);
    bfRoot.add(leftWing);

    // Right Wing Group (pivots at body center)
    const rightWing = new THREE.Group();
    const rightForeWing = new THREE.Mesh(foreWingGeo, wingMat);
    rightForeWing.rotation.z = -Math.PI / 2;
    rightForeWing.position.set(0.01, 0, 0.03);
    rightWing.add(rightForeWing);

    const rightHindWing = new THREE.Mesh(hindWingGeo, wingMat);
    rightHindWing.rotation.z = -Math.PI / 2;
    rightHindWing.position.set(0.01, 0, -0.05);
    rightWing.add(rightHindWing);
    bfRoot.add(rightWing);

    return { group: bfRoot, leftWing, rightWing };
  }

  // Spawn 6 butterflies initially
  BUTTERFLY_PALETTES.slice(0, 6).forEach((pal, idx) => {
    const { group: bfGroup, leftWing, rightWing } = buildButterflyModel(pal.hex);

    // Spread them naturally around the garden flowers
    const initX = (Math.random() - 0.5) * 3.2;
    const initY = 0.65 + Math.random() * 0.9;
    const initZ = (Math.random() - 0.5) * 3.2;

    bfGroup.position.set(initX, initY, initZ);
    bfGroup.scale.set(1.2, 1.2, 1.2);
    group.add(bfGroup);

    butterflies.push({
      id: `butterfly-${idx}`,
      group: bfGroup,
      leftWing,
      rightWing,
      colorName: pal.name,
      colorHex: pal.hex,
      position: new THREE.Vector3(initX, initY, initZ),
      targetPosition: new THREE.Vector3(
        (Math.random() - 0.5) * 3.0,
        0.6 + Math.random() * 0.8,
        (Math.random() - 0.5) * 3.0
      ),
      speed: 0.65 + Math.random() * 0.4,
      flutterSpeed: 14 + Math.random() * 4,
      flightTimer: Math.random() * 5,
      phaseOffset: Math.random() * Math.PI * 2,
      isCaught: false,
    });
  });

  const respawnCollectibles = () => {
    collectibles.forEach((col) => {
      if (col.isCollected && Date.now() > col.respawnTime) {
        col.isCollected = false;
        col.group.visible = true;
        col.group.scale.set(1, 1, 1);
        col.collider.position.copy(col.group.position);
      }
    });
  };

  return {
    group,
    groundMesh,
    pathMeshes,
    interactiveObjects,
    collectibles,
    butterflies,
    trees,
    flowers,
    wateringCan: wateringCanGroup,
    birdBathWater,
    respawnCollectibles,
  };
}
