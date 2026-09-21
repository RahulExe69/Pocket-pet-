import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { PetType, PetCustomization } from '../../types';
import { PetNodes, buildCustomizationItems } from './petGeometries';

// Model path mapper for pet types with dedicated individual GLBs
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

// Exact node name mapper in pets-compressed.glb for all 50 species
const PET_NODE_NAMES: Record<string, string> = {
  angelfish: 'Angelfish',
  archaeopteryx: 'Archaeopteryx',
  axolotl: 'Axolotl',
  badger: 'Badger',
  betta_fish: 'Betta_Fish',
  bighorn_sheep: 'Bighorn_Sheep',
  bobcat: 'Bobcat',
  chinchilla: 'Chinchilla',
  clownfish: 'Clownfish',
  cockatiel: 'Cockatiel',
  crow: 'Crow',
  dimetrodon: 'Dimetrodon',
  dodo: 'Dodo',
  eagle: 'Eagle',
  eel: 'Eel',
  ferret: 'Ferret',
  flamingo: 'Flamingo',
  gecko: 'Gecko',
  gerbil: 'Gerbil',
  glyptodon: 'Glyptodon',
  goldfish: 'Goldfish',
  hamster: 'Hamster',
  hedgehog: 'Hedgehog',
  hummingbird: 'Hummingbird',
  kiwi: 'Kiwi',
  lynx: 'Lynx',
  mammoth: 'Mammoth',
  manta_ray: 'Manta_Ray',
  marmot: 'Marmot',
  megatherium: 'Megatherium',
  mountain_goat: 'Mountain_Goat',
  otter: 'Otter',
  owl: 'Owl',
  parakeet: 'Parakeet',
  peacock: 'Peacock',
  pelican: 'Pelican',
  pufferfish: 'Pufferfish',
  rat: 'Rat',
  river_otter: 'River_Otter',
  sabertooth_tiger: 'Sabertooth_Tiger',
  seagull: 'Seagull',
  seahorse: 'Seahorse',
  skunk: 'Skunk',
  stingray: 'Stingray',
  swan: 'Swan',
  swordfish: 'Swordfish',
  terror_bird: 'Terror_Bird',
  trilobite: 'Trilobite',
  weasel: 'Weasel',
  woolly_rhino: 'Woolly_Rhino',
  cat: 'Bobcat',
};

// In-memory cache for loaded GLTF templates
const gltfCache = new Map<string, THREE.Group>();
const pendingPromises = new Map<string, Promise<THREE.Group | null>>();

// Master model loader for pets-compressed.glb containing all 50 models
let masterGLTFPromise: Promise<THREE.Group | null> | null = null;
let masterGLTFScene: THREE.Group | null = null;

async function loadMasterPetsGLB(): Promise<THREE.Group | null> {
  if (masterGLTFScene) return masterGLTFScene;
  if (masterGLTFPromise) return masterGLTFPromise;

  masterGLTFPromise = new Promise<THREE.Group | null>(async (resolve) => {
    try {
      if (MeshoptDecoder.ready) {
        await MeshoptDecoder.ready;
      }
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.load(
        '/pets-compressed.glb',
        (gltf) => {
          const root = gltf.scene;
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
          masterGLTFScene = root;
          resolve(root);
        },
        undefined,
        (error) => {
          console.warn('Could not load master pets-compressed.glb:', error);
          resolve(null);
        }
      );
    } catch (err) {
      console.warn('Failed to initialize GLTF loader with MeshoptDecoder:', err);
      resolve(null);
    }
  });

  return masterGLTFPromise;
}

export function getGLTFModelUrl(type: PetType | string): string {
  return MODEL_PATHS[type] || '/pets-compressed.glb';
}

function standardizePetModel(model: THREE.Object3D, name: string): THREE.Group {
  const wrapper = new THREE.Group();
  wrapper.name = `pet-model-${name}`;
  wrapper.add(model);
  wrapper.updateMatrixWorld(true);

  const bbox = new THREE.Box3().setFromObject(wrapper);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());

  // Center horizontally and ground bottom at Y = 0
  model.position.set(-center.x, -bbox.min.y, -center.z);
  wrapper.updateMatrixWorld(true);

  // Standardize height to 1.10 units (eye-level in room and preview)
  const targetHeight = 1.10;
  const naturalHeight = Math.max(0.01, size.y);
  const fitScale = targetHeight / naturalHeight;
  model.scale.multiplyScalar(fitScale);
  wrapper.updateMatrixWorld(true);

  return wrapper;
}

/**
 * Loads a pet GLTF model asynchronously and returns a prepared, cloned THREE.Group
 * for any of the 50 pet species.
 */
export async function loadGLTFPet(type: PetType | string): Promise<THREE.Group | null> {
  // Check if this pet type has an individual dedicated GLB file
  const individualUrl = MODEL_PATHS[type];
  if (individualUrl) {
    if (gltfCache.has(individualUrl)) {
      return gltfCache.get(individualUrl)!.clone(true);
    }

    if (pendingPromises.has(individualUrl)) {
      const res = await pendingPromises.get(individualUrl);
      if (res) return res.clone(true);
    } else {
      const promise = new Promise<THREE.Group | null>((resolve) => {
        const loader = new GLTFLoader();
        loader.load(
          individualUrl,
          (gltf) => {
            const root = gltf.scene;
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
            const standardized = standardizePetModel(root, String(type));
            gltfCache.set(individualUrl, standardized);
            resolve(standardized.clone(true));
          },
          undefined,
          () => resolve(null)
        );
      });

      pendingPromises.set(individualUrl, promise);
      const res = await promise;
      pendingPromises.delete(individualUrl);
      if (res) return res.clone(true);
    }
  }

  // Look up model from master pets-compressed.glb containing all 50 models
  const targetNodeName = PET_NODE_NAMES[type] || type;
  const masterRoot = await loadMasterPetsGLB();
  if (!masterRoot) return null;

  // Search under RootNode first to preserve authentic top-level upright rotation and scale
  let rootNode: THREE.Object3D | null = null;
  masterRoot.traverse((obj) => {
    if (!rootNode && obj.name === 'RootNode') {
      rootNode = obj;
    }
  });

  const searchRoot = rootNode || masterRoot;
  let targetObj: THREE.Object3D | null = null;

  // 1. Direct child of RootNode (e.g., 'Marmot', 'Weasel', 'Cockatiel', 'Bobcat')
  for (const child of searchRoot.children) {
    if (child.name.toLowerCase() === targetNodeName.toLowerCase()) {
      targetObj = child;
      break;
    }
  }

  // 2. Fallback search
  if (!targetObj) {
    searchRoot.traverse((obj) => {
      if (!targetObj && obj.name && obj.name.toLowerCase() === targetNodeName.toLowerCase()) {
        targetObj = obj;
      }
    });
  }

  if (targetObj) {
    // Clone targetObj preserving its upright rotation & scale
    const cloned = (targetObj as THREE.Object3D).clone(true) as THREE.Group;
    // Zero out the grid position offset
    cloned.position.set(0, 0, 0);

    const standardized = standardizePetModel(cloned, String(type));
    return standardized;
  }

  return null;
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

  // Body group for breathing, waddling, jumping, rotating
  // In the scene, bodyGroup.position.y is 0.55 at rest.
  // gltfModel is already centered and grounded with bottom at Y=0.
  // Positioning gltfModel at y = -0.55 grounds it precisely at world Y=0 (the floor).
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'body-group';
  bodyGroup.position.y = 0.55;
  root.add(bodyGroup);

  gltfModel.position.set(0, -0.55, 0);
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
