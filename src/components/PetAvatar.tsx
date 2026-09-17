import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetType, PetMood, PetCustomization } from '../types';

interface PetAvatarProps {
  type: PetType;
  mood: PetMood;
  customization: PetCustomization;
  isSleeping?: boolean;
  isEating?: boolean;
  isBeingCleaned?: boolean;
  bubbleCount?: number;
  onPetClick?: () => void;
  scale?: number;
  interactive?: boolean;
}

export const PetAvatar: React.FC<PetAvatarProps> = ({
  type,
  mood,
  customization,
  isSleeping = false,
  isEating = false,
  isBeingCleaned = false,
  bubbleCount = 0,
  onPetClick,
  scale = 1,
  interactive = true,
}) => {
  const safeCustomization = customization || {};
  const [clickHearts, setClickHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newHeart = { id: Date.now() + Math.random(), x, y };
    setClickHearts((prev) => [...prev.slice(-4), newHeart]);

    setTimeout(() => {
      setClickHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1000);

    if (onPetClick) {
      onPetClick();
    }
  };

  // Eyes rendering depending on mood/state
  const renderEyes = () => {
    if (isSleeping) {
      // Closed sleeping happy curved arcs
      return (
        <g id="pet-eyes-sleeping" stroke="#4a3e3d" strokeWidth="4.5" strokeLinecap="round" fill="none">
          <path d="M 68 118 Q 78 126 88 118" />
          <path d="M 132 118 Q 142 126 152 118" />
        </g>
      );
    }

    if (mood === 'excited') {
      // Big sparkling star eyes
      return (
        <g id="pet-eyes-excited">
          <ellipse cx="78" cy="116" rx="14" ry="16" fill="#3e2d2d" />
          <polygon points="78,106 81,113 88,116 81,119 78,126 75,119 68,116 75,113" fill="#ffffff" />
          <circle cx="83" cy="120" r="3.5" fill="#ffffff" />

          <ellipse cx="142" cy="116" rx="14" ry="16" fill="#3e2d2d" />
          <polygon points="142,106 145,113 152,116 145,119 142,126 139,119 132,116 139,113" fill="#ffffff" />
          <circle cx="147" cy="120" r="3.5" fill="#ffffff" />
        </g>
      );
    }

    if (mood === 'sad') {
      // Droopy eyes with tear
      return (
        <g id="pet-eyes-sad">
          <ellipse cx="78" cy="118" rx="12" ry="13" fill="#3e2d2d" />
          <circle cx="75" cy="113" r="4.5" fill="#ffffff" />
          <circle cx="82" cy="122" r="2.5" fill="#ffffff" />
          {/* Tear */}
          <path d="M 64 126 C 60 134 68 138 68 132 Z" fill="#74b9ff" />

          <ellipse cx="142" cy="118" rx="12" ry="13" fill="#3e2d2d" />
          <circle cx="139" cy="113" r="4.5" fill="#ffffff" />
          <circle cx="146" cy="122" r="2.5" fill="#ffffff" />
        </g>
      );
    }

    if (mood === 'hungry') {
      // Big watery puppy eyes
      return (
        <g id="pet-eyes-hungry">
          <ellipse cx="78" cy="116" rx="13" ry="15" fill="#3e2d2d" />
          <circle cx="74" cy="111" r="5.5" fill="#ffffff" />
          <circle cx="82" cy="121" r="3" fill="#ffffff" />
          <circle cx="76" cy="123" r="2" fill="#ffffff" />

          <ellipse cx="142" cy="116" rx="13" ry="15" fill="#3e2d2d" />
          <circle cx="138" cy="111" r="5.5" fill="#ffffff" />
          <circle cx="146" cy="121" r="3" fill="#ffffff" />
          <circle cx="140" cy="123" r="2" fill="#ffffff" />
        </g>
      );
    }

    // Default cute anime eyes (like the reference photo)
    return (
      <g id="pet-eyes-default">
        <ellipse cx="78" cy="116" rx="13" ry="15" fill="#3b2b2b" />
        <circle cx="74" cy="110" r="5.5" fill="#ffffff" />
        <circle cx="82" cy="121" r="2.8" fill="#ffffff" />

        <ellipse cx="142" cy="116" rx="13" ry="15" fill="#3b2b2b" />
        <circle cx="138" cy="110" r="5.5" fill="#ffffff" />
        <circle cx="146" cy="121" r="2.8" fill="#ffffff" />
      </g>
    );
  };

  // Mouth rendering
  const renderMouth = () => {
    if (isEating) {
      return (
        <motion.g
          animate={{ scaleY: [0.7, 1.4, 0.7] }}
          transition={{ repeat: Infinity, duration: 0.28 }}
          transform-origin="110 134"
        >
          <ellipse cx="110" cy="134" rx="8" ry="8" fill="#e84118" />
          <path d="M 106 136 Q 110 140 114 136" fill="#ff7675" />
        </motion.g>
      );
    }

    if (mood === 'sad') {
      return <path d="M 102 138 Q 110 132 118 138" stroke="#4a3e3d" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
    }

    if (mood === 'excited') {
      return (
        <g id="pet-mouth-open">
          <path d="M 102 130 Q 110 144 118 130 Z" fill="#e84118" stroke="#4a3e3d" strokeWidth="2.5" />
          <path d="M 104 135 Q 110 142 116 135" fill="#ff7675" />
        </g>
      );
    }

    // Classic cute 'w' cat/hamster mouth
    return (
      <path
        d="M 100 132 Q 105 137 110 132 Q 115 137 120 132"
        stroke="#4a3e3d"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    );
  };

  // Whiskers (for hamster & cat)
  const renderWhiskers = () => {
    if (type !== 'hamster' && type !== 'cat') return null;
    return (
      <g id="pet-whiskers" stroke="#4a3e3d" strokeWidth="2.5" strokeLinecap="round">
        {/* Left whiskers */}
        <path d="M 44 128 Q 28 126 18 128" />
        <path d="M 46 138 Q 30 142 20 147" />
        {/* Right whiskers */}
        <path d="M 176 128 Q 192 126 202 128" />
        <path d="M 174 138 Q 190 142 200 147" />
      </g>
    );
  };

  // Base species rendering
  const renderBaseSpecies = () => {
    switch (type) {
      case 'hamster':
        return (
          <g id="species-hamster">
            {/* Round ears */}
            <circle cx="56" cy="66" r="28" fill="#b9a6b6" stroke="#4a3e3d" strokeWidth="6" />
            <circle cx="56" cy="66" r="16" fill="#f8c6d3" />
            {/* Ear inner notch */}
            <path d="M 64 62 Q 68 66 65 72" stroke="#4a3e3d" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            <circle cx="164" cy="66" r="28" fill="#b9a6b6" stroke="#4a3e3d" strokeWidth="6" />
            <circle cx="164" cy="66" r="16" fill="#f8c6d3" />
            <path d="M 156 62 Q 152 66 155 72" stroke="#4a3e3d" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Body / Head main chubby shape */}
            <path
              d="M 42 165 C 32 105 52 60 110 60 C 168 60 188 105 178 165 C 170 195 50 195 42 165 Z"
              fill="#b9a6b6"
              stroke="#4a3e3d"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Forehead shaded center stripe (just like reference image) */}
            <path
              d="M 98 61 C 94 85 86 100 86 112 C 100 116 120 116 134 112 C 134 100 126 85 122 61 Z"
              fill="#a794a4"
              opacity="0.6"
            />
            {/* Stitch accents on head like reference */}
            <g stroke="#4a3e3d" strokeWidth="2" strokeLinecap="round">
              <line x1="102" y1="62" x2="108" y2="62" />
              <line x1="112" y1="61" x2="118" y2="61" />
            </g>

            {/* White chubby lower face & muzzle */}
            <path
              d="M 38 152 C 34 126 58 116 110 116 C 162 116 186 126 182 152 C 178 190 42 190 38 152 Z"
              fill="#ffffff"
            />

            {/* Rosy blush cheeks */}
            <ellipse cx="58" cy="134" rx="14" ry="9" fill="#ffb4b4" opacity="0.65" />
            <ellipse cx="162" cy="134" rx="14" ry="9" fill="#ffb4b4" opacity="0.65" />

            {/* Tiny pink nose */}
            <ellipse cx="110" cy="126" rx="4.5" ry="3.5" fill="#4a3e3d" />

            {/* Little front paws */}
            <g fill="#ffffff" stroke="#4a3e3d" strokeWidth="4">
              <ellipse cx="80" cy="178" rx="12" ry="9" />
              <ellipse cx="140" cy="178" rx="12" ry="9" />
            </g>
          </g>
        );

      case 'cat':
        return (
          <g id="species-cat">
            {/* Pointy cat ears */}
            <path d="M 46 88 L 48 38 L 86 64 Z" fill="#f8a579" stroke="#4a3e3d" strokeWidth="6" strokeLinejoin="round" />
            <path d="M 52 80 L 54 48 L 80 68 Z" fill="#ffccd2" />

            <path d="M 174 88 L 172 38 L 134 64 Z" fill="#f8a579" stroke="#4a3e3d" strokeWidth="6" strokeLinejoin="round" />
            <path d="M 168 80 L 166 48 L 140 68 Z" fill="#ffccd2" />

            {/* Head & body */}
            <path
              d="M 44 165 C 36 100 56 65 110 65 C 164 65 184 100 176 165 C 168 195 52 195 44 165 Z"
              fill="#f8a579"
              stroke="#4a3e3d"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Muzzle */}
            <ellipse cx="110" cy="142" rx="36" ry="24" fill="#fff5eb" />

            {/* Cute cat nose */}
            <polygon points="106,125 114,125 110,131" fill="#ff7675" stroke="#4a3e3d" strokeWidth="2" strokeLinejoin="round" />

            {/* Blush cheeks */}
            <ellipse cx="60" cy="134" rx="13" ry="8" fill="#ffb4b4" opacity="0.6" />
            <ellipse cx="160" cy="134" rx="13" ry="8" fill="#ffb4b4" opacity="0.6" />

            {/* Paws */}
            <g fill="#fff5eb" stroke="#4a3e3d" strokeWidth="4">
              <ellipse cx="80" cy="178" rx="12" ry="9" />
              <ellipse cx="140" cy="178" rx="12" ry="9" />
            </g>
          </g>
        );

      case 'dog':
        return (
          <g id="species-dog">
            {/* Floppy droopy puppy ears */}
            <path
              d="M 58 70 C 30 75 22 110 32 135 C 38 145 52 140 54 125 C 56 105 56 85 58 70 Z"
              fill="#b87a48"
              stroke="#4a3e3d"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <path
              d="M 162 70 C 190 75 198 110 188 135 C 182 145 168 140 166 125 C 164 105 164 85 162 70 Z"
              fill="#b87a48"
              stroke="#4a3e3d"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Head & body */}
            <path
              d="M 44 165 C 36 100 56 65 110 65 C 164 65 184 100 176 165 C 168 195 52 195 44 165 Z"
              fill="#e3ab76"
              stroke="#4a3e3d"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Puppy eye patch */}
            <ellipse cx="78" cy="116" rx="20" ry="22" fill="#d4975e" opacity="0.75" />

            {/* Muzzle */}
            <ellipse cx="110" cy="142" rx="34" ry="24" fill="#fffdf9" />

            {/* Big black shiny nose */}
            <ellipse cx="110" cy="126" rx="8" ry="6" fill="#3b2b2b" />
            <ellipse cx="108" cy="124" rx="2.5" ry="1.5" fill="#ffffff" />

            {/* Blush cheeks */}
            <ellipse cx="62" cy="138" rx="12" ry="8" fill="#ffb4b4" opacity="0.6" />
            <ellipse cx="158" cy="138" rx="12" ry="8" fill="#ffb4b4" opacity="0.6" />

            {/* Paws */}
            <g fill="#fffdf9" stroke="#4a3e3d" strokeWidth="4">
              <ellipse cx="80" cy="178" rx="13" ry="9" />
              <ellipse cx="140" cy="178" rx="13" ry="9" />
            </g>
          </g>
        );

      case 'bunny':
        return (
          <g id="species-bunny">
            {/* Long tall bunny ears */}
            <g stroke="#4a3e3d" strokeWidth="6" strokeLinejoin="round">
              <path d="M 68 80 C 50 40 50 0 74 6 C 92 10 90 45 82 80 Z" fill="#ffffff" />
              <path d="M 70 65 C 58 35 60 14 74 18 C 82 20 80 45 76 68 Z" fill="#ffcdd2" strokeWidth="0" />

              <path d="M 152 80 C 170 40 170 0 146 6 C 128 10 130 45 138 80 Z" fill="#ffffff" />
              <path d="M 150 65 C 162 35 160 14 146 18 C 138 20 140 45 144 68 Z" fill="#ffcdd2" strokeWidth="0" />
            </g>

            {/* Head & body */}
            <path
              d="M 44 165 C 36 100 56 68 110 68 C 164 68 184 100 176 165 C 168 195 52 195 44 165 Z"
              fill="#ffffff"
              stroke="#4a3e3d"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Blush cheeks */}
            <ellipse cx="60" cy="132" rx="15" ry="10" fill="#ffb4b4" opacity="0.75" />
            <ellipse cx="160" cy="132" rx="15" ry="10" fill="#ffb4b4" opacity="0.75" />

            {/* Pink heart nose */}
            <polygon points="107,126 113,126 110,131" fill="#ff7675" stroke="#4a3e3d" strokeWidth="2" strokeLinejoin="round" />

            {/* Bunny paws */}
            <g fill="#ffffff" stroke="#4a3e3d" strokeWidth="4">
              <ellipse cx="80" cy="178" rx="12" ry="9" />
              <ellipse cx="140" cy="178" rx="12" ry="9" />
            </g>
          </g>
        );

      case 'panda':
        return (
          <g id="species-panda">
            {/* Black round panda ears */}
            <circle cx="56" cy="62" r="26" fill="#30333a" stroke="#4a3e3d" strokeWidth="6" />
            <circle cx="164" cy="62" r="26" fill="#30333a" stroke="#4a3e3d" strokeWidth="6" />

            {/* White face */}
            <path
              d="M 44 165 C 36 100 56 65 110 65 C 164 65 184 100 176 165 C 168 195 52 195 44 165 Z"
              fill="#ffffff"
              stroke="#4a3e3d"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Black panda eye patches */}
            <ellipse cx="78" cy="116" rx="20" ry="24" fill="#30333a" transform="rotate(-15 78 116)" />
            <ellipse cx="142" cy="116" rx="20" ry="24" fill="#30333a" transform="rotate(15 142 116)" />

            {/* Black nose */}
            <ellipse cx="110" cy="128" rx="6" ry="4.5" fill="#30333a" />

            {/* Blush */}
            <ellipse cx="58" cy="142" rx="14" ry="8" fill="#ffb4b4" opacity="0.6" />
            <ellipse cx="162" cy="142" rx="14" ry="8" fill="#ffb4b4" opacity="0.6" />

            {/* Dark paws */}
            <g fill="#30333a" stroke="#4a3e3d" strokeWidth="4">
              <ellipse cx="80" cy="178" rx="13" ry="9" />
              <ellipse cx="140" cy="178" rx="13" ry="9" />
            </g>
          </g>
        );
    }
  };

  // Render accessories
  const renderAccessories = () => {
    return (
      <g id="pet-accessories-layer">
        {/* Outfits (behind head, over body) */}
        {safeCustomization.outfit === 'outfit-sweater' && (
          <g id="acc-sweater" stroke="#4a3e3d" strokeWidth="3">
            <path d="M 52 160 C 50 190 170 190 168 160 Z" fill="#ffbe76" />
            {/* Stripes */}
            <path d="M 56 168 Q 110 175 164 168" stroke="#ffffff" strokeWidth="5" fill="none" />
            <path d="M 64 180 Q 110 186 156 180" stroke="#f0932b" strokeWidth="5" fill="none" />
          </g>
        )}

        {safeCustomization.outfit === 'outfit-sailor' && (
          <g id="acc-sailor" stroke="#4a3e3d" strokeWidth="2.5">
            <path d="M 72 155 L 110 176 L 148 155 Z" fill="#0984e3" />
            <polygon points="106,170 114,170 110,185" fill="#d63031" />
          </g>
        )}

        {safeCustomization.outfit === 'outfit-bee' && (
          <g id="acc-bee" stroke="#4a3e3d" strokeWidth="2.5">
            <path d="M 56 162 C 54 188 166 188 164 162 Z" fill="#f9ca24" />
            <path d="M 60 172 Q 110 178 160 172" stroke="#2d3436" strokeWidth="4" fill="none" />
          </g>
        )}

        {safeCustomization.outfit === 'outfit-cape' && (
          <g id="acc-cape">
            <path d="M 50 155 Q 30 190 40 205 Q 110 195 180 205 Q 190 190 170 155 Z" fill="#e84118" stroke="#4a3e3d" strokeWidth="3" />
            <polygon points="110,180 112,185 118,186 113,189 115,195 110,192 105,195 107,189 102,186 108,185" fill="#fbc531" />
          </g>
        )}

        {/* Bows */}
        {safeCustomization.bow === 'bow-pink' && (
          <g id="acc-bow-pink" transform="translate(130, 70)">
            <ellipse cx="-12" cy="0" rx="10" ry="7" fill="#fd79a8" stroke="#4a3e3d" strokeWidth="2" />
            <ellipse cx="12" cy="0" rx="10" ry="7" fill="#fd79a8" stroke="#4a3e3d" strokeWidth="2" />
            <circle cx="0" cy="0" r="5" fill="#e84393" stroke="#4a3e3d" strokeWidth="2" />
          </g>
        )}

        {safeCustomization.bow === 'bow-tie' && (
          <g id="acc-bow-tie" transform="translate(110, 158)">
            <polygon points="0,0 -16,-8 -16,8" fill="#0984e3" stroke="#4a3e3d" strokeWidth="2" />
            <polygon points="0,0 16,-8 16,8" fill="#0984e3" stroke="#4a3e3d" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#74b9ff" stroke="#4a3e3d" strokeWidth="2" />
          </g>
        )}

        {safeCustomization.bow === 'bow-cherry' && (
          <g id="acc-bow-cherry" transform="translate(142, 75)">
            <path d="M 0 0 Q 6 -12 14 -10" stroke="#6ab04c" strokeWidth="3" fill="none" />
            <circle cx="2" cy="4" r="6" fill="#eb4d4b" stroke="#4a3e3d" strokeWidth="1.5" />
            <circle cx="12" cy="2" r="6" fill="#eb4d4b" stroke="#4a3e3d" strokeWidth="1.5" />
          </g>
        )}

        {/* Glasses */}
        {safeCustomization.glasses === 'glasses-round' && (
          <g id="acc-glasses-round" stroke="#f39c12" strokeWidth="3" fill="rgba(255,255,255,0.25)">
            <circle cx="78" cy="116" r="18" />
            <circle cx="142" cy="116" r="18" />
            <path d="M 96 114 Q 110 110 124 114" fill="none" />
            <line x1="60" y1="114" x2="48" y2="110" />
            <line x1="160" y1="114" x2="172" y2="110" />
          </g>
        )}

        {safeCustomization.glasses === 'glasses-heart' && (
          <g id="acc-glasses-heart" stroke="#ff4757" strokeWidth="3" fill="rgba(255, 107, 129, 0.45)">
            {/* Left heart */}
            <path d="M 78 126 C 62 114 62 102 72 102 C 78 102 78 108 78 108 C 78 108 78 102 84 102 C 94 102 94 114 78 126 Z" transform="scale(1.3) translate(-18, -12)" />
            {/* Right heart */}
            <path d="M 78 126 C 62 114 62 102 72 102 C 78 102 78 108 78 108 C 78 108 78 102 84 102 C 94 102 94 114 78 126 Z" transform="scale(1.3) translate(30, -12)" />
            <line x1="94" y1="114" x2="126" y2="114" stroke="#ff4757" strokeWidth="3" />
          </g>
        )}

        {safeCustomization.glasses === 'glasses-star' && (
          <g id="acc-glasses-star" stroke="#f1c40f" strokeWidth="2.5" fill="rgba(241, 196, 15, 0.45)">
            <polygon points="78,102 82,112 92,112 84,118 87,128 78,122 69,128 72,118 64,112 74,112" />
            <polygon points="142,102 146,112 156,112 148,118 151,128 142,122 133,128 136,118 128,112 138,112" />
            <line x1="92" y1="114" x2="128" y2="114" />
          </g>
        )}

        {/* Hats & Head pieces */}
        {/* Little Green Sprout - Reference image exact match! */}
        {(safeCustomization.accessory === 'hat-sprout' || safeCustomization.hat === 'hat-sprout') && (
          <motion.g
            id="acc-sprout"
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            style={{ transformOrigin: '110px 58px' }}
          >
            {/* Stem */}
            <path d="M 110 60 Q 112 40 108 26" stroke="#99d98c" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            {/* Left curved leaf */}
            <path
              d="M 108 26 C 96 22 88 32 98 38 C 106 42 108 30 108 26 Z"
              fill="#b5e48c"
              stroke="#52b788"
              strokeWidth="2"
            />
            {/* Right rounded leaf */}
            <path
              d="M 108 26 C 114 14 130 18 128 30 C 126 36 114 34 108 26 Z"
              fill="#99d98c"
              stroke="#52b788"
              strokeWidth="2"
            />
          </motion.g>
        )}

        {safeCustomization.hat === 'hat-party' && (
          <g id="acc-party-hat" transform="translate(110, 58)">
            <polygon points="0,-48 -22,2 22,2" fill="#ff7675" stroke="#4a3e3d" strokeWidth="3" />
            {/* Pattern stripes */}
            <path d="M -9,-20 L 9,-20" stroke="#ffeaa7" strokeWidth="4" />
            <path d="M -16,-5 L 16,-5" stroke="#74b9ff" strokeWidth="4" />
            {/* Pom-pom */}
            <circle cx="0" cy="-52" r="7" fill="#ffeaa7" stroke="#4a3e3d" strokeWidth="2" />
          </g>
        )}

        {safeCustomization.hat === 'hat-chef' && (
          <g id="acc-chef-hat" transform="translate(110, 56)">
            {/* Puffy clouds */}
            <path
              d="M -24 0 C -34 -15 -18 -36 0 -36 C 18 -36 34 -15 24 0 Z"
              fill="#ffffff"
              stroke="#4a3e3d"
              strokeWidth="3.5"
            />
            {/* Band */}
            <rect x="-22" y="-4" width="44" height="10" rx="3" fill="#ecf0f1" stroke="#4a3e3d" strokeWidth="2.5" />
          </g>
        )}

        {safeCustomization.hat === 'hat-crown' && (
          <g id="acc-crown" transform="translate(110, 56)">
            <polygon
              points="-25,0 -25,-26 -12,-12 0,-30 12,-12 25,-26 25,0"
              fill="#f1c40f"
              stroke="#4a3e3d"
              strokeWidth="3"
            />
            <circle cx="-25" cy="-26" r="3.5" fill="#e74c3c" />
            <circle cx="0" cy="-30" r="4" fill="#3498db" />
            <circle cx="25" cy="-26" r="3.5" fill="#e74c3c" />
            <rect x="-24" y="-3" width="48" height="6" rx="2" fill="#f39c12" stroke="#4a3e3d" strokeWidth="1.5" />
          </g>
        )}

        {safeCustomization.hat === 'hat-straw' && (
          <g id="acc-straw-hat" transform="translate(110, 58)">
            <ellipse cx="0" cy="0" rx="42" ry="12" fill="#f5cd79" stroke="#4a3e3d" strokeWidth="3" />
            <path d="M -22 0 C -22 -20 22 -20 22 0 Z" fill="#eccc68" stroke="#4a3e3d" strokeWidth="2.5" />
            <path d="M -22 -2 Q 0 4 22 -2" stroke="#ff6b81" strokeWidth="4" fill="none" />
          </g>
        )}

        {safeCustomization.hat === 'hat-beanie' && (
          <g id="acc-beanie" transform="translate(110, 58)">
            <path d="M -28 0 C -30 -30 30 -30 28 0 Z" fill="#a29bfe" stroke="#4a3e3d" strokeWidth="3" />
            <rect x="-28" y="-4" width="56" height="8" rx="3" fill="#6c5ce7" stroke="#4a3e3d" strokeWidth="2" />
            <circle cx="0" cy="-32" r="7" fill="#ffffff" stroke="#4a3e3d" strokeWidth="2" />
          </g>
        )}
      </g>
    );
  };

  // Dirt patches if pet is dirty
  const renderDirt = () => {
    if (mood !== 'dirty' && !isBeingCleaned) return null;
    return (
      <g id="pet-dirt-smudges" fill="#8d6e63" opacity="0.75">
        <ellipse cx="68" cy="148" rx="8" ry="5" transform="rotate(15 68 148)" />
        <ellipse cx="152" cy="154" rx="10" ry="6" transform="rotate(-10 152 154)" />
        <ellipse cx="110" cy="80" rx="7" ry="4" />
        <circle cx="62" cy="158" r="2.5" />
        <circle cx="164" cy="146" r="3" />
      </g>
    );
  };

  // Washing soap bubbles
  const renderBubbles = () => {
    if (bubbleCount <= 0 && !isBeingCleaned) return null;
    const count = Math.max(bubbleCount, isBeingCleaned ? 8 : 0);
    const bubbles = Array.from({ length: Math.min(count, 14) }).map((_, i) => ({
      cx: 60 + (i * 22) % 100,
      cy: 70 + (i * 18) % 110,
      r: 8 + (i % 3) * 5,
    }));

    return (
      <g id="pet-soap-bubbles">
        {bubbles.map((b, i) => (
          <g key={i}>
            <circle
              cx={b.cx}
              cy={b.cy}
              r={b.r}
              fill="rgba(255, 255, 255, 0.75)"
              stroke="#74b9ff"
              strokeWidth="2"
            />
            <circle cx={b.cx - b.r * 0.3} cy={b.cy - b.r * 0.3} r={b.r * 0.25} fill="#ffffff" />
          </g>
        ))}
      </g>
    );
  };

  return (
    <div
      id="pet-avatar-container"
      className="relative flex items-center justify-center select-none cursor-pointer"
      style={{ transform: `scale(${scale})` }}
      onPointerDown={handlePointerDown}
    >
      {/* Floating interactive hearts when petted */}
      <AnimatePresence>
        {clickHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 1, y: 0, scale: 0.6 }}
            animate={{ opacity: 0, y: -65, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute z-30 pointer-events-none text-2xl font-bold"
            style={{ left: heart.x - 12, top: heart.y - 20 }}
          >
            💖
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating Zzz when sleeping */}
      {isSleeping && (
        <div className="absolute -top-6 right-6 z-20 pointer-events-none">
          <motion.div
            animate={{
              y: [-5, -25],
              x: [0, 10],
              opacity: [0, 1, 0],
              scale: [0.8, 1.3],
            }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="text-2xl font-bubble text-indigo-400 font-bold"
          >
            Zzz...
          </motion.div>
        </div>
      )}

      {/* Animated Pet SVG */}
      <motion.div
        animate={
          isSleeping
            ? { y: [0, 3, 0], scaleY: [1, 0.98, 1] }
            : mood === 'excited'
            ? { y: [0, -14, 0], rotate: [-1.5, 1.5, -1.5] }
            : { y: [0, -5, 0] }
        }
        transition={{
          repeat: Infinity,
          duration: isSleeping ? 3.0 : mood === 'excited' ? 0.45 : 2.5,
          ease: 'easeInOut',
        }}
        whileTap={{ scale: 0.94 }}
        className="relative"
      >
        <svg
          id="pet-character-svg"
          viewBox="0 0 220 220"
          className="w-56 h-56 sm:w-64 sm:h-64 drop-shadow-md transition-all"
        >
          {/* Subtle soft shadow */}
          <ellipse cx="110" cy="198" rx="65" ry="12" fill="rgba(74, 62, 61, 0.14)" />

          {/* Base Species Body & Head */}
          {renderBaseSpecies()}

          {/* Facial Features */}
          {renderEyes()}
          {renderMouth()}
          {renderWhiskers()}

          {/* Dirt marks if dirty */}
          {renderDirt()}

          {/* Outfits and accessories */}
          {renderAccessories()}

          {/* Soap bubbles layer */}
          {renderBubbles()}
        </svg>
      </motion.div>
    </div>
  );
};
