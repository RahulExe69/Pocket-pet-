import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  ChevronLeft,
  Check,
  Dices,
  Flame,
  Smile,
  Compass,
  Repeat,
  Edit3,
} from 'lucide-react';
import { PetType } from '../types';
import { PET_CONFIGS } from '../data/initialData';
import { PetPreview3D } from './3d/PetPreview3D';
import { PetFaceAvatar } from './PetFaceAvatar';
import { soundManager } from '../utils/audio';

interface PetSelectionScreenProps {
  onAdoptPet: (type: PetType, name: string) => void;
  onClose?: () => void;
  initialType?: PetType;
}

type CategoryType = 'all' | 'small_pets' | 'birds' | 'aquatic' | 'exotic';

interface PetCategoryMeta {
  id: CategoryType;
  label: string;
  count: number;
}

const CATEGORIES: PetCategoryMeta[] = [
  { id: 'all', label: 'All Pets', count: 50 },
  { id: 'small_pets', label: 'Small Pets', count: 15 },
  { id: 'birds', label: 'Birds', count: 14 },
  { id: 'aquatic', label: 'Ocean', count: 12 },
  { id: 'exotic', label: 'Ancient & Wild', count: 9 },
];

const SPECIES_CATEGORY_MAP: Record<PetType, CategoryType> = {
  // Small Pets
  hamster: 'small_pets',
  chinchilla: 'small_pets',
  ferret: 'small_pets',
  gerbil: 'small_pets',
  hedgehog: 'small_pets',
  rat: 'small_pets',
  badger: 'small_pets',
  marmot: 'small_pets',
  weasel: 'small_pets',
  skunk: 'small_pets',
  cat: 'small_pets',
  bobcat: 'small_pets',
  lynx: 'small_pets',
  bighorn_sheep: 'small_pets',
  mountain_goat: 'small_pets',

  // Birds
  parakeet: 'birds',
  cockatiel: 'birds',
  crow: 'birds',
  eagle: 'birds',
  flamingo: 'birds',
  hummingbird: 'birds',
  kiwi: 'birds',
  owl: 'birds',
  peacock: 'birds',
  pelican: 'birds',
  seagull: 'birds',
  swan: 'birds',
  dodo: 'birds',
  terror_bird: 'birds',

  // Aquatic
  goldfish: 'aquatic',
  angelfish: 'aquatic',
  betta_fish: 'aquatic',
  clownfish: 'aquatic',
  eel: 'aquatic',
  manta_ray: 'aquatic',
  pufferfish: 'aquatic',
  seahorse: 'aquatic',
  stingray: 'aquatic',
  swordfish: 'aquatic',
  axolotl: 'aquatic',
  otter: 'aquatic',
  river_otter: 'aquatic',

  // Ancient & Wild
  archaeopteryx: 'exotic',
  dimetrodon: 'exotic',
  gecko: 'exotic',
  glyptodon: 'exotic',
  mammoth: 'exotic',
  megatherium: 'exotic',
  sabertooth_tiger: 'exotic',
  trilobite: 'exotic',
  woolly_rhino: 'exotic',
};

const ALL_PET_TYPES = Object.keys(PET_CONFIGS) as PetType[];

const SPECIES_TRAITS: Record<string, { trait: string; quote: string; energy: number; affection: number; fun: number }> = {
  marmot: { trait: 'Sunbather & Burrower', quote: 'Chirp chirp! The mountain view is so cozy!', energy: 65, affection: 90, fun: 80 },
  weasel: { trait: 'Sleek & Inquisitive', quote: 'Zip zip! Always exploring secret nooks!', energy: 95, affection: 75, fun: 90 },
  river_otter: { trait: 'Water Acrobat', quote: 'Splash! Nothing beats a nice cool dive!', energy: 90, affection: 85, fun: 95 },
  skunk: { trait: 'Gentle & Misunderstood', quote: 'Squeak! I am very clean and love cuddles!', energy: 60, affection: 95, fun: 70 },
  bobcat: { trait: 'Stealthy Pouncer', quote: 'Mrrow! Spot me if you can!', energy: 85, affection: 70, fun: 85 },
  lynx: { trait: 'Tufted Aristocrat', quote: 'Purrrr! Master of the snowy peaks!', energy: 80, affection: 75, fun: 80 },
  sabertooth_tiger: { trait: 'Prehistoric Legend', quote: 'Roaaar! Fierce look, loving heart!', energy: 90, affection: 80, fun: 85 },
  cockatiel: { trait: 'Whistling Musician', quote: 'Tweet tweet! I can whistle any tune!', energy: 85, affection: 95, fun: 90 },
  parakeet: { trait: 'Chatty & Cheerful', quote: 'Chirp! Tell me all your secrets!', energy: 85, affection: 90, fun: 90 },
  owl: { trait: 'Night Sage', quote: 'Hoo hoo! Wisdom and gentle night flights.', energy: 50, affection: 80, fun: 75 },
  eagle: { trait: 'Sky Guardian', quote: 'Screeech! Riding the highest thermals!', energy: 90, affection: 65, fun: 85 },
  flamingo: { trait: 'Ballet Stilt Walker', quote: 'Honk! Elegant moves on one slender leg!', energy: 70, affection: 80, fun: 75 },
  hamster: { trait: 'Cheek Stuffer & Runner', quote: 'Squeak! Stashing treats for midnight snacks!', energy: 85, affection: 95, fun: 90 },
  cat: { trait: 'Nap Connoisseur', quote: 'Meow! Sunbeams and cardboard boxes are life.', energy: 70, affection: 90, fun: 85 },
  chinchilla: { trait: 'Dust Bath Enthusiast', quote: 'Puff! The softest fur in the world!', energy: 80, affection: 90, fun: 85 },
  ferret: { trait: 'Noodle Rascal', quote: 'Dook dook! War dance time!', energy: 95, affection: 85, fun: 95 },
  hedgehog: { trait: 'Quill Hugger', quote: 'Snuffle! Gentle hands get soft tummy tickles.', energy: 55, affection: 85, fun: 70 },
  gerbil: { trait: 'Speedy Climber', quote: 'Pip! Burrowing master at your service!', energy: 90, affection: 80, fun: 85 },
  badger: { trait: 'Fearless Defender', quote: 'Grr-huff! Loyal companion through thick and thin.', energy: 75, affection: 75, fun: 70 },
  goldfish: { trait: 'Graceful Swimmer', quote: 'Blub blub! Swimming in golden bubbles!', energy: 60, affection: 80, fun: 75 },
  clownfish: { trait: 'Anemone Dancer', quote: 'Pop pop! Home is where the coral glows!', energy: 75, affection: 85, fun: 80 },
  axolotl: { trait: 'Smiling Water Dragon', quote: 'Bloop! Always smiling, always regenerate!', energy: 60, affection: 98, fun: 85 },
  mammoth: { trait: 'Gentle Tundra Giant', quote: 'Trrrooo! Warm hugs from the Ice Age!', energy: 70, affection: 95, fun: 80 },
  bighorn_sheep: { trait: 'Cliff Climber', quote: 'Baaa! Surefooted on every ledge!', energy: 85, affection: 80, fun: 75 },
  mountain_goat: { trait: 'High Altitude Acrobat', quote: 'Maaa! No cliff is too steep!', energy: 90, affection: 75, fun: 80 },
};

export const PetSelectionScreen: React.FC<PetSelectionScreenProps> = ({
  onAdoptPet,
  onClose,
  initialType = 'hamster',
}) => {
  const [selectedType, setSelectedType] = useState<PetType>(initialType);
  const [petName, setPetName] = useState<string>(PET_CONFIGS[initialType]?.name || 'Buddy');
  const [step, setStep] = useState<'choose' | 'name'>('choose');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');

  const filteredPets = useMemo(() => {
    return ALL_PET_TYPES.filter((type) => {
      const config = PET_CONFIGS[type];
      if (!config) return false;

      if (activeCategory !== 'all') {
        const cat = SPECIES_CATEGORY_MAP[type] || 'small_pets';
        if (cat !== activeCategory) return false;
      }

      return true;
    });
  }, [activeCategory]);

  const handleSelectType = (type: PetType) => {
    soundManager.playPop();
    setSelectedType(type);
    setPetName(PET_CONFIGS[type]?.name || 'Buddy');
  };

  // Instant 1-tap pet swap anytime!
  const handleInstantSwap = () => {
    soundManager.playLevelUp();
    const finalName = petName.trim() || PET_CONFIGS[selectedType]?.name || 'Buddy';
    onAdoptPet(selectedType, finalName);
  };

  const handleProceedToName = () => {
    soundManager.playPop();
    setStep('name');
  };

  const handleBackToChoose = () => {
    soundManager.playPop();
    setStep('choose');
  };

  const handleFinishCustomNaming = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = petName.trim() || PET_CONFIGS[selectedType]?.name || 'Buddy';
    soundManager.playLevelUp();
    onAdoptPet(selectedType, finalName);
  };

  const currentConfig = PET_CONFIGS[selectedType] || PET_CONFIGS['hamster'];
  const currentTrait = SPECIES_TRAITS[selectedType] || {
    trait: 'Loyal Companion',
    quote: 'Always happy to spend time with you!',
    energy: 75,
    affection: 90,
    fun: 80,
  };

  const suggestedNames = useMemo(() => {
    const pool: Record<string, string[]> = {
      hamster: ['Hammy', 'Mochi', 'Pip', 'Peanut', 'Boba', 'Nugget'],
      cat: ['Milo', 'Luna', 'Cleo', 'Oreo', 'Oliver', 'Bella'],
      bobcat: ['Hunter', 'Rory', 'Copper', 'Bandit', 'Tawny', 'Amber'],
      lynx: ['Frost', 'Shadow', 'Blizzard', 'Echo', 'Tundra', 'Ghost'],
      marmot: ['Chubby', 'Marmie', 'Chestnut', 'Rocky', 'Barnaby', 'Whistle'],
      weasel: ['Ziggy', 'Slinky', 'Dash', 'Pippin', 'Swift', 'Noodle'],
      river_otter: ['Splash', 'Bubbles', 'River', 'Pebble', 'Riptide', 'Flipper'],
      otter: ['Otto', 'Ollie', 'Marina', 'Nemo', 'Coral', 'Shelly'],
      skunk: ['Flower', 'Oreo', 'Pepper', 'Patch', 'Stripe', 'Badger'],
      chinchilla: ['Puff', 'Dusty', 'Chilla', 'Silver', 'Fluff', 'Cloud'],
      ferret: ['Bandit', 'Rascal', 'Gizmo', 'Noodle', 'Breeze', 'Scamp'],
      hedgehog: ['Sonic', 'Spike', 'Hazel', 'Prickles', 'Pip', 'Needles'],
      gerbil: ['Pip', 'Sandy', 'Cheerio', 'Twitch', 'Speedy', 'Button'],
      badger: ['Barnaby', 'Buster', 'Bruno', 'Brock', 'Trench', 'Rumble'],
      cockatiel: ['Sunny', 'Pikachu', 'Mango', 'Chico', 'Whistle', 'Piper'],
      parakeet: ['Kiwi', 'Rio', 'Sunny', 'Chirpy', 'Skye', 'Peaches'],
      owl: ['Barnaby', 'Hootie', 'Athena', 'Luna', 'Sage', 'Rowan'],
      eagle: ['Apollo', 'Zeus', 'Freedom', 'Hawk', 'Valor', 'Aero'],
      flamingo: ['Coral', 'Penny', 'Flammy', 'Blush', 'Flora', 'Sunset'],
      goldfish: ['Bubbles', 'Finny', 'Nemo', 'Goldie', 'Sunny', 'Cleo'],
      clownfish: ['Marlin', 'Nemo', 'Finley', 'Coral', 'Tango', 'Sunny'],
      axolotl: ['Bloop', 'Pinky', 'Gummy', 'Lotl', 'Marshmallow', 'Boba'],
      mammoth: ['Manny', 'Tusks', 'Colossus', 'Frosty', 'Woolly', 'Titan'],
      sabertooth_tiger: ['Fang', 'Diego', 'Kodiak', 'Saber', 'Shadow', 'Tiger'],
      bighorn_sheep: ['Rocky', 'Ramses', 'Cliff', 'Boulder', 'Apex', 'Woolly'],
      mountain_goat: ['Billy', 'Alpine', 'Peak', 'Summit', 'Glacier', 'Echo'],
    };
    return pool[selectedType] || [currentConfig.name, 'Sunny', 'Pip', 'Lucky', 'Coco', 'Mochi'];
  }, [selectedType, currentConfig.name]);

  const handleRandomizeName = () => {
    soundManager.playPop();
    const randomIndex = Math.floor(Math.random() * suggestedNames.length);
    setPetName(suggestedNames[randomIndex]);
  };

  const isCurrentActivePet = selectedType === initialType;

  return (
    <div
      id="pet-selection-screen"
      className="fixed inset-0 z-50 w-screen h-screen bg-gradient-to-br from-amber-50 via-orange-50/90 to-rose-50 flex flex-col overflow-hidden select-none"
    >
      <AnimatePresence mode="wait">
        {step === 'choose' ? (
          <motion.div
            key="choose-step"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col"
          >
            {/* Top Navigation Bar - Super Compact & Clean */}
            <header className="shrink-0 w-full px-3 sm:px-5 py-2 bg-white/90 backdrop-blur-md border-b border-amber-200/70 shadow-2xs flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-stone-700 transition-colors cursor-pointer active:scale-95 flex items-center justify-center shadow-2xs"
                    title="Return to Pet Room"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🐾</span>
                  <h1 className="font-bubble text-lg sm:text-xl font-black text-stone-800 tracking-tight">
                    Swap Pet
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    50 Species
                  </span>
                </div>
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-stone-700 font-bubble text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  Done
                </button>
              )}
            </header>

            {/* Category Filter Pills Ribbon - Compact */}
            <div className="shrink-0 w-full px-3 sm:px-5 py-1.5 bg-amber-50/70 border-b border-amber-200/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      soundManager.playPop();
                      setActiveCategory(cat.id);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 shadow-2xs ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-amber-500/25 ring-1 ring-amber-300'
                        : 'bg-white/90 text-stone-600 border border-amber-200/70 hover:bg-amber-50 hover:text-amber-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1 py-0.1 rounded-full ${
                        isActive ? 'bg-amber-600 text-amber-100' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Main Studio Viewport (Fully Scrollable on Mobile, Two-Column on Desktop) */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden overscroll-contain">
              {/* Left / 3D Spotlight Stage */}
              <div className="w-full md:w-[360px] lg:w-[400px] shrink-0 p-3 sm:p-5 flex flex-col items-center border-b md:border-b-0 md:border-r border-amber-200/60 bg-gradient-to-b from-amber-50/40 via-white/60 to-orange-50/30 md:overflow-y-auto">
                {/* 3D Pet Viewer Canvas */}
                <div className="relative w-full max-w-xs h-48 sm:h-56 md:h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-radial from-amber-200/40 via-amber-100/20 to-transparent rounded-full blur-xl pointer-events-none" />
                  <PetPreview3D type={selectedType} />
                </div>

                {/* Pet Bio & Stats Card */}
                <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/80 shadow-xs mt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-bubble text-xl sm:text-2xl font-black text-stone-800 capitalize">
                          {currentConfig.species}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 capitalize">
                          {SPECIES_CATEGORY_MAP[selectedType]?.replace('_', ' ') || 'Pet'}
                        </span>
                        {isCurrentActivePet && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-amber-700 mt-0.5">
                        {currentTrait.trait}
                      </p>
                    </div>

                    <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs">
                      <PetFaceAvatar type={selectedType} size={32} />
                    </div>
                  </div>

                  {/* Speech Quote */}
                  <div className="my-2 px-2.5 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs italic text-stone-600 flex items-center gap-1.5">
                    <span className="text-amber-500 font-bold not-italic">💬</span>
                    <span className="truncate">&ldquo;{currentTrait.quote}&rdquo;</span>
                  </div>

                  {/* Stat Mini Bars */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold text-stone-600 mb-2.5">
                    <div className="p-1 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="flex items-center justify-center gap-1 text-orange-600 mb-0.5">
                        <Flame size={11} /> Energy
                      </div>
                      <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${currentTrait.energy}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-1 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="flex items-center justify-center gap-1 text-rose-600 mb-0.5">
                        <Heart size={11} /> Love
                      </div>
                      <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${currentTrait.affection}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-1 rounded-lg bg-stone-50 border border-stone-200">
                      <div className="flex items-center justify-center gap-1 text-emerald-600 mb-0.5">
                        <Smile size={11} /> Fun
                      </div>
                      <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${currentTrait.fun}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: 1-Tap Instant Swap + Rename Option */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      id="btn-adopt-selected"
                      onClick={handleInstantSwap}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-bubble text-sm sm:text-base font-black shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Repeat size={16} />
                      <span>
                        {isCurrentActivePet
                          ? `Keep ${currentConfig.species}`
                          : `Swap to ${currentConfig.species} Now`}
                      </span>
                    </button>

                    <button
                      id="btn-rename-option"
                      onClick={handleProceedToName}
                      className="w-full py-1 rounded-lg text-xs font-bold text-stone-600 hover:text-amber-800 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>Customize Pet Name</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right / Pet Grid Catalog */}
              <div className="flex-1 min-h-0 p-3 sm:p-5 md:overflow-y-auto">
                <div className="flex items-center justify-between pb-2.5">
                  <h3 className="font-bubble text-sm sm:text-base font-bold text-stone-700 flex items-center gap-1.5">
                    <Compass size={16} className="text-amber-500" />
                    <span>Choose Species</span>
                    <span className="text-xs text-stone-400 font-normal">
                      ({filteredPets.length} available)
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 pb-20 sm:pb-12">
                  {filteredPets.map((type) => {
                    const isSelected = selectedType === type;
                    const config = PET_CONFIGS[type];
                    const trait = SPECIES_TRAITS[type];

                    return (
                      <motion.button
                        key={type}
                        id={`btn-pet-card-${type}`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelectType(type)}
                        className={`relative p-3 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white ring-3 ring-amber-500 shadow-md shadow-amber-500/20 z-10'
                            : 'bg-white/80 hover:bg-white border border-amber-200/70 shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        {/* Selection Checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}

                        {/* Pet Face Portrait Avatar */}
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-2 transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-amber-100 to-orange-100 ring-2 ring-amber-400'
                              : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60'
                          }`}
                        >
                          <PetFaceAvatar type={type} size={48} />
                        </div>

                        {/* Species Name */}
                        <span
                          className={`font-bubble text-xs sm:text-sm font-bold capitalize truncate max-w-full ${
                            isSelected ? 'text-amber-900' : 'text-stone-700'
                          }`}
                        >
                          {config.species}
                        </span>

                        {/* Trait Tag */}
                        <span className="text-[10px] text-stone-400 font-medium truncate max-w-full mt-0.5">
                          {trait?.trait.split('&')[0].trim() || 'Friendly'}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Step 2: Name & Personalize Screen */
          <motion.div
            key="name-step"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto"
          >
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-200 flex flex-col items-center text-center">
              {/* Back button */}
              <div className="w-full flex justify-start mb-2">
                <button
                  onClick={handleBackToChoose}
                  className="px-3 py-1.5 rounded-xl bg-amber-100/80 hover:bg-amber-200 text-stone-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  <span>Back to Species</span>
                </button>
              </div>

              {/* 3D Stage Preview (Interactive Dragging Enabled!) */}
              <div className="relative w-40 h-40 flex items-center justify-center my-2">
                <div className="absolute inset-0 bg-radial from-amber-300/50 via-amber-200/20 to-transparent rounded-full blur-xl pointer-events-none" />
                <PetPreview3D type={selectedType} />
              </div>

              {/* Title */}
              <h2 className="font-bubble text-2xl sm:text-3xl font-black text-stone-800 tracking-tight">
                Name Your {currentConfig.species}!
              </h2>
              <p className="text-xs text-stone-500 font-medium mt-1 mb-6">
                Choose a custom nickname for your companion
              </p>

              {/* Naming Form */}
              <form onSubmit={handleFinishCustomNaming} className="w-full space-y-4">
                <div className="relative">
                  <input
                    id="input-pet-name"
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    maxLength={16}
                    placeholder="Enter nickname..."
                    autoFocus
                    className="w-full px-4 py-3 text-center font-bubble text-xl font-bold text-stone-800 bg-amber-50/70 border-2 border-amber-300 rounded-2xl focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeName}
                    title="Generate Random Name"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-amber-200/70 hover:bg-amber-300 text-amber-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Dices size={18} />
                  </button>
                </div>

                {/* Suggested Name Pills */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {suggestedNames.slice(0, 5).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        soundManager.playPop();
                        setPetName(name);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        petName === name
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-amber-100/70 text-amber-900 hover:bg-amber-200/80'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {/* Final Submit Button */}
                <button
                  id="btn-complete-adoption"
                  type="submit"
                  disabled={!petName.trim()}
                  className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-bubble text-lg font-black shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  <span>Confirm & Swap to {petName || currentConfig.species}!</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
