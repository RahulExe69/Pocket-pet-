import * as THREE from 'three';
import { PetType, PetCustomization } from '../../types';
import {
  COLOR_PALETTES,
  getToonMaterial,
  getFluffyFurMaterial,
  getWhiteBellyFurMaterial,
  getCreamBellyFurMaterial,
  getShinyEyeMaterial,
  getPinkNoseMaterial,
  getSmallPawMaterial,
  getMochiGoldenFurMaterial,
  getMochiWhiteFurMaterial,
  getMochiEyeMaterial,
  getMochiPawMaterial,
  getMochiNoseMaterial,
} from './threeHelpers';

export interface PetNodes {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  cheeksGroup: THREE.Group;
  snout: THREE.Mesh;
  mouthGroup: THREE.Group;
  accessoryGroup: THREE.Group;
  heldFoodGroup: THREE.Group;
}

export function buildPetModel(type: PetType, customization: PetCustomization): PetNodes {
  const root = new THREE.Group();
  root.name = 'pet-root';

  const palette = COLOR_PALETTES[type] || COLOR_PALETTES.hamster;
  const isHamster = type === 'hamster';

  // Body group for breathing, bouncing, rotation
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'body-group';
  bodyGroup.position.y = 0.55;
  root.add(bodyGroup);

  // Materials customized for Mochi and other pets
  const bodyMat = isHamster
    ? getMochiGoldenFurMaterial()
    : getFluffyFurMaterial(palette.body, 0.84);

  const bellyMat = isHamster
    ? getMochiWhiteFurMaterial()
    : getWhiteBellyFurMaterial(0xffffff, 0.82);

  const pawMat = isHamster
    ? getMochiPawMaterial()
    : getSmallPawMaterial();

  const noseMat = isHamster
    ? getMochiNoseMaterial()
    : getPinkNoseMaterial();

  const eyeMat = isHamster
    ? getMochiEyeMaterial()
    : getShinyEyeMaterial();

  // 1. Realistic fluffy body (cuddly round pear / dumpling shape)
  const bodyGeo = new THREE.SphereGeometry(isHamster ? 0.58 : 0.56, 32, 28);
  bodyGeo.scale(isHamster ? 1.05 : 1.02, isHamster ? 1.08 : 1.06, 0.98);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyGroup.add(bodyMesh);

  // Fluffy hip contours (adds that adorable chubby rodent silhouette)
  if (isHamster) {
    const hipFluffGeo = new THREE.SphereGeometry(0.28, 20, 16);
    hipFluffGeo.scale(0.95, 1.25, 0.85);
    const leftHip = new THREE.Mesh(hipFluffGeo, bodyMat);
    leftHip.position.set(-0.35, -0.15, -0.04);
    leftHip.rotation.z = 0.22;
    bodyGroup.add(leftHip);

    const rightHip = new THREE.Mesh(hipFluffGeo, bodyMat);
    rightHip.position.set(0.35, -0.15, -0.04);
    rightHip.rotation.z = -0.22;
    bodyGroup.add(rightHip);

    // Mochi White Nape Spot / Diamond on upper back (from reference sheet Top view)
    const napeGeo = new THREE.SphereGeometry(0.19, 18, 14);
    napeGeo.scale(0.95, 0.65, 0.32);
    const napeMesh = new THREE.Mesh(napeGeo, bellyMat);
    napeMesh.position.set(0, 0.38, -0.34);
    napeMesh.rotation.x = -0.38;
    bodyGroup.add(napeMesh);
  }

  // 2. Soft pure white belly & chest patch (Lush curved belly wrapping around front)
  const bellyGeo = new THREE.SphereGeometry(isHamster ? 0.48 : 0.44, 26, 22);
  bellyGeo.scale(isHamster ? 0.92 : 0.88, isHamster ? 1.04 : 1.0, isHamster ? 0.56 : 0.5);
  const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
  bellyMesh.position.set(0, -0.05, isHamster ? 0.33 : 0.35);
  bodyGroup.add(bellyMesh);

  // 3. Head group (anchored for bobs, tilts, chewing and drinking)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.18, 0.06);
  bodyGroup.add(headGroup);

  // Head base sphere to blend seamlessly with chubby body
  if (isHamster) {
    const headBaseGeo = new THREE.SphereGeometry(0.48, 28, 24);
    headBaseGeo.scale(1.05, 0.94, 0.96);
    const headBase = new THREE.Mesh(headBaseGeo, bodyMat);
    headGroup.add(headBase);

    // Mochi White Forehead Blaze Stripe (from between ears down to snout)
    const blazeGeo = new THREE.SphereGeometry(0.24, 20, 16);
    blazeGeo.scale(0.52, 1.25, 0.42);
    const blazeMesh = new THREE.Mesh(blazeGeo, bellyMat);
    blazeMesh.position.set(0, 0.17, 0.38);
    blazeMesh.rotation.x = -0.26;
    headGroup.add(blazeMesh);
  }

  // Snout (sweet rounded soft white muzzle)
  const snoutGeo = new THREE.SphereGeometry(isHamster ? 0.23 : 0.22, 22, 18);
  snoutGeo.scale(1.15, 0.78, 0.88);
  const snoutMat = isHamster
    ? bellyMat
    : getToonMaterial(palette.snout || palette.belly, 0.4);
  const snout = new THREE.Mesh(snoutGeo, snoutMat);
  snout.position.set(0, 0.02, 0.46);
  headGroup.add(snout);

  // 4. Baby-pink small button nose (distinct, delicate and clearly visible on front of snout)
  const noseGeo = new THREE.SphereGeometry(isHamster ? 0.052 : 0.046, 18, 16);
  noseGeo.scale(1.24, 0.88, 0.82);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.set(0, 0.084, 0.655);
  headGroup.add(nose);

  // Philtrum cleft line beneath the pink nose
  const philtrumGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.038, 6);
  const philtrumMat = getToonMaterial(0xe88a9e, 0.5);
  const philtrum = new THREE.Mesh(philtrumGeo, philtrumMat);
  philtrum.position.set(0, 0.050, 0.642);
  headGroup.add(philtrum);

  // 4b. Expressive animated mouth with cavity, pink tongue, and cute buck teeth
  const mouthGroup = new THREE.Group();
  mouthGroup.name = 'mouth-group';
  mouthGroup.position.set(0, 0.022, 0.636);
  headGroup.add(mouthGroup);

  const mouthCavityGeo = new THREE.SphereGeometry(0.038, 14, 10);
  mouthCavityGeo.scale(1.0, 0.85, 0.45);
  const mouthCavityMat = getToonMaterial(0x651528, 0.45);
  const mouthCavityMesh = new THREE.Mesh(mouthCavityGeo, mouthCavityMat);
  mouthGroup.add(mouthCavityMesh);

  const tongueGeo = new THREE.SphereGeometry(0.024, 10, 8);
  tongueGeo.scale(1.1, 0.55, 0.65);
  const tongueMat = getToonMaterial(0xfa8097, 0.35);
  const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
  tongueMesh.position.set(0, -0.012, 0.014);
  mouthGroup.add(tongueMesh);

  // Cute white buck teeth (from reference Nose & Mouth Detail)
  const toothGeo = new THREE.BoxGeometry(0.013, 0.016, 0.009);
  const toothMat = getToonMaterial(0xffffff, 0.1);
  const leftTooth = new THREE.Mesh(toothGeo, toothMat);
  leftTooth.position.set(-0.009, 0.015, 0.012);
  mouthGroup.add(leftTooth);
  const rightTooth = new THREE.Mesh(toothGeo, toothMat);
  rightTooth.position.set(0.009, 0.015, 0.012);
  mouthGroup.add(rightTooth);

  // Default resting smile scale
  mouthGroup.scale.set(0.9, 0.22, 0.7);

  // Delicate realistic hamster whiskers (3 on left, 3 on right)
  const whiskerMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.65,
  });

  const createWhisker = (startX: number, startY: number, startZ: number, endX: number, endY: number, endZ: number) => {
    const pts = [
      new THREE.Vector3(startX, startY, startZ),
      new THREE.Vector3((startX + endX) * 0.5, (startY + endY) * 0.5 + 0.015, (startZ + endZ) * 0.5),
      new THREE.Vector3(endX, endY, endZ),
    ];
    const curve = new THREE.QuadraticBezierCurve3(pts[0], pts[1], pts[2]);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(8));
    return new THREE.Line(geo, whiskerMat);
  };

  // Left whiskers
  headGroup.add(createWhisker(-0.14, 0.04, 0.54, -0.42, 0.06, 0.44));
  headGroup.add(createWhisker(-0.14, 0.02, 0.54, -0.44, 0.01, 0.42));
  headGroup.add(createWhisker(-0.14, 0.0, 0.54, -0.41, -0.04, 0.43));

  // Right whiskers
  headGroup.add(createWhisker(0.14, 0.04, 0.54, 0.42, 0.06, 0.44));
  headGroup.add(createWhisker(0.14, 0.02, 0.54, 0.44, 0.01, 0.42));
  headGroup.add(createWhisker(0.14, 0.0, 0.54, 0.41, -0.04, 0.43));

  // 5. Big sparkling Pixar anime eyes (from reference Eye Detail with catchlights)
  const pupilGeo = new THREE.SphereGeometry(isHamster ? 0.084 : 0.062, 24, 20);
  pupilGeo.scale(0.96, 1.05, 0.88);

  const leftEye = new THREE.Mesh(pupilGeo, eyeMat);
  leftEye.position.set(isHamster ? -0.21 : -0.195, isHamster ? 0.138 : 0.145, isHamster ? 0.45 : 0.47);
  leftEye.rotation.y = -0.22;
  leftEye.rotation.x = 0.04;
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(pupilGeo, eyeMat);
  rightEye.position.set(isHamster ? 0.21 : 0.195, isHamster ? 0.138 : 0.145, isHamster ? 0.45 : 0.47);
  rightEye.rotation.y = 0.22;
  rightEye.rotation.x = 0.04;
  headGroup.add(rightEye);

  // Eye highlights (sparkling primary catchlight + secondary soft catchlight)
  const mainShineGeo = new THREE.SphereGeometry(0.018, 10, 10);
  const mainShineMat = getToonMaterial(0xffffff, 0.05);

  const subShineGeo = new THREE.SphereGeometry(0.010, 8, 8);
  const subShineMat = getToonMaterial(0xffffff, 0.1);

  // Left eye highlights
  const leftShine1 = new THREE.Mesh(mainShineGeo, mainShineMat);
  leftShine1.position.set(-0.015, 0.018, 0.052);
  leftEye.add(leftShine1);

  const leftShine2 = new THREE.Mesh(subShineGeo, subShineMat);
  leftShine2.position.set(0.016, -0.015, 0.048);
  leftEye.add(leftShine2);

  // Right eye highlights
  const rightShine1 = new THREE.Mesh(mainShineGeo, mainShineMat);
  rightShine1.position.set(-0.015, 0.018, 0.052);
  rightEye.add(rightShine1);

  const rightShine2 = new THREE.Mesh(subShineGeo, subShineMat);
  rightShine2.position.set(0.016, -0.015, 0.048);
  rightEye.add(rightShine2);

  // Delicate eyelid / eye contour rim
  const eyeLidGeo = new THREE.SphereGeometry(0.065, 16, 12);
  eyeLidGeo.scale(0.96, 1.08, 0.42);
  const eyeLidMat = getToonMaterial(0xf5dbd2, 0.6);

  const leftLid = new THREE.Mesh(eyeLidGeo, eyeLidMat);
  leftLid.position.set(-0.198, 0.143, 0.45);
  leftLid.rotation.y = -0.22;
  headGroup.add(leftLid);

  const rightLid = new THREE.Mesh(eyeLidGeo, eyeLidMat);
  rightLid.position.set(0.198, 0.143, 0.45);
  rightLid.rotation.y = 0.22;
  headGroup.add(rightLid);

  // 6. Chubby white cheek pouches (white cheeks with sweet soft blush)
  const cheeksGroup = new THREE.Group();
  const cheekGeo = new THREE.SphereGeometry(isHamster ? 0.20 : 0.14, 22, 18);
  cheekGeo.scale(isHamster ? 1.18 : 1.18, isHamster ? 0.90 : 0.82, isHamster ? 0.72 : 0.58);
  const cheekMat = isHamster
    ? bellyMat
    : getWhiteBellyFurMaterial(0xffffff, 0.8);

  const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
  leftCheek.position.set(isHamster ? -0.29 : -0.32, isHamster ? -0.01 : 0.03, isHamster ? 0.36 : 0.41);
  leftCheek.rotation.y = -0.30;
  cheeksGroup.add(leftCheek);

  const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
  rightCheek.position.set(isHamster ? 0.29 : 0.32, isHamster ? -0.01 : 0.03, isHamster ? 0.36 : 0.41);
  rightCheek.rotation.y = 0.30;
  cheeksGroup.add(rightCheek);

  // Soft subtle pastel pink blush glow accentuating the white cheeks
  const blushGeo = new THREE.SphereGeometry(isHamster ? 0.085 : 0.07, 14, 12);
  blushGeo.scale(1.15, 0.62, 0.32);
  const blushMat = getToonMaterial(0xffaeb9, 0.65);

  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.position.set(isHamster ? -0.31 : -0.335, isHamster ? -0.04 : -0.015, isHamster ? 0.44 : 0.445);
  leftBlush.rotation.y = -0.30;
  cheeksGroup.add(leftBlush);

  const rightBlush = new THREE.Mesh(blushGeo, blushMat);
  rightBlush.position.set(isHamster ? 0.31 : 0.335, isHamster ? -0.04 : -0.015, isHamster ? 0.44 : 0.445);
  rightBlush.rotation.y = 0.30;
  cheeksGroup.add(rightBlush);

  // Fluffy side fur tufts on cheeks
  if (isHamster) {
    const tuftGeo = new THREE.SphereGeometry(0.08, 12, 10);
    tuftGeo.scale(1.3, 0.7, 0.9);

    const leftTuft = new THREE.Mesh(tuftGeo, bodyMat);
    leftTuft.position.set(-0.42, 0.02, 0.32);
    leftTuft.rotation.y = -0.4;
    cheeksGroup.add(leftTuft);

    const rightTuft = new THREE.Mesh(tuftGeo, bodyMat);
    rightTuft.position.set(0.42, 0.02, 0.32);
    rightTuft.rotation.y = 0.4;
    cheeksGroup.add(rightTuft);
  }

  headGroup.add(cheeksGroup);

  // 7. Fluffy rounded ears (Light golden-cream beige outside, light pink inside)
  const leftEar = new THREE.Group();
  leftEar.position.set(isHamster ? -0.34 : -0.35, isHamster ? 0.41 : 0.42, -0.02);
  if (isHamster) {
    leftEar.rotation.z = -0.24;
    leftEar.rotation.y = 0.22;
  }
  headGroup.add(leftEar);

  const rightEar = new THREE.Group();
  rightEar.position.set(isHamster ? 0.34 : 0.35, isHamster ? 0.41 : 0.42, -0.02);
  if (isHamster) {
    rightEar.rotation.z = 0.24;
    rightEar.rotation.y = -0.22;
  }
  headGroup.add(rightEar);

  // Fluffy round cup-shaped ears
  const earOuterGeo = new THREE.SphereGeometry(0.16, 18, 16);
  earOuterGeo.scale(1.0, 1.05, 0.38);
  const earInnerGeo = new THREE.SphereGeometry(0.115, 16, 14);
  earInnerGeo.scale(0.92, 0.96, 0.28);

  const earOuterMat = isHamster
    ? bodyMat
    : getToonMaterial(palette.earsOuter || palette.body, 0.5);
  const earInnerMat = getToonMaterial(isHamster ? 0xffa8b2 : (palette.earsInner || 0xffd1dc), 0.4);

  const leftEarOuter = new THREE.Mesh(earOuterGeo, earOuterMat);
  leftEar.add(leftEarOuter);
  const leftEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
  leftEarInner.position.set(0, 0, 0.04);
  leftEar.add(leftEarInner);

  const rightEarOuter = new THREE.Mesh(earOuterGeo, earOuterMat);
  rightEar.add(rightEarOuter);
  const rightEarInner = new THREE.Mesh(earInnerGeo, earInnerMat);
  rightEarInner.position.set(0, 0, 0.04);
  rightEar.add(rightEarInner);

  // Cute white fur tufts at the base of the ear opening
  if (isHamster) {
    const earTuftGeo = new THREE.SphereGeometry(0.048, 10, 8);
    earTuftGeo.scale(1.2, 0.7, 0.7);
    const leftTuft = new THREE.Mesh(earTuftGeo, bellyMat);
    leftTuft.position.set(0.02, -0.08, 0.03);
    leftEar.add(leftTuft);

    const rightTuft = new THREE.Mesh(earTuftGeo, bellyMat);
    rightTuft.position.set(-0.02, -0.08, 0.03);
    rightEar.add(rightTuft);
  }

  // 8. Small front paws (delicate baby-pink hands with tiny digit pads held adorably against the chest)
  // Arm upper fluffy sleeve
  const armSleeveGeo = new THREE.SphereGeometry(0.09, 14, 12);
  armSleeveGeo.scale(0.85, 1.1, 1.1);

  // Tiny dainty hand palm
  const palmGeo = new THREE.SphereGeometry(0.042, 12, 10);
  palmGeo.scale(0.88, 0.72, 1.15);

  // Tiny finger digits
  const fingerGeo = new THREE.SphereGeometry(0.015, 8, 8);

  const createFrontPawMesh = () => {
    const pawGroup = new THREE.Group();

    // Upper sleeve with light brown fur
    const sleeve = new THREE.Mesh(armSleeveGeo, bodyMat);
    sleeve.position.set(0, 0.04, -0.04);
    pawGroup.add(sleeve);

    // Baby-pink tiny palm
    const palm = new THREE.Mesh(palmGeo, pawMat);
    palm.position.set(0, -0.04, 0.06);
    pawGroup.add(palm);

    // 4 tiny cute fingers
    const fingerOffsets = [-0.024, -0.008, 0.008, 0.024];
    fingerOffsets.forEach((fx, idx) => {
      const finger = new THREE.Mesh(fingerGeo, pawMat);
      const curveY = idx === 1 || idx === 2 ? 0.003 : -0.002;
      finger.position.set(fx, -0.065 + curveY, 0.095);
      pawGroup.add(finger);
    });

    return pawGroup;
  };

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.31, -0.08, 0.25);
  leftArm.rotation.x = -0.32;
  leftArm.rotation.z = 0.22;
  leftArm.rotation.y = 0.28;
  const leftArmGroup = createFrontPawMesh();
  leftArm.add(leftArmGroup);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.31, -0.08, 0.25);
  rightArm.rotation.x = -0.32;
  rightArm.rotation.z = -0.22;
  rightArm.rotation.y = -0.28;
  const rightArmGroup = createFrontPawMesh();
  rightArm.add(rightArmGroup);
  bodyGroup.add(rightArm);

  // 9. Small hind paws (delicate baby-pink feet resting flat on the ground with tiny toe pads)
  const footPadGeo = new THREE.SphereGeometry(0.072, 14, 12);
  footPadGeo.scale(0.82, 0.52, 1.25);

  const toeGeo = new THREE.SphereGeometry(0.018, 8, 8);

  const createHindPawMesh = () => {
    const footGroup = new THREE.Group();

    // Dainty pink sole
    const sole = new THREE.Mesh(footPadGeo, pawMat);
    sole.position.set(0, 0, 0.03);
    footGroup.add(sole);

    // 4 tiny toe pads clustered on the front
    const toeOffsets = [-0.034, -0.011, 0.011, 0.034];
    toeOffsets.forEach((tx) => {
      const toe = new THREE.Mesh(toeGeo, pawMat);
      toe.position.set(tx, -0.012, 0.11);
      footGroup.add(toe);
    });

    return footGroup;
  };

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.29, -0.48, 0.16);
  leftLeg.rotation.y = 0.18;
  const leftLegMesh = createHindPawMesh();
  leftLeg.add(leftLegMesh);
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.29, -0.48, 0.16);
  rightLeg.rotation.y = -0.18;
  const rightLegMesh = createHindPawMesh();
  rightLeg.add(rightLegMesh);
  bodyGroup.add(rightLeg);

  // 10. Fluffy cotton-tail
  const tailGeo = new THREE.SphereGeometry(isHamster ? 0.12 : 0.085, 16, 14);
  const tailMesh = new THREE.Mesh(tailGeo, isHamster ? bellyMat : bodyMat);
  tailMesh.position.set(0, -0.30, -0.52);
  bodyGroup.add(tailMesh);

  // Accessories group
  const accessoryGroup = new THREE.Group();
  accessoryGroup.position.set(0, 0.45, 0);
  headGroup.add(accessoryGroup);

  // Held food container (visible when eating)
  const heldFoodGroup = new THREE.Group();
  heldFoodGroup.position.set(0, -0.15, 0.45);
  heldFoodGroup.visible = false;
  bodyGroup.add(heldFoodGroup);

  // Attach active customization meshes
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

export function buildCustomizationItems(
  accessoryGroup: THREE.Group,
  headGroup: THREE.Group,
  bodyGroup: THREE.Group,
  cust: PetCustomization,
  type: PetType
) {
  // Clear previous accessories
  while (accessoryGroup.children.length > 0) {
    accessoryGroup.remove(accessoryGroup.children[0]);
  }

  // 1. Cute Small Hat: Light Blue Beanie Hat with Small Pompom (Only when chosen in closet)
  const isWearingBeanie =
    cust.hat === 'hat-beanie' ||
    cust.accessory === 'hat-beanie';

  if (isWearingBeanie) {
    const beanieGroup = new THREE.Group();
    // Beanie rounded cap (light baby/sky blue)
    const capGeo = new THREE.SphereGeometry(0.24, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
    capGeo.scale(1.05, 0.95, 1.05);
    const capMat = getToonMaterial(0x89cff0, 0.35); // Light pastel blue
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = 0.04;
    beanieGroup.add(capMesh);

    // Folded ribbed cuff / brim around base
    const brimGeo = new THREE.TorusGeometry(0.23, 0.045, 12, 28);
    brimGeo.rotateX(Math.PI / 2);
    const brimMat = getToonMaterial(0x6ebbe8, 0.4); // Contrasting soft sky blue cuff
    const brimMesh = new THREE.Mesh(brimGeo, brimMat);
    brimMesh.position.y = 0.025;
    beanieGroup.add(brimMesh);

    // Cute small fluffy white pompom on top
    const pomGeo = new THREE.SphereGeometry(0.065, 16, 14);
    const pomMat = getToonMaterial(0xffffff, 0.55); // Fluffy white pompom
    const pomMesh = new THREE.Mesh(pomGeo, pomMat);
    pomMesh.position.y = 0.255;
    beanieGroup.add(pomMesh);

    // Beanie snug placement on top of hamster head between ears
    beanieGroup.position.set(0, 0.05, 0.02);
    beanieGroup.rotation.x = -0.06;
    accessoryGroup.add(beanieGroup);
  } else if (cust.accessory === 'hat-sprout') {
    const sproutGroup = new THREE.Group();
    // Green stem
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.16, 8);
    const stemMat = getToonMaterial(0x52b788, 0.3);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.08;
    sproutGroup.add(stem);

    // Two cute heart/oval leaves
    const leafGeo = new THREE.SphereGeometry(0.08, 12, 10);
    leafGeo.scale(1.2, 0.2, 0.6);
    const leafMat = getToonMaterial(0x99d98c, 0.3);

    const leafLeft = new THREE.Mesh(leafGeo, leafMat);
    leafLeft.position.set(-0.06, 0.16, 0);
    leafLeft.rotation.z = -0.4;
    sproutGroup.add(leafLeft);

    const leafRight = new THREE.Mesh(leafGeo, leafMat);
    leafRight.position.set(0.06, 0.17, 0);
    leafRight.rotation.z = 0.4;
    sproutGroup.add(leafRight);

    sproutGroup.position.set(0, 0.02, 0.02);
    accessoryGroup.add(sproutGroup);
  }

  // 2. Hats
  if (cust.hat === 'hat-party') {
    const coneGeo = new THREE.ConeGeometry(0.18, 0.38, 16);
    const coneMat = getToonMaterial(0xff7675, 0.3);
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.18;
    accessoryGroup.add(cone);

    const pomGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const pomMat = getToonMaterial(0xfeca57, 0.3);
    const pom = new THREE.Mesh(pomGeo, pomMat);
    pom.position.y = 0.38;
    accessoryGroup.add(pom);
  } else if (cust.hat === 'hat-crown') {
    const crownGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.18, 5, 1, true);
    const crownMat = getToonMaterial(0xfbc531, 0.2);
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.1;
    accessoryGroup.add(crown);

    const jewelMat = getToonMaterial(0xe84118, 0.2);
    for (let i = 0; i < 5; i++) {
      const jGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const jMesh = new THREE.Mesh(jGeo, jewelMat);
      const angle = (i / 5) * Math.PI * 2;
      jMesh.position.set(Math.sin(angle) * 0.23, 0.18, Math.cos(angle) * 0.23);
      accessoryGroup.add(jMesh);
    }
  } else if (cust.hat === 'hat-chef') {
    const chefBaseGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 16);
    const chefPuffGeo = new THREE.SphereGeometry(0.28, 16, 16);
    chefPuffGeo.scale(1.1, 0.8, 1.1);
    const chefMat = getToonMaterial(0xffffff, 0.4);

    const chefBase = new THREE.Mesh(chefBaseGeo, chefMat);
    chefBase.position.y = 0.08;
    accessoryGroup.add(chefBase);

    const chefPuff = new THREE.Mesh(chefPuffGeo, chefMat);
    chefPuff.position.y = 0.24;
    accessoryGroup.add(chefPuff);
  } else if (cust.hat === 'hat-straw') {
    const brimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.03, 20);
    const topGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.15, 16);
    const strawMat = getToonMaterial(0xf5cd79, 0.6);
    const ribbonMat = getToonMaterial(0xeb4d4b, 0.4);

    const brim = new THREE.Mesh(brimGeo, strawMat);
    brim.position.y = 0.02;
    accessoryGroup.add(brim);

    const top = new THREE.Mesh(topGeo, strawMat);
    top.position.y = 0.1;
    accessoryGroup.add(top);

    const ribbonGeo = new THREE.CylinderGeometry(0.225, 0.225, 0.04, 16);
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.y = 0.06;
    accessoryGroup.add(ribbon);
  }

  // 3. Glasses
  if (cust.glasses) {
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.14, 0.47);

    const rimColor = cust.glasses === 'glasses-round' ? 0xfdcb6e : cust.glasses === 'glasses-heart' ? 0xff7675 : 0xf9ca24;
    const rimMat = getToonMaterial(rimColor, 0.2);

    const leftRimGeo = new THREE.TorusGeometry(0.09, 0.02, 12, 20);
    const leftRim = new THREE.Mesh(leftRimGeo, rimMat);
    leftRim.position.set(-0.21, 0, 0);
    glassesGroup.add(leftRim);

    const rightRim = new THREE.Mesh(leftRimGeo, rimMat);
    rightRim.position.set(0.21, 0, 0);
    glassesGroup.add(rightRim);

    const bridgeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8);
    bridgeGeo.rotateZ(Math.PI / 2);
    const bridge = new THREE.Mesh(bridgeGeo, rimMat);
    bridge.position.set(0, 0.02, 0);
    glassesGroup.add(bridge);

    headGroup.add(glassesGroup);
  }

  // 4. Bow
  if (cust.bow) {
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, -0.22, 0.48);
    const bowColor = cust.bow === 'bow-silk-pink' ? 0xff78ae : cust.bow === 'bow-royal-blue' ? 0x0984e3 : 0xff7675;
    const bowMat = getToonMaterial(bowColor, 0.4);

    const knotGeo = new THREE.SphereGeometry(0.04, 10, 10);
    const knot = new THREE.Mesh(knotGeo, bowMat);
    bowGroup.add(knot);

    const wingGeo = new THREE.ConeGeometry(0.09, 0.16, 12);
    wingGeo.rotateZ(Math.PI / 2);

    const leftWing = new THREE.Mesh(wingGeo, bowMat);
    leftWing.position.x = -0.09;
    bowGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, bowMat);
    rightWing.rotation.z = Math.PI;
    rightWing.position.x = 0.09;
    bowGroup.add(rightWing);

    bodyGroup.add(bowGroup);
  }
}
