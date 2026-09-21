import * as THREE from 'three';

export interface PetPalette {
  body: number;
  belly: number;
  cheeks: number;
  snout?: number;
  nose?: number;
  earsInner?: number;
  earsOuter: number;
  eyes: number;
  feet?: number;
  sprout?: number;
  patches?: number;
}

// Color palettes for room wallpapers, flooring, beds, and pets
export const COLOR_PALETTES: Record<string, PetPalette> = {
  hamster: {
    body: 0xc4844d, // Mochi Golden-Honey Brown (#C4844D) from reference sheet
    belly: 0xfffdf8, // Mochi Pure Cream White belly & chest (#FFFDF8)
    cheeks: 0xfffdf8, // Mochi Chubby white cheeks (#FFFDF8)
    snout: 0xfffdf8, // Mochi White muzzle (#FFFDF8)
    nose: 0xfa9ca6, // Soft baby-pink button nose (#FA9CA6)
    earsInner: 0xffa8b2, // Delicate warm pink inner ear (#FFA8B2)
    earsOuter: 0xc4844d, // Golden-honey brown outer ear
    eyes: 0x160c08, // Shiny obsidian with warm chocolate iris glow
    feet: 0xfca7b0, // Baby-pink paws & toe beans (#FCA7B0)
    sprout: 0x74c043,
  },
  cat: {
    body: 0xf9a882,
    belly: 0xfff5eb,
    cheeks: 0xff9999,
    snout: 0xfff5eb,
    earsInner: 0xffb8b8,
    earsOuter: 0xf9a882,
    eyes: 0x2e86de,
    feet: 0xfff5eb,
  },
  dog: {
    body: 0xe0a96d,
    belly: 0xfffdf9,
    cheeks: 0xf3a683,
    snout: 0xfffdf9,
    earsInner: 0xcca070,
    earsOuter: 0xb5804c,
    eyes: 0x3d2714,
    feet: 0xfffdf9,
  },
  bunny: {
    body: 0xfce4ec,
    belly: 0xffffff,
    cheeks: 0xffa3a3,
    snout: 0xffffff,
    earsInner: 0xf48fb1,
    earsOuter: 0xf8bbd0,
    eyes: 0x57606f,
    feet: 0xffffff,
  },
  panda: {
    body: 0xffffff,
    belly: 0xffffff,
    cheeks: 0xffb8b8,
    snout: 0xffffff,
    patches: 0x2f3542,
    earsInner: 0x2f3542,
    earsOuter: 0x2f3542,
    eyes: 0x1e272e,
    feet: 0x2f3542,
  },
  chinchilla: {
    body: 0xa4b0be,
    belly: 0xf1f2f6,
    cheeks: 0xffb8b8,
    snout: 0xf1f2f6,
    earsInner: 0xffa8b2,
    earsOuter: 0x747d8c,
    eyes: 0x2f3542,
    feet: 0xffa8b2,
  },
  ferret: {
    body: 0x747d8c,
    belly: 0xced6e0,
    cheeks: 0xffa8b2,
    snout: 0xced6e0,
    earsInner: 0xffa8b2,
    earsOuter: 0x57606f,
    eyes: 0x1e272e,
    feet: 0xffa8b2,
  },
  hedgehog: {
    body: 0x8c7ae6,
    belly: 0xf5f6fa,
    cheeks: 0xffa8b2,
    snout: 0xf5f6fa,
    earsInner: 0xffa8b2,
    earsOuter: 0x7158e2,
    eyes: 0x1e272e,
    feet: 0xffa8b2,
  },
  gerbil: {
    body: 0xe1b12c,
    belly: 0xf5cd79,
    cheeks: 0xffb8b8,
    snout: 0xf5cd79,
    earsInner: 0xffa8b2,
    earsOuter: 0xc4844d,
    eyes: 0x1e272e,
    feet: 0xffa8b2,
  },
};

// Material cache to prevent GPU memory bloat on mobile devices
const materialCache = new Map<string, THREE.Material>();

// Cached procedural fur textures (generated once on canvas, ultra lightweight & mobile-optimized)
let cachedFurTexture: THREE.CanvasTexture | null = null;
let cachedFurBumpMap: THREE.CanvasTexture | null = null;
let cachedMochiGoldenFurTexture: THREE.CanvasTexture | null = null;
let cachedMochiWhiteFurTexture: THREE.CanvasTexture | null = null;
let cachedMochiEyeTexture: THREE.CanvasTexture | null = null;

export function getMochiFurTextures(): { goldenMap: THREE.CanvasTexture; whiteMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 256;

  // Bump map shared
  if (!cachedFurBumpMap) {
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d')!;
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    for (let k = 0; k < 2800; k++) {
      const bx = Math.random() * size;
      const by = Math.random() * size;
      const blen = 3 + Math.random() * 7;
      const bAngle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.45;
      const isRaised = Math.random() > 0.45;

      bCtx.strokeStyle = isRaised ? '#bcbcbc' : '#4d4d4d';
      bCtx.lineWidth = 0.65 + Math.random() * 0.7;
      bCtx.globalAlpha = 0.16 + Math.random() * 0.22;

      bCtx.beginPath();
      bCtx.moveTo(bx, by);
      bCtx.lineTo(bx + Math.cos(bAngle) * blen, by + Math.sin(bAngle) * blen);
      bCtx.stroke();
    }
    bCtx.globalAlpha = 1.0;
    cachedFurBumpMap = new THREE.CanvasTexture(bumpCanvas);
    cachedFurBumpMap.wrapS = THREE.RepeatWrapping;
    cachedFurBumpMap.wrapT = THREE.RepeatWrapping;
    cachedFurBumpMap.repeat.set(2.5, 2.5);
  }

  // 1. Mochi Warm Golden-Honey Fur Texture (Rich multi-tone strands matching reference sheet)
  if (!cachedMochiGoldenFurTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Warm golden-honey gradient base
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#cb8b52');
    grad.addColorStop(0.3, '#c4844d');
    grad.addColorStop(0.7, '#b26e38');
    grad.addColorStop(1, '#c17e47');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Directional hair strands in honey, amber, chestnut, and soft cream highlights
    ctx.lineCap = 'round';
    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 4 + Math.random() * 9;
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.4;
      const shade = Math.random();

      let stroke = '#d6975f'; // Soft golden amber
      if (shade > 0.8) {
        stroke = '#ffd7a6'; // Sunlit golden fluff tip
      } else if (shade > 0.55) {
        stroke = '#e5a56d'; // Light warm honey
      } else if (shade > 0.25) {
        stroke = '#a15b27'; // Rich warm chestnut undercoat
      } else {
        stroke = '#fce5c8'; // Subtle cream fluff sparkle
      }

      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.7 + Math.random() * 0.85;
      ctx.globalAlpha = 0.22 + Math.random() * 0.32;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    cachedMochiGoldenFurTexture = new THREE.CanvasTexture(canvas);
    cachedMochiGoldenFurTexture.wrapS = THREE.RepeatWrapping;
    cachedMochiGoldenFurTexture.wrapT = THREE.RepeatWrapping;
    cachedMochiGoldenFurTexture.repeat.set(2.2, 2.2);
  }

  // 2. Mochi Pure Cream-White Fur Texture (Silky plush fluff for tummy, cheeks & blaze)
  if (!cachedMochiWhiteFurTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#fffdf8');
    grad.addColorStop(1, '#fef9f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.lineCap = 'round';
    for (let i = 0; i < 2800; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 4 + Math.random() * 8;
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.45;
      const shade = Math.random();

      ctx.strokeStyle = shade > 0.4 ? '#ffffff' : '#f7ede1';
      ctx.lineWidth = 0.65 + Math.random() * 0.75;
      ctx.globalAlpha = 0.18 + Math.random() * 0.26;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    cachedMochiWhiteFurTexture = new THREE.CanvasTexture(canvas);
    cachedMochiWhiteFurTexture.wrapS = THREE.RepeatWrapping;
    cachedMochiWhiteFurTexture.wrapT = THREE.RepeatWrapping;
    cachedMochiWhiteFurTexture.repeat.set(2.5, 2.5);
  }

  return {
    goldenMap: cachedMochiGoldenFurTexture,
    whiteMap: cachedMochiWhiteFurTexture,
    bumpMap: cachedFurBumpMap,
  };
}

// Mochi Anime / Pixar Sparkling Eye Texture (Matches Eye Detail in reference sheet)
export function getMochiEyeTexture(): THREE.CanvasTexture {
  if (cachedMochiEyeTexture) return cachedMochiEyeTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  // Outer dark boundary
  ctx.fillStyle = '#0a0503';
  ctx.fillRect(0, 0, size, size);

  // Deep obsidian pupil & warm chocolate iris gradient
  const irisGrad = ctx.createRadialGradient(cx, cy + 20, 20, cx, cy, r);
  irisGrad.addColorStop(0, '#0d0705');
  irisGrad.addColorStop(0.65, '#1e0f09');
  irisGrad.addColorStop(0.88, '#4a2514'); // Warm chocolate iris ring
  irisGrad.addColorStop(1, '#0a0503');
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Warm amber-hazel glowing crescent at lower edge
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.clip();
  const crescentGrad = ctx.createRadialGradient(cx, cy + 120, 30, cx, cy + 90, 180);
  crescentGrad.addColorStop(0, 'rgba(168, 86, 38, 0.72)');
  crescentGrad.addColorStop(0.5, 'rgba(122, 57, 24, 0.45)');
  crescentGrad.addColorStop(1, 'rgba(10, 5, 3, 0)');
  ctx.fillStyle = crescentGrad;
  ctx.fillRect(0, cy - 20, size, size);
  ctx.restore();

  // Primary large bright white oval catchlight (at top right, ~1 o'clock)
  ctx.save();
  ctx.translate(cx + 60, cy - 70);
  ctx.rotate(-Math.PI * 0.15);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 68, 88, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Secondary crisp sparkling star / glint (at bottom left, ~7 o'clock)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 85, cy + 70, 26, 0, Math.PI * 2);
  ctx.fill();

  // Tertiary tiny cute dot highlight (at middle right, ~3 o'clock)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(cx + 105, cy + 30, 14, 0, Math.PI * 2);
  ctx.fill();

  // Delicate lower rim ambient light line
  ctx.strokeStyle = 'rgba(255, 220, 195, 0.35)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 25, Math.PI * 0.25, Math.PI * 0.75);
  ctx.stroke();

  cachedMochiEyeTexture = new THREE.CanvasTexture(canvas);
  return cachedMochiEyeTexture;
}

// Mochi Golden Fur Material
export function getMochiGoldenFurMaterial(): THREE.MeshStandardMaterial {
  const key = 'mochi_golden_fur';
  if (materialCache.has(key)) return materialCache.get(key) as THREE.MeshStandardMaterial;

  const { goldenMap, bumpMap } = getMochiFurTextures();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: goldenMap,
    bumpMap: bumpMap,
    bumpScale: 0.012,
    roughness: 0.78,
    metalness: 0.02,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

// Mochi White Fur Material
export function getMochiWhiteFurMaterial(): THREE.MeshStandardMaterial {
  const key = 'mochi_white_fur';
  if (materialCache.has(key)) return materialCache.get(key) as THREE.MeshStandardMaterial;

  const { whiteMap, bumpMap } = getMochiFurTextures();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfffdf8,
    map: whiteMap,
    bumpMap: bumpMap,
    bumpScale: 0.009,
    roughness: 0.76,
    metalness: 0.0,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

// Mochi Eye Material with Pixar catchlights
export function getMochiEyeMaterial(): THREE.MeshStandardMaterial {
  const key = 'mochi_eye_mat';
  if (materialCache.has(key)) return materialCache.get(key) as THREE.MeshStandardMaterial;

  const eyeTex = getMochiEyeTexture();
  const mat = new THREE.MeshStandardMaterial({
    map: eyeTex,
    roughness: 0.04,
    metalness: 0.12,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

// Mochi Baby-Pink Paw & Toe Bean Material
export function getMochiPawMaterial(): THREE.MeshStandardMaterial {
  const key = 'mochi_paw_mat';
  if (materialCache.has(key)) return materialCache.get(key) as THREE.MeshStandardMaterial;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xfca7b0, // Soft baby-pink from Paw Detail in reference
    roughness: 0.38,
    metalness: 0.02,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

// Mochi Button Nose Material
export function getMochiNoseMaterial(): THREE.MeshStandardMaterial {
  const key = 'mochi_nose_mat';
  if (materialCache.has(key)) return materialCache.get(key) as THREE.MeshStandardMaterial;

  const mat = new THREE.MeshStandardMaterial({
    color: 0xfa9ca6, // Soft baby-pink button nose
    roughness: 0.28,
    metalness: 0.04,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

export function getFurTextures(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  if (cachedFurTexture && cachedFurBumpMap) {
    return { map: cachedFurTexture, bumpMap: cachedFurBumpMap };
  }

  const size = 256;

  // 1. Fur Color / Micro-strand Map (Light cream #FFF0C8 soft pastel coat)
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Light cream #FFF0C8 pastel base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#fff6dc');
  grad.addColorStop(0.3, '#fff0c8'); // User requested light cream #FFF0C8
  grad.addColorStop(0.7, '#fae8b8');
  grad.addColorStop(1, '#fff2cf');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Soft directional fur micro-hair strands (white fluff, vanilla cream & pale butter highlights)
  ctx.lineCap = 'round';
  for (let i = 0; i < 2800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 4 + Math.random() * 8;
    const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.45;
    const shade = Math.random();

    let strokeStyle = '#f6dfa6';
    if (shade > 0.75) {
      strokeStyle = '#ffffff'; // Pure white fluff strand
    } else if (shade > 0.45) {
      strokeStyle = '#fff9eb'; // Vanilla cream strand
    } else if (shade > 0.2) {
      strokeStyle = '#fae6b4'; // Soft light cream tone (no dark brown)
    } else {
      strokeStyle = '#ffffff'; // White fluff sparkle
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 0.75 + Math.random() * 0.8;
    ctx.globalAlpha = 0.2 + Math.random() * 0.28;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Subtle soft mottling / fluff density spots in pale ivory
  for (let j = 0; j < 100; j++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 2 + Math.random() * 5;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#fcf0d0';
    ctx.globalAlpha = 0.07 + Math.random() * 0.07;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  const furTex = new THREE.CanvasTexture(canvas);
  furTex.wrapS = THREE.RepeatWrapping;
  furTex.wrapT = THREE.RepeatWrapping;
  furTex.repeat.set(2.5, 2.5);

  // 2. Fur Bump Map - Soft tactile depth under scene lights
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let k = 0; k < 2500; k++) {
    const bx = Math.random() * size;
    const by = Math.random() * size;
    const blen = 3 + Math.random() * 6;
    const bAngle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
    const isRaised = Math.random() > 0.5;

    bCtx.strokeStyle = isRaised ? '#b8b8b8' : '#555555';
    bCtx.lineWidth = 0.6 + Math.random() * 0.7;
    bCtx.globalAlpha = 0.14 + Math.random() * 0.2;

    bCtx.beginPath();
    bCtx.moveTo(bx, by);
    bCtx.lineTo(bx + Math.cos(bAngle) * blen, by + Math.sin(bAngle) * blen);
    bCtx.stroke();
  }
  bCtx.globalAlpha = 1.0;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(2.5, 2.5);

  cachedFurTexture = furTex;
  cachedFurBumpMap = bumpTex;

  return { map: furTex, bumpMap: bumpTex };
}

// Realistic lightweight fluffy fur material
export function getFluffyFurMaterial(colorHex: number | string = 0xf5d6a8, roughness = 0.82): THREE.MeshStandardMaterial {
  const key = `fur_${colorHex}_${roughness}`;
  if (materialCache.has(key)) {
    return materialCache.get(key) as THREE.MeshStandardMaterial;
  }

  const { map, bumpMap } = getFurTextures();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    map: map,
    bumpMap: bumpMap,
    bumpScale: 0.012, // Gentle bump scale for soft pastel fluff
    roughness: roughness,
    metalness: 0.01,
    flatShading: false,
  });

  materialCache.set(key, mat);
  return mat;
}

// Pure soft white belly fur material
export function getWhiteBellyFurMaterial(colorHex = 0xffffff, roughness = 0.82): THREE.MeshStandardMaterial {
  const key = `white_belly_fur_${colorHex}_${roughness}`;
  if (materialCache.has(key)) {
    return materialCache.get(key) as THREE.MeshStandardMaterial;
  }

  const { bumpMap } = getFurTextures();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    bumpMap: bumpMap,
    bumpScale: 0.008,
    roughness: roughness,
    metalness: 0.0,
    flatShading: false,
  });

  materialCache.set(key, mat);
  return mat;
}

// Creamy soft belly fur material (kept for backwards-compat)
export function getCreamBellyFurMaterial(colorHex = 0xffffff, roughness = 0.82): THREE.MeshStandardMaterial {
  return getWhiteBellyFurMaterial(colorHex, roughness);
}

// Big shiny eye material (high gloss, mirror reflections)
export function getShinyEyeMaterial(): THREE.MeshStandardMaterial {
  const key = 'shiny_eye_mat';
  if (materialCache.has(key)) {
    return materialCache.get(key) as THREE.MeshStandardMaterial;
  }
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x0a0808),
    roughness: 0.03,
    metalness: 0.25,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

// Baby-pink cute button nose material
export function getPinkNoseMaterial(): THREE.MeshStandardMaterial {
  const key = 'pink_nose_mat_vivid';
  if (materialCache.has(key)) {
    return materialCache.get(key) as THREE.MeshStandardMaterial;
  }
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xff8da4), // Bright cute baby-pink button nose
    roughness: 0.28,
    metalness: 0.05,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

// Small delicate pink paws material
export function getSmallPawMaterial(): THREE.MeshStandardMaterial {
  const key = 'small_paw_mat';
  if (materialCache.has(key)) {
    return materialCache.get(key) as THREE.MeshStandardMaterial;
  }
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xffd5dc),
    roughness: 0.45,
    metalness: 0.02,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

export function getToonMaterial(colorHex: number | string, roughness = 0.4): THREE.MeshStandardMaterial {
  const key = `${colorHex}_${roughness}`;
  if (materialCache.has(key)) {
    return materialCache.get(key) as THREE.MeshStandardMaterial;
  }
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: roughness,
    metalness: 0.05,
    flatShading: false,
  });
  materialCache.set(key, mat);
  return mat;
}

export function getEmissiveMaterial(colorHex: number | string, intensity = 0.6): THREE.MeshStandardMaterial {
  const key = `emissive_${colorHex}_${intensity}`;
  if (materialCache.has(key)) {
    return materialCache.get(key) as THREE.MeshStandardMaterial;
  }
  const color = new THREE.Color(colorHex);
  const mat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.3,
  });
  materialCache.set(key, mat);
  return mat;
}

export function getGlassMaterial(colorHex = 0xa5d8ff, opacity = 0.5): THREE.MeshPhysicalMaterial {
  const key = `glass_${colorHex}_${opacity}`;
  if (materialCache.has(key)) {
    return materialCache.get(key) as THREE.MeshPhysicalMaterial;
  }
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    transparent: true,
    opacity: opacity,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.6,
    ior: 1.33,
  });
  materialCache.set(key, mat);
  return mat;
}

// 3D Billboard Name Tag for friend / player hamster
export function createPetNameTagSprite(name: string, petId: string, isFriend = true): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 512, 160);

    // Rounded tag bubble background
    const x = 20;
    const y = 14;
    const w = 472;
    const h = 106;
    const r = 36;

    ctx.save();
    // Soft shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    // Fill bubble
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

    // Pointer bottom tip
    const midX = x + w / 2;
    ctx.lineTo(midX + 16, y + h);
    ctx.lineTo(midX, y + h + 22);
    ctx.lineTo(midX - 16, y + h);

    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = isFriend ? '#ffffff' : '#fffbeb';
    ctx.fill();

    // Border stroke
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 6;
    ctx.strokeStyle = isFriend ? '#f43f5e' : '#f59e0b';
    ctx.stroke();
    ctx.restore();

    // Icon / Badge
    ctx.font = '36px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(isFriend ? '🐾' : '👑', x + 26, y + h / 2 - 4);

    // Pet Name
    ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#1e293b';
    const displayTitle = name.length > 9 ? name.substring(0, 8) + '…' : name;
    ctx.fillText(displayTitle, x + 84, y + h / 2 - 12);

    // Pet ID Badge
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isFriend ? '#e11d48' : '#d97706';
    ctx.fillText(`[${petId}]`, x + 84, y + h / 2 + 24);

    // Friend / Host Pill Tag
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = isFriend ? '#be185d' : '#b45309';
    ctx.fillText(isFriend ? 'FRIEND 💖' : 'HOST ⭐', x + w - 24, y + h / 2 + 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.4, 0.44, 1);
  sprite.position.set(0, 1.15, 0);
  return sprite;
}

// 3D Bouncy Play Ball for Ball Play mini-game
export function createHamsterPlayBall(): THREE.Group {
  const group = new THREE.Group();
  const radius = 0.18;
  const sphereGeo = new THREE.SphereGeometry(radius, 32, 24);

  // Generate colorful striped beach-ball canvas texture
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const stripes = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#9b59b6', '#ffffff'];
    const w = 256 / stripes.length;
    stripes.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * w, 0, w, 128);
    });
    // Top & bottom white caps
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(128, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(128, 128, 36, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  const ballMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.25,
    metalness: 0.15,
  });

  const ballMesh = new THREE.Mesh(sphereGeo, ballMat);
  ballMesh.castShadow = true;
  ballMesh.position.y = radius;
  group.add(ballMesh);

  // Soft contact shadow underneath
  const shadowGeo = new THREE.CircleGeometry(radius * 1.05, 24);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.008;
  group.add(shadowMesh);

  group.name = 'HamsterPlayBall';
  return group;
}

