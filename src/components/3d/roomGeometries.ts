import * as THREE from 'three';
import { RoomCustomization } from '../../types';
import { getToonMaterial, getGlassMaterial, getEmissiveMaterial } from './threeHelpers';

export interface RoomNodes {
  group: THREE.Group;
  floorMesh: THREE.Mesh;
  backWallMesh: THREE.Mesh;
  leftWallMesh: THREE.Mesh;
  bedGroup: THREE.Group;
  bedPosition: THREE.Vector3;
  foodBowlGroup: THREE.Group;
  foodBowlPosition: THREE.Vector3;
  foodPelletsGroup: THREE.Group;
  waterBowlGroup: THREE.Group;
  waterBowlPosition: THREE.Vector3;
  waterSurfaceMesh: THREE.Mesh;
  toyGroup: THREE.Group;
  toyPosition: THREE.Vector3;
  decorGroup: THREE.Group;
  windowGroup: THREE.Group;
  nightLights: THREE.Group;
  dayLights: THREE.Group;
}

export function buildRoomEnvironment(
  room: RoomCustomization,
  isSleeping: boolean
): RoomNodes {
  const group = new THREE.Group();
  group.name = 'room-environment';

  // 1. Lighting groups for Day / Night transition
  const dayLights = new THREE.Group();
  const nightLights = new THREE.Group();
  group.add(dayLights);
  group.add(nightLights);

  // Day Lighting - Bright, cheerful toy-house illumination with soft rosy/pink glow
  const dayAmbient = new THREE.AmbientLight(0xfff5f8, 1.55);
  dayLights.add(dayAmbient);

  const daySun = new THREE.DirectionalLight(0xfff0f5, 1.9);
  daySun.position.set(4, 7, 5);
  daySun.castShadow = true;
  daySun.shadow.mapSize.width = 1024;
  daySun.shadow.mapSize.height = 1024;
  daySun.shadow.camera.near = 0.5;
  daySun.shadow.camera.far = 15;
  daySun.shadow.camera.left = -4;
  daySun.shadow.camera.right = 4;
  daySun.shadow.camera.top = 4;
  daySun.shadow.camera.bottom = -4;
  daySun.shadow.bias = -0.001;
  dayLights.add(daySun);

  const dayFill = new THREE.DirectionalLight(0xffe4ec, 0.85);
  dayFill.position.set(-3, 4, 3);
  dayLights.add(dayFill);

  // Night Lighting
  const nightAmbient = new THREE.AmbientLight(0x2d1a33, 0.85);
  nightLights.add(nightAmbient);

  const nightMoon = new THREE.DirectionalLight(0x8a72a5, 1.0);
  nightMoon.position.set(-3, 5, 4);
  nightMoon.castShadow = true;
  nightLights.add(nightMoon);

  const nightCozyLamp = new THREE.PointLight(0xffb1c5, 1.5, 5);
  nightCozyLamp.position.set(2.2, 1.2, -1.8);
  nightLights.add(nightCozyLamp);

  dayLights.visible = !isSleeping;
  nightLights.visible = isSleeping;

  // 2. Floor (Soft pastel pink #FFE9F0 bright toy house flooring)
  const floorGeo = new THREE.BoxGeometry(6.5, 0.2, 6.5);
  let floorColor = 0xffe9f0; // Soft pastel pink #FFE9F0 (User requested)
  let floorRoughness = 0.38;

  if (room.flooring === 'floor-checkered') {
    floorColor = 0xffe9f0;
  } else if (room.flooring === 'floor-tatami') {
    floorColor = 0xffd6e0;
    floorRoughness = 0.55;
  } else if (room.flooring === 'floor-pink-carpet') {
    floorColor = 0xffb8cb;
    floorRoughness = 0.8;
  }

  const floorMat = getToonMaterial(floorColor, floorRoughness);
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.y = -0.1;
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Decorative border plinths/baseboards (Crisp clean white toy-house baseboard)
  const baseboardMat = getToonMaterial(0xffffff, 0.25);
  const backBaseGeo = new THREE.BoxGeometry(6.5, 0.18, 0.1);
  const backBase = new THREE.Mesh(backBaseGeo, baseboardMat);
  backBase.position.set(0, 0.09, -3.2);
  group.add(backBase);

  const leftBaseGeo = new THREE.BoxGeometry(0.1, 0.18, 6.5);
  const leftBase = new THREE.Mesh(leftBaseGeo, baseboardMat);
  leftBase.position.set(-3.2, 0.09, 0);
  group.add(leftBase);

  // 3. Walls (Back wall & Left wall: Soft pastel pink #FFD6E0 bright cute toy house diorama)
  let wallColor = 0xffd6e0; // Soft pastel pink #FFD6E0 (User requested)
  if (room.wallpaper === 'wall-pink-polka') {
    wallColor = 0xffd6e0;
  } else if (room.wallpaper === 'wall-starry-night') {
    wallColor = 0x2d1e38;
  } else if (room.wallpaper === 'wall-mint-forest') {
    wallColor = 0xe6f7ec;
  } else if (room.wallpaper === 'wall-sakura-blossom') {
    wallColor = 0xffd6e0;
  }

  const wallMat = getToonMaterial(wallColor, 0.4);

  const backWallGeo = new THREE.BoxGeometry(6.5, 4.2, 0.2);
  const backWallMesh = new THREE.Mesh(backWallGeo, wallMat);
  backWallMesh.position.set(0, 2.0, -3.3);
  backWallMesh.receiveShadow = true;
  group.add(backWallMesh);

  const leftWallGeo = new THREE.BoxGeometry(0.2, 4.2, 6.5);
  const leftWallMesh = new THREE.Mesh(leftWallGeo, wallMat);
  leftWallMesh.position.set(-3.3, 2.0, 0);
  leftWallMesh.receiveShadow = true;
  group.add(leftWallMesh);

  // Cute toy-house chair rail & wainscoting molding trim
  const chairRailMat = getToonMaterial(0xffffff, 0.25);
  const backRailGeo = new THREE.BoxGeometry(6.5, 0.08, 0.08);
  const backRail = new THREE.Mesh(backRailGeo, chairRailMat);
  backRail.position.set(0, 1.35, -3.22);
  group.add(backRail);

  const leftRailGeo = new THREE.BoxGeometry(0.08, 0.08, 6.5);
  const leftRail = new THREE.Mesh(leftRailGeo, chairRailMat);
  leftRail.position.set(-3.22, 1.35, 0);
  group.add(leftRail);

  // Toy-house crown molding along top
  const crownGeo = new THREE.BoxGeometry(6.5, 0.12, 0.1);
  const backCrown = new THREE.Mesh(crownGeo, chairRailMat);
  backCrown.position.set(0, 4.04, -3.22);
  group.add(backCrown);

  // 4. Window with Scenic Sky & Cute Pink Curtains
  const windowGroup = new THREE.Group();
  windowGroup.position.set(-1.2, 2.3, -3.18);

  const winFrameGeo = new THREE.BoxGeometry(1.6, 1.8, 0.08);
  const winFrameMat = getToonMaterial(0xffffff, 0.2);
  const winFrame = new THREE.Mesh(winFrameGeo, winFrameMat);
  windowGroup.add(winFrame);

  const glassGeo = new THREE.PlaneGeometry(1.35, 1.55);
  const glassColor = isSleeping ? 0x130f40 : 0x74b9ff;
  const glassMat = getEmissiveMaterial(glassColor, isSleeping ? 0.3 : 0.6);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.z = 0.045;
  windowGroup.add(glass);

  // Window mullions (crossbars)
  const barH = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 0.06), winFrameMat);
  barH.position.z = 0.05;
  windowGroup.add(barH);
  const barV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.55, 0.06), winFrameMat);
  barV.position.z = 0.05;
  windowGroup.add(barV);

  // Window sill
  const sillGeo = new THREE.BoxGeometry(1.8, 0.08, 0.24);
  const sill = new THREE.Mesh(sillGeo, winFrameMat);
  sill.position.set(0, -0.94, 0.08);
  windowGroup.add(sill);

  // 2) Pink Curtains on window: White rod with pastel pink finials, valance & draped side curtains
  const rodMat = getToonMaterial(0xffffff, 0.25);
  const rodGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.15, 12);
  rodGeo.rotateZ(Math.PI / 2);
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.position.set(0, 0.98, 0.12);
  windowGroup.add(rod);

  const finialGeo = new THREE.SphereGeometry(0.065, 12, 12);
  const finialMat = getToonMaterial(0xffb8cb, 0.3);
  const leftFinial = new THREE.Mesh(finialGeo, finialMat);
  leftFinial.position.set(-1.08, 0.98, 0.12);
  windowGroup.add(leftFinial);

  const rightFinial = new THREE.Mesh(finialGeo, finialMat);
  rightFinial.position.set(1.08, 0.98, 0.12);
  windowGroup.add(rightFinial);

  // Scalloped Top Valance in soft pastel pink #FFD6E0
  const valanceGeo = new THREE.BoxGeometry(1.9, 0.24, 0.06);
  const valanceMat = getToonMaterial(0xffd6e0, 0.45);
  const valance = new THREE.Mesh(valanceGeo, valanceMat);
  valance.position.set(0, 0.88, 0.11);
  windowGroup.add(valance);

  // Left & Right draped pink curtains with tie-back bows
  const curtainMat = getToonMaterial(0xffb8cb, 0.55);
  const curtainTieMat = getToonMaterial(0xffffff, 0.3);
  const drapeGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.7, 16);
  drapeGeo.scale(0.65, 1.0, 0.38);

  const tieGeo = new THREE.TorusGeometry(0.19, 0.028, 8, 16);
  tieGeo.rotateX(Math.PI / 2);

  const bowGeo = new THREE.SphereGeometry(0.045, 8, 8);
  bowGeo.scale(1.4, 0.8, 0.5);

  // Left Curtain Drape
  const leftCurtainGroup = new THREE.Group();
  leftCurtainGroup.position.set(-0.76, -0.02, 0.1);
  const leftDrape = new THREE.Mesh(drapeGeo, curtainMat);
  leftCurtainGroup.add(leftDrape);
  const leftTie = new THREE.Mesh(tieGeo, curtainTieMat);
  leftTie.position.y = -0.15;
  leftCurtainGroup.add(leftTie);
  const leftBow = new THREE.Mesh(bowGeo, curtainTieMat);
  leftBow.position.set(0.13, -0.15, 0.05);
  leftCurtainGroup.add(leftBow);
  windowGroup.add(leftCurtainGroup);

  // Right Curtain Drape
  const rightCurtainGroup = new THREE.Group();
  rightCurtainGroup.position.set(0.76, -0.02, 0.1);
  const rightDrape = new THREE.Mesh(drapeGeo, curtainMat);
  rightCurtainGroup.add(rightDrape);
  const rightTie = new THREE.Mesh(tieGeo, curtainTieMat);
  rightTie.position.y = -0.15;
  rightCurtainGroup.add(rightTie);
  const rightBow = new THREE.Mesh(bowGeo, curtainTieMat);
  rightBow.position.set(-0.13, -0.15, 0.05);
  rightCurtainGroup.add(rightBow);
  windowGroup.add(rightCurtainGroup);

  // Small potted succulent plant on window sill
  const sillPlantGroup = new THREE.Group();
  sillPlantGroup.position.set(-0.52, -0.76, 0.12);
  const miniPotGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.15, 12);
  const miniPotMat = getToonMaterial(0xffffff, 0.25);
  const miniPot = new THREE.Mesh(miniPotGeo, miniPotMat);
  sillPlantGroup.add(miniPot);
  const soilGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.02, 12);
  const soilMat = getToonMaterial(0x593d29, 0.8);
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.position.y = 0.075;
  sillPlantGroup.add(soil);
  const miniLeafGeo = new THREE.SphereGeometry(0.045, 8, 8);
  miniLeafGeo.scale(1.2, 0.45, 0.6);
  const miniLeafMat = getToonMaterial(0x7bed9f, 0.4);
  const miniTipMat = getToonMaterial(0xffa8ba, 0.4);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const leafMesh = new THREE.Mesh(miniLeafGeo, i % 2 === 0 ? miniLeafMat : miniTipMat);
    leafMesh.position.set(Math.sin(angle) * 0.05, 0.1, Math.cos(angle) * 0.05);
    leafMesh.rotation.y = angle;
    leafMesh.rotation.z = 0.35;
    sillPlantGroup.add(leafMesh);
  }
  windowGroup.add(sillPlantGroup);

  group.add(windowGroup);

  // 5. 3D Pet Bed (Based on room.bed)
  const bedGroup = new THREE.Group();
  bedGroup.name = 'pet-bed';
  const bedPosition = new THREE.Vector3(1.9, 0, -1.8);
  bedGroup.position.copy(bedPosition);

  buildBedModel(bedGroup, room.bed);
  group.add(bedGroup);

  // 6. Food Bowl (Ceramic bowl with delicious dynamic 3D seeds / treats)
  const foodBowlGroup = new THREE.Group();
  foodBowlGroup.name = 'food-bowl';
  const foodBowlPosition = new THREE.Vector3(-1.8, 0, 1.2);
  foodBowlGroup.position.copy(foodBowlPosition);

  // Outer ceramic bowl body
  const bowlBaseGeo = new THREE.CylinderGeometry(0.42, 0.32, 0.22, 24);
  const bowlMat = getToonMaterial(0xff9f43, 0.25);
  const bowlMesh = new THREE.Mesh(bowlBaseGeo, bowlMat);
  bowlMesh.position.y = 0.11;
  bowlMesh.castShadow = true;
  bowlMesh.receiveShadow = true;
  foodBowlGroup.add(bowlMesh);

  // Smooth rolled ceramic rim
  const rimGeo = new THREE.TorusGeometry(0.41, 0.035, 12, 24);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, bowlMat);
  rimMesh.position.y = 0.22;
  foodBowlGroup.add(rimMesh);

  // Porcelain interior lining
  const innerLiningGeo = new THREE.CylinderGeometry(0.38, 0.3, 0.18, 20);
  const innerMat = getToonMaterial(0xfff7ed, 0.3);
  const innerLining = new THREE.Mesh(innerLiningGeo, innerMat);
  innerLining.position.y = 0.12;
  foodBowlGroup.add(innerLining);

  // Cute white heart / paw badge on the front of the food bowl
  const emblemGeo = new THREE.SphereGeometry(0.065, 8, 8);
  emblemGeo.scale(1.2, 1.0, 0.3);
  const emblemMat = getToonMaterial(0xffffff, 0.2);
  const emblem = new THREE.Mesh(emblemGeo, emblemMat);
  emblem.position.set(0, 0.12, 0.39);
  foodBowlGroup.add(emblem);

  // Food Pellets container (Dynamic 3D food inside bowl)
  const foodPelletsGroup = new THREE.Group();
  foodPelletsGroup.name = 'food-pellets-group';
  foodPelletsGroup.position.y = 0.16;
  populateFoodBowl(foodPelletsGroup, 'seeds');
  foodBowlGroup.add(foodPelletsGroup);

  group.add(foodBowlGroup);

  // 7. Water Bowl / Dispenser (Ceramic dish with crystal water & ripple)
  const waterBowlGroup = new THREE.Group();
  waterBowlGroup.name = 'water-bowl';
  const waterBowlPosition = new THREE.Vector3(-1.8, 0, 0.2);
  waterBowlGroup.position.copy(waterBowlPosition);

  // Ceramic water bowl
  const wBowlGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.2, 24);
  const wBowlMat = getToonMaterial(0x48dbfb, 0.25);
  const wBowlMesh = new THREE.Mesh(wBowlGeo, wBowlMat);
  wBowlMesh.position.y = 0.1;
  wBowlMesh.castShadow = true;
  wBowlMesh.receiveShadow = true;
  waterBowlGroup.add(wBowlMesh);

  // Water bowl rolled rim
  const wRimGeo = new THREE.TorusGeometry(0.37, 0.03, 12, 24);
  wRimGeo.rotateX(Math.PI / 2);
  const wRimMesh = new THREE.Mesh(wRimGeo, wBowlMat);
  wRimMesh.position.y = 0.2;
  waterBowlGroup.add(wRimMesh);

  // Front water droplet emblem on bowl
  const dropEmblemGeo = new THREE.ConeGeometry(0.045, 0.09, 8);
  dropEmblemGeo.rotateZ(Math.PI);
  const dropEmblem = new THREE.Mesh(dropEmblemGeo, emblemMat);
  dropEmblem.position.set(0, 0.11, 0.35);
  dropEmblem.rotation.x = -0.15;
  waterBowlGroup.add(dropEmblem);

  // Crystal Water Surface
  const waterGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.025, 24);
  const waterMat = getGlassMaterial(0x0abde3, 0.85);
  const waterSurfaceMesh = new THREE.Mesh(waterGeo, waterMat);
  waterSurfaceMesh.position.y = 0.16;
  waterBowlGroup.add(waterSurfaceMesh);

  // Animated ripple ring child on water
  const rippleRingGeo = new THREE.RingGeometry(0.05, 0.12, 16);
  rippleRingGeo.rotateX(-Math.PI / 2);
  const rippleMat = getEmissiveMaterial(0x54a0ff, 0.4);
  const rippleMesh = new THREE.Mesh(rippleRingGeo, rippleMat);
  rippleMesh.position.y = 0.175;
  rippleMesh.name = 'water-ripple-mesh';
  waterBowlGroup.add(rippleMesh);

  group.add(waterBowlGroup);

  // 8. 3D Toy in Room (Ball, duck, or yarn)
  const toyGroup = new THREE.Group();
  toyGroup.name = 'pet-toy';
  const toyPosition = new THREE.Vector3(0.9, 0, 1.4);
  toyGroup.position.copy(toyPosition);

  buildToyModel(toyGroup);
  group.add(toyGroup);

  // 1) Small Colorful Toys on Floor: Stacking Ring Pyramid, Yellow Rubber Duck, Building Blocks, Yarn Ball
  const floorToysGroup = new THREE.Group();
  floorToysGroup.name = 'colorful-floor-toys';

  // Toy A: Pastel Wooden Stacking Ring Pyramid at (1.35, 0, 0.85)
  const stackGroup = new THREE.Group();
  stackGroup.position.set(1.35, 0, 0.85);

  const stackPostGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.38, 12);
  const stackPostMat = getToonMaterial(0xfff0d6, 0.5);
  const stackPost = new THREE.Mesh(stackPostGeo, stackPostMat);
  stackPost.position.y = 0.19;
  stackPost.castShadow = true;
  stackGroup.add(stackPost);

  const stackColors = [0x55efc4, 0x74b9ff, 0xffeaa7, 0xff7675]; // Mint, Sky Blue, Pastel Yellow, Coral Pink
  const stackRadii = [0.18, 0.15, 0.12, 0.09];
  stackRadii.forEach((r, idx) => {
    const ringGeo = new THREE.TorusGeometry(r, 0.036, 10, 20);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = getToonMaterial(stackColors[idx], 0.35);
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.05 + idx * 0.07;
    ringMesh.castShadow = true;
    stackGroup.add(ringMesh);
  });

  const topperGeo = new THREE.SphereGeometry(0.065, 12, 10);
  const topperMat = getToonMaterial(0xffd32a, 0.25);
  const topperMesh = new THREE.Mesh(topperGeo, topperMat);
  topperMesh.position.y = 0.36;
  stackGroup.add(topperMesh);
  floorToysGroup.add(stackGroup);

  // Toy B: Cute Yellow Rubber Duck at (-0.95, 0, 1.6)
  const duckGroup = new THREE.Group();
  duckGroup.position.set(-0.95, 0, 1.6);
  duckGroup.rotation.y = 0.45;

  const duckBodyGeo = new THREE.SphereGeometry(0.14, 14, 12);
  duckBodyGeo.scale(1.2, 0.9, 0.9);
  const duckMat = getToonMaterial(0xffda79, 0.3);
  const duckBody = new THREE.Mesh(duckBodyGeo, duckMat);
  duckBody.position.y = 0.12;
  duckBody.castShadow = true;
  duckGroup.add(duckBody);

  const duckHeadGeo = new THREE.SphereGeometry(0.095, 12, 12);
  const duckHead = new THREE.Mesh(duckHeadGeo, duckMat);
  duckHead.position.set(0.09, 0.22, 0);
  duckGroup.add(duckHead);

  const duckBeakGeo = new THREE.ConeGeometry(0.045, 0.09, 8);
  duckBeakGeo.rotateZ(-Math.PI / 2);
  const duckBeakMat = getToonMaterial(0xff793f, 0.3);
  const duckBeak = new THREE.Mesh(duckBeakGeo, duckBeakMat);
  duckBeak.position.set(0.18, 0.21, 0);
  duckGroup.add(duckBeak);

  const duckEyeGeo = new THREE.SphereGeometry(0.018, 6, 6);
  const duckEyeMat = getToonMaterial(0x111111, 0.1);
  const duckEyeL = new THREE.Mesh(duckEyeGeo, duckEyeMat);
  duckEyeL.position.set(0.14, 0.24, 0.075);
  duckGroup.add(duckEyeL);
  const duckEyeR = new THREE.Mesh(duckEyeGeo, duckEyeMat);
  duckEyeR.position.set(0.14, 0.24, -0.075);
  duckGroup.add(duckEyeR);
  floorToysGroup.add(duckGroup);

  // Toy C: Pastel Wooden ABC Building Blocks at (1.7, 0, 0.1)
  const blockGroup = new THREE.Group();
  blockGroup.position.set(1.7, 0, 0.1);
  const blockGeo = new THREE.BoxGeometry(0.16, 0.16, 0.16);

  const block1Mat = getToonMaterial(0xffa8ba, 0.35); // Soft pink
  const block1 = new THREE.Mesh(blockGeo, block1Mat);
  block1.position.set(0, 0.08, 0);
  block1.rotation.y = 0.15;
  block1.castShadow = true;
  blockGroup.add(block1);

  const block2Mat = getToonMaterial(0xa8e6cf, 0.35); // Pastel mint
  const block2 = new THREE.Mesh(blockGeo, block2Mat);
  block2.position.set(0.14, 0.08, -0.12);
  block2.rotation.y = -0.3;
  block2.castShadow = true;
  blockGroup.add(block2);

  const block3Mat = getToonMaterial(0xdda0dd, 0.35); // Pastel lavender
  const block3 = new THREE.Mesh(blockGeo, block3Mat);
  block3.position.set(0.03, 0.24, -0.04);
  block3.rotation.y = 0.45;
  block3.castShadow = true;
  blockGroup.add(block3);
  floorToysGroup.add(blockGroup);

  // Toy D: Pastel Lavender Yarn Ball at (-1.1, 0, -0.7)
  const yarnGroup = new THREE.Group();
  yarnGroup.position.set(-1.1, 0, -0.7);
  const yarnGeo = new THREE.SphereGeometry(0.13, 14, 12);
  const yarnMat = getToonMaterial(0xdda0dd, 0.65);
  const yarn = new THREE.Mesh(yarnGeo, yarnMat);
  yarn.position.y = 0.13;
  yarn.castShadow = true;
  yarnGroup.add(yarn);

  const yarnBandGeo = new THREE.TorusGeometry(0.132, 0.018, 8, 16);
  const yarnBandMat = getToonMaterial(0xee82ee, 0.6);
  const yarnBand = new THREE.Mesh(yarnBandGeo, yarnBandMat);
  yarnBand.position.y = 0.13;
  yarnBand.rotation.x = 0.5;
  yarnGroup.add(yarnBand);
  floorToysGroup.add(yarnGroup);

  group.add(floorToysGroup);

  // 4) Fluffy Rug Under Hamster in Center of Room (Plush Flower Petal shape in soft pastel pink & cream)
  const fluffyRugGroup = new THREE.Group();
  fluffyRugGroup.name = 'fluffy-rug-under-hamster';
  fluffyRugGroup.position.set(0, 0, 0);

  const rugBaseGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.02, 32);
  const rugBaseMat = getToonMaterial(0xffe9f0, 0.7);
  const rugBaseMesh = new THREE.Mesh(rugBaseGeo, rugBaseMat);
  rugBaseMesh.position.y = 0.01;
  rugBaseMesh.receiveShadow = true;
  fluffyRugGroup.add(rugBaseMesh);

  // Soft pastel pink fluffy flower petals around perimeter (#FFD6E0)
  const petalGeo = new THREE.SphereGeometry(0.36, 16, 12);
  petalGeo.scale(1.0, 0.14, 0.9);
  const petalMat = getToonMaterial(0xffd6e0, 0.75);
  const petalCount = 8;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.sin(angle) * 1.15, 0.015, Math.cos(angle) * 1.15);
    petal.rotation.y = angle;
    petal.receiveShadow = true;
    fluffyRugGroup.add(petal);
  }

  // Inner plush circle (#FFF8F0 warm cream)
  const innerRugGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.022, 28);
  const innerRugMat = getToonMaterial(0xfff8f0, 0.85);
  const innerRugMesh = new THREE.Mesh(innerRugGeo, innerRugMat);
  innerRugMesh.position.y = 0.012;
  innerRugMesh.receiveShadow = true;
  fluffyRugGroup.add(innerRugMesh);

  // Delicate cute center paw-print detail in baby-pink (#FFB6C1)
  const pawPadGeo = new THREE.SphereGeometry(0.12, 12, 10);
  pawPadGeo.scale(1.2, 0.08, 1.0);
  const pawMat = getToonMaterial(0xffb6c1, 0.6);
  const pawMain = new THREE.Mesh(pawPadGeo, pawMat);
  pawMain.position.set(0, 0.024, -0.02);
  fluffyRugGroup.add(pawMain);

  const toeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  toeGeo.scale(1.0, 0.08, 1.0);
  const toeOffsets = [
    { x: -0.12, z: 0.13 },
    { x: -0.04, z: 0.17 },
    { x: 0.04, z: 0.17 },
    { x: 0.12, z: 0.13 },
  ];
  toeOffsets.forEach(to => {
    const toe = new THREE.Mesh(toeGeo, pawMat);
    toe.position.set(to.x, 0.024, to.z);
    fluffyRugGroup.add(toe);
  });
  group.add(fluffyRugGroup);

  // 3) Small Star Lights on Walls (Glowing pastel star string lights on back & left walls)
  const starLightsGroup = new THREE.Group();
  starLightsGroup.name = 'wall-star-lights';

  const starColors = [0xffeaa7, 0xffd1dc, 0xfff0a6, 0xffd6e0, 0xffeaa7, 0xffc2d4, 0xfff3a8];
  const starPoints = [
    { x: -2.7, y: 3.48, z: -3.2 },
    { x: -2.1, y: 3.32, z: -3.2 },
    { x: -1.5, y: 3.42, z: -3.2 },
    { x: -0.9, y: 3.28, z: -3.2 },
    { x: -0.3, y: 3.44, z: -3.2 },
    { x: 0.3, y: 3.30, z: -3.2 },
    { x: 0.9, y: 3.45, z: -3.2 },
    { x: 1.5, y: 3.32, z: -3.2 },
    { x: 2.1, y: 3.46, z: -3.2 },
    { x: 2.7, y: 3.35, z: -3.2 },
  ];

  // Wire for back wall
  for (let i = 0; i < starPoints.length - 1; i++) {
    const p1 = starPoints[i];
    const p2 = starPoints[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2 - 0.06;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, p1.z),
      new THREE.Vector3(midX, midY, p1.z),
      new THREE.Vector3(p2.x, p2.y, p2.z)
    );
    const wireGeo = new THREE.TubeGeometry(curve, 10, 0.008, 6, false);
    const wireMat = getToonMaterial(0xffffff, 0.4);
    const wire = new THREE.Mesh(wireGeo, wireMat);
    starLightsGroup.add(wire);
  }

  // Left wall star string
  const leftStarPoints = [
    { x: -3.2, y: 3.48, z: -2.7 },
    { x: -3.2, y: 3.32, z: -2.0 },
    { x: -3.2, y: 3.44, z: -1.3 },
    { x: -3.2, y: 3.28, z: -0.6 },
    { x: -3.2, y: 3.42, z: 0.1 },
    { x: -3.2, y: 3.30, z: 0.8 },
    { x: -3.2, y: 3.46, z: 1.5 },
  ];

  for (let i = 0; i < leftStarPoints.length - 1; i++) {
    const p1 = leftStarPoints[i];
    const p2 = leftStarPoints[i + 1];
    const midZ = (p1.z + p2.z) / 2;
    const midY = (p1.y + p2.y) / 2 - 0.06;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, p1.z),
      new THREE.Vector3(p1.x, midY, midZ),
      new THREE.Vector3(p2.x, p2.y, p2.z)
    );
    const wireGeo = new THREE.TubeGeometry(curve, 10, 0.008, 6, false);
    const wireMat = getToonMaterial(0xffffff, 0.4);
    const wire = new THREE.Mesh(wireGeo, wireMat);
    starLightsGroup.add(wire);
  }

  function create3DStar(colorHex: number) {
    const starGroup = new THREE.Group();
    const coreGeo = new THREE.SphereGeometry(0.065, 10, 8);
    const starMat = getEmissiveMaterial(colorHex, isSleeping ? 1.5 : 1.0);
    const core = new THREE.Mesh(coreGeo, starMat);
    starGroup.add(core);

    const diamondGeo1 = new THREE.BoxGeometry(0.18, 0.05, 0.04);
    diamondGeo1.rotateZ(Math.PI / 4);
    const d1 = new THREE.Mesh(diamondGeo1, starMat);
    starGroup.add(d1);

    const diamondGeo2 = new THREE.BoxGeometry(0.05, 0.18, 0.04);
    diamondGeo2.rotateZ(Math.PI / 4);
    const d2 = new THREE.Mesh(diamondGeo2, starMat);
    starGroup.add(d2);

    return starGroup;
  }

  starPoints.forEach((pt, idx) => {
    const star = create3DStar(starColors[idx % starColors.length]);
    star.position.set(pt.x, pt.y - 0.04, pt.z + 0.06);
    starLightsGroup.add(star);
  });

  leftStarPoints.forEach((pt, idx) => {
    const star = create3DStar(starColors[(idx + 3) % starColors.length]);
    star.position.set(pt.x + 0.06, pt.y - 0.04, pt.z);
    star.rotation.y = Math.PI / 2;
    starLightsGroup.add(star);
  });
  group.add(starLightsGroup);

  // 5) Wall Posters & More Plant Decorations
  // Poster 1 on Back Wall (Cute Smiling Strawberry Art)
  const poster1Group = new THREE.Group();
  poster1Group.position.set(1.05, 2.45, -3.18);

  const frameMat = getToonMaterial(0xffffff, 0.2);
  const frame1Geo = new THREE.BoxGeometry(1.05, 1.35, 0.05);
  const frame1 = new THREE.Mesh(frame1Geo, frameMat);
  poster1Group.add(frame1);

  const paper1Geo = new THREE.PlaneGeometry(0.92, 1.22);
  const paper1Mat = getToonMaterial(0xfffdf7, 0.4);
  const paper1 = new THREE.Mesh(paper1Geo, paper1Mat);
  paper1.position.z = 0.028;
  poster1Group.add(paper1);

  // Strawberry artwork on poster
  const strawbGeo = new THREE.ConeGeometry(0.24, 0.42, 16);
  strawbGeo.rotateX(Math.PI);
  const strawbMat = getToonMaterial(0xff5252, 0.35);
  const strawb = new THREE.Mesh(strawbGeo, strawbMat);
  strawb.position.set(0, -0.04, 0.038);
  poster1Group.add(strawb);

  const strawbLeafGeo = new THREE.ConeGeometry(0.06, 0.16, 6);
  const strawbLeafMat = getToonMaterial(0x2ed573, 0.4);
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(strawbLeafGeo, strawbLeafMat);
    leaf.position.set((i - 1) * 0.08, 0.21, 0.04);
    leaf.rotation.z = (i - 1) * -0.4;
    poster1Group.add(leaf);
  }

  // Cute face dots on strawberry
  const faceDotGeo = new THREE.SphereGeometry(0.02, 6, 6);
  const faceMat = getToonMaterial(0x222222, 0.2);
  const eyeL = new THREE.Mesh(faceDotGeo, faceMat);
  eyeL.position.set(-0.06, 0.02, 0.16);
  poster1Group.add(eyeL);
  const eyeR = new THREE.Mesh(faceDotGeo, faceMat);
  eyeR.position.set(0.06, 0.02, 0.16);
  poster1Group.add(eyeR);
  const blushMat = getToonMaterial(0xffb8cb, 0.2);
  const blushL = new THREE.Mesh(faceDotGeo, blushMat);
  blushL.position.set(-0.1, -0.01, 0.15);
  poster1Group.add(blushL);
  const blushR = new THREE.Mesh(faceDotGeo, blushMat);
  blushR.position.set(0.1, -0.01, 0.15);
  poster1Group.add(blushR);

  group.add(poster1Group);

  // Poster 2 on Left Wall (Cute Pastel Rainbow Art)
  const poster2Group = new THREE.Group();
  poster2Group.position.set(-3.18, 2.45, -1.35);
  poster2Group.rotation.y = Math.PI / 2;

  const frame2Geo = new THREE.BoxGeometry(0.95, 1.15, 0.05);
  const frame2 = new THREE.Mesh(frame2Geo, frameMat);
  poster2Group.add(frame2);

  const paper2Geo = new THREE.PlaneGeometry(0.82, 1.02);
  const paper2Mat = getToonMaterial(0xffe9f0, 0.4);
  const paper2 = new THREE.Mesh(paper2Geo, paper2Mat);
  paper2.position.z = 0.028;
  poster2Group.add(paper2);

  // Rainbow arches
  const rainbowColors = [0xff7675, 0xfeca57, 0x55efc4, 0x54a0ff];
  rainbowColors.forEach((color, idx) => {
    const archGeo = new THREE.TorusGeometry(0.26 - idx * 0.045, 0.02, 8, 24, Math.PI);
    const archMat = getToonMaterial(color, 0.35);
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, -0.02, 0.038);
    poster2Group.add(arch);
  });

  // Clouds at rainbow base
  const cloudPuffGeo = new THREE.SphereGeometry(0.07, 10, 8);
  const cloudMat = getToonMaterial(0xffffff, 0.3);
  [-0.26, 0.26].forEach(cx => {
    const c1 = new THREE.Mesh(cloudPuffGeo, cloudMat);
    c1.position.set(cx, -0.04, 0.04);
    poster2Group.add(c1);
    const c2 = new THREE.Mesh(cloudPuffGeo, cloudMat);
    c2.position.set(cx + (cx < 0 ? 0.05 : -0.05), -0.02, 0.04);
    c2.scale.set(0.8, 0.8, 0.8);
    poster2Group.add(c2);
  });
  group.add(poster2Group);

  // Plant & Shelf on Left Wall: Floating shelf with trailing ivy plant and mini books
  const shelfGroup = new THREE.Group();
  shelfGroup.position.set(-3.18, 1.85, 0.7);
  shelfGroup.rotation.y = Math.PI / 2;

  const shelfBoardGeo = new THREE.BoxGeometry(0.9, 0.04, 0.24);
  const shelfBoard = new THREE.Mesh(shelfBoardGeo, frameMat);
  shelfGroup.add(shelfBoard);

  // Potted trailing ivy plant on shelf
  const shelfPotGeo = new THREE.CylinderGeometry(0.08, 0.065, 0.14, 12);
  const shelfPotMat = getToonMaterial(0xffb8cb, 0.3);
  const shelfPot = new THREE.Mesh(shelfPotGeo, shelfPotMat);
  shelfPot.position.set(-0.25, 0.09, 0);
  shelfGroup.add(shelfPot);

  // Trailing vine leaves hanging off shelf
  const vineLeafGeo = new THREE.SphereGeometry(0.04, 8, 8);
  vineLeafGeo.scale(1.2, 0.3, 0.8);
  const vineMat = getToonMaterial(0x2ed573, 0.4);
  for (let i = 0; i < 7; i++) {
    const vl = new THREE.Mesh(vineLeafGeo, vineMat);
    vl.position.set(-0.25 + (i % 2 === 0 ? 0.04 : -0.04), 0.1 - i * 0.05, 0.06 + i * 0.02);
    vl.rotation.z = i * 0.3;
    shelfGroup.add(vl);
  }

  // Row of 3 cute pastel mini books
  const bookGeo = new THREE.BoxGeometry(0.035, 0.16, 0.14);
  const bookColors = [0x74b9ff, 0xa29bfe, 0xffeaa7];
  bookColors.forEach((bc, idx) => {
    const book = new THREE.Mesh(bookGeo, getToonMaterial(bc, 0.3));
    book.position.set(0.12 + idx * 0.05, 0.1, 0);
    shelfGroup.add(book);
  });
  group.add(shelfGroup);

  // Plant Stand in Front-Right Corner: Wooden Tripod Stool with Lush Potted Houseplant
  const plantStandGroup = new THREE.Group();
  plantStandGroup.position.set(2.35, 0, 1.25);

  const seatGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16);
  const woodMat = getToonMaterial(0xfff0d6, 0.4);
  const seat = new THREE.Mesh(seatGeo, woodMat);
  seat.position.y = 0.42;
  seat.castShadow = true;
  plantStandGroup.add(seat);

  const legGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.44, 8);
  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(legGeo, woodMat);
    const angle = (i / 3) * Math.PI * 2;
    leg.position.set(Math.sin(angle) * 0.16, 0.22, Math.cos(angle) * 0.16);
    leg.rotation.z = Math.sin(angle) * -0.12;
    leg.rotation.x = Math.cos(angle) * 0.12;
    leg.castShadow = true;
    plantStandGroup.add(leg);
  }

  const cornerPotGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.24, 16);
  const cornerPotMat = getToonMaterial(0xa8e6cf, 0.35); // Pastel mint ceramic
  const cornerPot = new THREE.Mesh(cornerPotGeo, cornerPotMat);
  cornerPot.position.y = 0.56;
  cornerPot.castShadow = true;
  plantStandGroup.add(cornerPot);

  const bigLeafGeo = new THREE.SphereGeometry(0.14, 10, 8);
  bigLeafGeo.scale(1.3, 0.2, 0.8);
  const houseLeafMat = getToonMaterial(0x2ed573, 0.4);
  const babyLeafMat = getToonMaterial(0x7bed9f, 0.4);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(bigLeafGeo, i % 2 === 0 ? houseLeafMat : babyLeafMat);
    leaf.position.set(Math.sin(angle) * 0.12, 0.69 + (i % 2) * 0.05, Math.cos(angle) * 0.12);
    leaf.rotation.y = angle;
    leaf.rotation.z = 0.35;
    plantStandGroup.add(leaf);
  }
  group.add(plantStandGroup);

  // Custom User Decor (Decor plant, teddy plushie, string lights, rug)
  const decorGroup = new THREE.Group();
  decorGroup.name = 'room-decor';
  buildDecorModel(decorGroup, room.decor);
  group.add(decorGroup);

  return {
    group,
    floorMesh,
    backWallMesh,
    leftWallMesh,
    bedGroup,
    bedPosition,
    foodBowlGroup,
    foodBowlPosition,
    foodPelletsGroup,
    waterBowlGroup,
    waterBowlPosition,
    waterSurfaceMesh,
    toyGroup,
    toyPosition,
    decorGroup,
    windowGroup,
    nightLights,
    dayLights,
  };
}

function buildBedModel(group: THREE.Group, bedType: string) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (bedType === 'bed-basket') {
    // Wicker basket
    const basketGeo = new THREE.CylinderGeometry(0.85, 0.75, 0.35, 24, 1, true);
    const basketMat = getToonMaterial(0xcca070, 0.6);
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.y = 0.18;
    basket.castShadow = true;
    group.add(basket);

    // Fluffy round cushion inside
    const cushionGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.22, 20);
    const cushionMat = getToonMaterial(0xfff5eb, 0.7);
    const cushion = new THREE.Mesh(cushionGeo, cushionMat);
    cushion.position.y = 0.15;
    group.add(cushion);
  } else if (bedType === 'bed-strawberry') {
    // Strawberry dome
    const domeGeo = new THREE.SphereGeometry(0.85, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const domeMat = getToonMaterial(0xff6b81, 0.4);
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.2;
    dome.castShadow = true;
    group.add(dome);

    // Green leaves on top
    for (let i = 0; i < 5; i++) {
      const leafGeo = new THREE.ConeGeometry(0.14, 0.35, 8);
      const leafMat = getToonMaterial(0x2ed573, 0.4);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const angle = (i / 5) * Math.PI * 2;
      leaf.position.set(Math.sin(angle) * 0.25, 0.85, Math.cos(angle) * 0.25);
      leaf.rotation.x = 0.6;
      leaf.rotation.y = angle;
      group.add(leaf);
    }

    // Plush mattress inside
    const matGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.16, 20);
    const matMat = getToonMaterial(0xffffff, 0.6);
    const mattress = new THREE.Mesh(matGeo, matMat);
    mattress.position.y = 0.1;
    group.add(mattress);
  } else if (bedType === 'bed-canopy') {
    // Royal canopy bed
    const baseGeo = new THREE.BoxGeometry(1.6, 0.24, 1.4);
    const baseMat = getToonMaterial(0x574b90, 0.4);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.12;
    base.castShadow = true;
    group.add(base);

    // 4 Golden posts
    const postMat = getToonMaterial(0xfbc531, 0.2);
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 12);

    const offsets = [
      [-0.7, -0.6],
      [0.7, -0.6],
      [-0.7, 0.6],
      [0.7, 0.6],
    ];
    offsets.forEach(([x, z]) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0.9, z);
      group.add(post);
    });

    // Velvet mattress
    const cushGeo = new THREE.BoxGeometry(1.4, 0.2, 1.2);
    const cushMat = getToonMaterial(0x786fa6, 0.5);
    const cush = new THREE.Mesh(cushGeo, cushMat);
    cush.position.y = 0.26;
    group.add(cush);
  } else {
    // Default Puffy Cloud Cushion
    const cloudCenterGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.22, 24);
    const cloudMat = getToonMaterial(0xe8f4f8, 0.8);
    const cloudCenter = new THREE.Mesh(cloudCenterGeo, cloudMat);
    cloudCenter.position.y = 0.12;
    cloudCenter.castShadow = true;
    group.add(cloudCenter);

    // Little cloud puffs around edge
    const puffGeo = new THREE.SphereGeometry(0.24, 14, 12);
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(Math.sin(angle) * 0.72, 0.15, Math.cos(angle) * 0.72);
      group.add(puff);
    }
  }
}

function buildToyModel(group: THREE.Group) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  // Cute colorful bouncy ball with stripes
  const ballGeo = new THREE.SphereGeometry(0.24, 20, 20);
  const ballMat = getToonMaterial(0xff4757, 0.3);
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.y = 0.24;
  ball.castShadow = true;
  group.add(ball);

  const stripeGeo = new THREE.TorusGeometry(0.242, 0.028, 12, 24);
  const stripeMat = getToonMaterial(0xfffa65, 0.3);
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = 0.24;
  group.add(stripe);
}

function buildDecorModel(group: THREE.Group, decorType: string) {
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }

  if (decorType === 'decor-lights') {
    // String Fairy Lights along back wall
    const stringGroup = new THREE.Group();
    stringGroup.position.set(0, 3.2, -3.15);

    const lightColors = [0xff7675, 0x74b9ff, 0x55efc4, 0xfdcb6e, 0xa29bfe];
    for (let i = 0; i < 7; i++) {
      const bulbGeo = new THREE.SphereGeometry(0.08, 10, 10);
      const bulbMat = getEmissiveMaterial(lightColors[i % lightColors.length], 0.9);
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      const x = -2.4 + i * 0.8;
      const sag = Math.sin((i / 6) * Math.PI) * 0.25;
      bulb.position.set(x, -sag, 0);
      stringGroup.add(bulb);
    }
    group.add(stringGroup);
  } else if (decorType === 'decor-plushie') {
    // Teddy Bear Plushie on corner table
    const plushGroup = new THREE.Group();
    plushGroup.position.set(2.4, 0.35, -2.6);

    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const bearMat = getToonMaterial(0x833471, 0.6);
    const head = new THREE.Mesh(headGeo, bearMat);
    head.position.y = 0.38;
    head.castShadow = true;
    plushGroup.add(head);

    const bodyGeo = new THREE.SphereGeometry(0.26, 16, 16);
    const body = new THREE.Mesh(bodyGeo, bearMat);
    body.position.y = 0.18;
    body.castShadow = true;
    plushGroup.add(body);

    group.add(plushGroup);
  } else if (decorType === 'decor-rug') {
    // Cute Bear Face Rug on center floor
    const rugGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.02, 32);
    const rugMat = getToonMaterial(0xeccc68, 0.8);
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(0, 0.015, 0);
    rug.receiveShadow = true;
    group.add(rug);
  } else {
    // Default Potted Plant with Leaves
    const plantGroup = new THREE.Group();
    plantGroup.position.set(2.4, 0, 0.8);

    // Terracotta pot
    const potGeo = new THREE.CylinderGeometry(0.28, 0.2, 0.45, 16);
    const potMat = getToonMaterial(0xe17055, 0.5);
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.225;
    pot.castShadow = true;
    plantGroup.add(pot);

    // Green leaves
    const leafGeo = new THREE.SphereGeometry(0.22, 12, 10);
    leafGeo.scale(1.2, 0.3, 0.7);
    const plantLeafMat = getToonMaterial(0x2ed573, 0.4);

    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(leafGeo, plantLeafMat);
      const angle = (i / 4) * Math.PI * 2;
      leaf.position.set(Math.sin(angle) * 0.18, 0.48, Math.cos(angle) * 0.18);
      leaf.rotation.y = angle;
      leaf.rotation.z = 0.3;
      plantGroup.add(leaf);
    }
    group.add(plantGroup);
  }
}

/**
 * Dynamically builds 3D food inside the food bowl:
 * - 'seeds': Sunflower seeds pile with striped hulls and golden kernels
 * - 'carrot': Crisp orange carrot wedges and miniature baby carrot with leafy fronds
 * - 'apple': Red glossy apple slices and mini whole apple with leaf & stem
 */
export function populateFoodBowl(foodPelletsGroup: THREE.Group, foodType: string = 'seeds') {
  foodPelletsGroup.clear();

  if (foodType === 'carrot') {
    // Vibrant 3D orange carrot slices and miniature whole baby carrot
    const carrotMat = getToonMaterial(0xff793f, 0.4);
    const carrotCoreMat = getToonMaterial(0xffa502, 0.3);
    const leafMat = getToonMaterial(0x2ed573, 0.5);

    // 4 Carrot slices
    const sliceGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12);
    [
      { x: -0.07, z: -0.05, rot: 0.2 },
      { x: 0.08, z: -0.06, rot: -0.3 },
      { x: -0.05, z: 0.07, rot: 0.4 },
      { x: 0.07, z: 0.06, rot: -0.15 },
    ].forEach((pos, idx) => {
      const slice = new THREE.Mesh(sliceGeo, idx % 2 === 0 ? carrotMat : carrotCoreMat);
      slice.position.set(pos.x, 0.02 * idx, pos.z);
      slice.rotation.set(0.1, pos.rot, 0.1);
      slice.castShadow = true;
      foodPelletsGroup.add(slice);
    });

    // Miniature baby carrot with green leafy top
    const babyCarrotGroup = new THREE.Group();
    babyCarrotGroup.position.set(0, 0.06, 0);
    babyCarrotGroup.rotation.set(0.1, 0.5, -0.2);

    const rootGeo = new THREE.ConeGeometry(0.065, 0.24, 10);
    rootGeo.rotateX(Math.PI);
    const root = new THREE.Mesh(rootGeo, carrotMat);
    babyCarrotGroup.add(root);

    // Leaf sprigs
    for (let i = 0; i < 3; i++) {
      const leafGeo = new THREE.ConeGeometry(0.02, 0.09, 6);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set((i - 1) * 0.02, 0.12, 0);
      leaf.rotation.z = (i - 1) * 0.35;
      babyCarrotGroup.add(leaf);
    }
    babyCarrotGroup.castShadow = true;
    foodPelletsGroup.add(babyCarrotGroup);

  } else if (foodType === 'apple') {
    // Glossy 3D red apple wedges and cute miniature apple
    const appleSkinMat = getToonMaterial(0xff3838, 0.2);
    const appleFleshMat = getToonMaterial(0xfffae6, 0.4);
    const appleSeedMat = getToonMaterial(0x3d1c02, 0.2);
    const leafMat = getToonMaterial(0x2ed573, 0.5);
    const stemMat = getToonMaterial(0x574b32, 0.6);

    // 3 Apple wedges/slices
    for (let i = 0; i < 3; i++) {
      const wedgeGroup = new THREE.Group();
      const angle = (i / 3) * Math.PI * 2;
      wedgeGroup.position.set(Math.sin(angle) * 0.08, 0.02, Math.cos(angle) * 0.08);
      wedgeGroup.rotation.y = angle + 0.3;

      // Outer red peel
      const skinGeo = new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI);
      skinGeo.scale(0.8, 1.2, 0.5);
      const skin = new THREE.Mesh(skinGeo, appleSkinMat);
      wedgeGroup.add(skin);

      // Inner flesh
      const fleshGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 8);
      const flesh = new THREE.Mesh(fleshGeo, appleFleshMat);
      flesh.position.y = 0.02;
      wedgeGroup.add(flesh);

      // Seed dot
      const seedGeo = new THREE.SphereGeometry(0.012, 6, 6);
      seedGeo.scale(1, 1.6, 0.6);
      const seed = new THREE.Mesh(seedGeo, appleSeedMat);
      seed.position.set(0.02, 0.035, 0);
      wedgeGroup.add(seed);

      foodPelletsGroup.add(wedgeGroup);
    }

    // Cute mini whole apple in the center
    const miniAppleGroup = new THREE.Group();
    miniAppleGroup.position.set(0, 0.05, 0);
    const appleBodyGeo = new THREE.SphereGeometry(0.075, 12, 12);
    appleBodyGeo.scale(1.0, 0.92, 1.0);
    const appleBody = new THREE.Mesh(appleBodyGeo, appleSkinMat);
    appleBody.castShadow = true;
    miniAppleGroup.add(appleBody);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 6);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.08;
    stem.rotation.z = 0.15;
    miniAppleGroup.add(stem);

    // Tiny green leaf
    const leafGeo = new THREE.SphereGeometry(0.025, 6, 6);
    leafGeo.scale(1.4, 0.3, 0.8);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0.025, 0.09, 0);
    leaf.rotation.z = -0.2;
    miniAppleGroup.add(leaf);

    foodPelletsGroup.add(miniAppleGroup);

  } else {
    // Default: 'seeds' (Sunflower Seeds pile)
    const seedDarkMat = getToonMaterial(0x2f3542, 0.4);
    const seedStripeMat = getToonMaterial(0xf1f2f6, 0.5);
    const kernelMat = getToonMaterial(0xfeca57, 0.3);

    // 14 Detailed striped sunflower seeds
    for (let i = 0; i < 14; i++) {
      const seedGroup = new THREE.Group();
      const angle = (i / 14) * Math.PI * 2 + (i % 3) * 0.2;
      const radius = 0.05 + (i % 3) * 0.045;
      const heightOffset = Math.floor(i / 6) * 0.028;

      seedGroup.position.set(
        Math.sin(angle) * radius,
        heightOffset,
        Math.cos(angle) * radius
      );
      seedGroup.rotation.set(
        (Math.sin(i) * 0.3),
        angle + Math.PI / 2,
        (Math.cos(i) * 0.2)
      );

      // Seed body (tapered teardrop)
      const seedBodyGeo = new THREE.SphereGeometry(0.045, 8, 8);
      seedBodyGeo.scale(0.65, 0.45, 1.4);
      const seedMesh = new THREE.Mesh(seedBodyGeo, seedDarkMat);
      seedMesh.castShadow = true;
      seedGroup.add(seedMesh);

      // Seed white/cream stripe
      const stripeGeo = new THREE.BoxGeometry(0.012, 0.015, 0.09);
      const stripeMesh = new THREE.Mesh(stripeGeo, seedStripeMat);
      stripeMesh.position.y = 0.015;
      seedGroup.add(stripeMesh);

      foodPelletsGroup.add(seedGroup);
    }

    // 2 Shelled golden seed kernels on top
    const kGeo = new THREE.SphereGeometry(0.035, 8, 8);
    kGeo.scale(0.8, 0.5, 1.2);
    const k1 = new THREE.Mesh(kGeo, kernelMat);
    k1.position.set(-0.02, 0.07, 0.02);
    foodPelletsGroup.add(k1);
    const k2 = new THREE.Mesh(kGeo, kernelMat);
    k2.position.set(0.03, 0.07, -0.01);
    foodPelletsGroup.add(k2);
  }
}

