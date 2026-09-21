import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PetType, PetCustomization } from '../../types';
import { PetNodes, buildCustomizationItems } from './petGeometries';
import { getToonMaterial } from './threeHelpers';

// Model path mapper for pet types
const MODEL_PATHS: Record<string, string> = {
  hamster: '/models/hamster.glb',
  cat: '/models/cat.glb',
  chinchilla: '/models/chinchilla.glb',
  ferret: '/models/ferret.glb',
  gerbil: '/models/gerbil.glb',
  hedgehog: '/models/hedgehog.glb',
  rat: '/models/rat.glb',
  badger: '/models/badger.glb',
  goldfish: '/models/goldfish.glb',
  parakeet: '/models/parakeet.glb',
  axolotl: '/models/axolotl.glb',
  otter: '/models/otter.glb',
};

// In-memory cache for loaded GLTF templates
const gltfCache = new Map<string, THREE.Group>();
const pendingPromises = new Map<string, Promise<THREE.Group | null>>();

export function getGLTFModelUrl(type: PetType | string): string {
  return MODEL_PATHS[type] || MODEL_PATHS.hamster;
}

/**
 * Loads a pet GLTF model asynchronously and returns a prepared, cloned THREE.Group
 */
export async function loadGLTFPet(type: PetType | string): Promise<THREE.Group | null> {
  const url = getGLTFModelUrl(type);

  if (gltfCache.has(url)) {
    return gltfCache.get(url)!.clone(true);
  }

  if (pendingPromises.has(url)) {
    const res = await pendingPromises.get(url);
    return res ? res.clone(true) : null;
  }

  const promise = new Promise<THREE.Group | null>((resolve) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;

        // Optimize materials and shadows
        root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.65;
              mat.metalness = 0.04;
              mat.needsUpdate = true;
              if (mat.map) {
                mat.map.colorSpace = THREE.SRGBColorSpace;
                mat.map.generateMipmaps = true;
                mat.map.minFilter = THREE.LinearMipmapLinearFilter;
                mat.map.needsUpdate = true;
              }
            }
          }
        });

        gltfCache.set(url, root);
        resolve(root.clone(true));
      },
      undefined,
      (error) => {
        console.warn(`Could not load GLTF model from ${url}, falling back to procedural model:`, error);
        resolve(null);
      }
    );
  });

  pendingPromises.set(url, promise);
  const result = await promise;
  pendingPromises.delete(url);
  return result ? result.clone(true) : null;
}

/**
 * Wraps a loaded GLTF pet into an interactive PetNodes structure compatible with all
 * animations, talking mouth chatter, eye blinking, tap-to-move, and clothing accessories!
 */
export function buildGLTFPetNodes(
  gltfModel: THREE.Group,
  type: PetType,
  customization: PetCustomization
): PetNodes {
  const root = new THREE.Group();
  root.name = `pet-root-gltf-${type}`;

  // Measure bounding box to normalize scale and center
  gltfModel.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(gltfModel);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());

  // Target height is ~1.10 units (proportional eye-level in Talking Tom room)
  const targetHeight = 1.10;
  const currentHeight = Math.max(0.01, size.y);
  const fitScale = targetHeight / currentHeight;

  // Scale model
  gltfModel.scale.set(fitScale, fitScale, fitScale);

  // Body group for breathing, waddling, jumping, rotating
  // In the scene, bodyGroup.position.y is 0.55 at rest.
  // The bottom of the pet model must touch the floor (world Y=0) at rest.
  // So inside bodyGroup, the bottom of the pet should be at y = -0.55.
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'body-group';
  bodyGroup.position.y = 0.55;
  root.add(bodyGroup);

  // Center horizontally, and position bottom at y = -0.55 in bodyGroup
  gltfModel.position.set(
    -center.x * fitScale,
    -bbox.min.y * fitScale - 0.55,
    -center.z * fitScale
  );
  bodyGroup.add(gltfModel);

  // Head group for accessories (hats, crowns, glasses)
  // Positioned near top crown of the pet inside bodyGroup
  const headGroup = new THREE.Group();
  headGroup.name = 'head-group';
  headGroup.position.set(0, 0.44, 0.12);
  bodyGroup.add(headGroup);

  // Accessory group
  const accessoryGroup = new THREE.Group();
  accessoryGroup.name = 'accessory-group';
  headGroup.add(accessoryGroup);

  // Rosy cheeks group (subtle, kept hidden by default so authentic fur texture shows)
  const cheeksGroup = new THREE.Group();
  cheeksGroup.name = 'cheeks-group';
  cheeksGroup.visible = false;
  headGroup.add(cheeksGroup);

  // Mouth group (attached to headGroup, hidden by default to keep authentic face)
  const mouthGroup = new THREE.Group();
  mouthGroup.name = 'mouth-group';
  mouthGroup.position.set(0, 0.022, 0.55);
  mouthGroup.visible = false;
  headGroup.add(mouthGroup);

  // Snout reference
  const snout = new THREE.Mesh(new THREE.BufferGeometry());
  snout.visible = false;
  headGroup.add(snout);

  // Eyes for blinking animation anchors
  const leftEye = new THREE.Mesh(new THREE.BufferGeometry());
  leftEye.visible = false;
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.BufferGeometry());
  rightEye.visible = false;
  headGroup.add(rightEye);

  // Ears for twitch animation
  const leftEar = new THREE.Group();
  leftEar.name = 'left-ear';
  leftEar.position.set(-0.25, 0.15, 0.05);
  headGroup.add(leftEar);

  const rightEar = new THREE.Group();
  rightEar.name = 'right-ear';
  rightEar.position.set(0.25, 0.15, 0.05);
  headGroup.add(rightEar);

  // Arms and Legs for waddle / dance animation
  const leftArm = new THREE.Group();
  leftArm.name = 'left-arm';
  leftArm.position.set(-0.35, 0.0, 0.15);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.name = 'right-arm';
  rightArm.position.set(0.35, 0.0, 0.15);
  bodyGroup.add(rightArm);

  const leftLeg = new THREE.Group();
  leftLeg.name = 'left-leg';
  leftLeg.position.set(-0.25, -0.45, 0.0);
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.name = 'right-leg';
  rightLeg.position.set(0.25, -0.45, 0.0);
  bodyGroup.add(rightLeg);

  // Held food group (for seeds / pellets eating)
  const heldFoodGroup = new THREE.Group();
  heldFoodGroup.name = 'held-food';
  heldFoodGroup.position.set(0, 0.0, 0.45);
  bodyGroup.add(heldFoodGroup);

  // Attach customizations (hats, crowns, glasses, bows, etc.)
  buildCustomizationItems(accessoryGroup, headGroup, bodyGroup, customization, type);

  return {
    root,
    bodyGroup,
    headGroup,
    leftEar,
    rightEar,
    leftEye,
    rightEye,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    cheeksGroup,
    snout,
    mouthGroup,
    accessoryGroup,
    heldFoodGroup,
  };
}
