import { HeroProgressionData, SaveGameData } from '../types/game';

export const SAVE_KEY = 'ashen_crown_save_v1';
export const CURRENT_SAVE_VERSION = 1;

export const DEFAULT_HERO_PROGRESSION: HeroProgressionData[] = [
  {
    id: 'hero_knight',
    name: 'Sir Gareth',
    archetype: 'knight',
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    maxHp: 36,
    attack: 14,
    defense: 4,
    speed: 10,
  },
  {
    id: 'hero_archer',
    name: 'Aleria Windstride',
    archetype: 'archer',
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    maxHp: 26,
    attack: 11,
    defense: 2,
    speed: 14,
  },
  {
    id: 'hero_mage',
    name: 'Vaelen Pyre',
    archetype: 'mage',
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    maxHp: 22,
    attack: 12,
    defense: 1,
    speed: 11,
  },
];

export function createNewSaveData(): SaveGameData {
  return {
    version: CURRENT_SAVE_VERSION,
    timestamp: Date.now(),
    gold: 50,
    completedEncounters: [],
    battlesWon: 0,
    heroes: JSON.parse(JSON.stringify(DEFAULT_HERO_PROGRESSION)),
  };
}

export function loadGame(): SaveGameData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!validateSaveData(data)) {
      console.warn('Ashen Crown: Corrupted or incompatible save data ignored.');
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to read save from localStorage:', err);
    return null;
  }
}

export function saveGame(data: SaveGameData): boolean {
  try {
    const updated: SaveGameData = {
      ...data,
      version: CURRENT_SAVE_VERSION,
      timestamp: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Failed to write save to localStorage:', err);
    return false;
  }
}

export function clearSaveData(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (err) {
    console.error('Failed to clear save data:', err);
    return false;
  }
}

export function validateSaveData(data: any): data is SaveGameData {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== CURRENT_SAVE_VERSION) return false;
  if (typeof data.gold !== 'number') return false;
  if (!Array.isArray(data.completedEncounters)) return false;
  if (!Array.isArray(data.heroes) || data.heroes.length !== 3) return false;

  for (const h of data.heroes) {
    if (!h.id || !h.name || typeof h.level !== 'number' || typeof h.maxHp !== 'number') {
      return false;
    }
  }

  return true;
}

/**
 * Applies experience reward and triggers level ups if thresholds are met.
 * Returns level-up events for UI announcement.
 */
export function applyHeroRewards(
  heroes: HeroProgressionData[],
  expGained: number
): { updatedHeroes: HeroProgressionData[]; levelUps: Array<{ name: string; newLevel: number }> } {
  const levelUps: Array<{ name: string; newLevel: number }> = [];

  const updatedHeroes = heroes.map((hero) => {
    let currentExp = hero.exp + expGained;
    let currentLevel = hero.level;
    let nextThreshold = hero.expToNextLevel;
    let maxHp = hero.maxHp;
    let attack = hero.attack;
    let defense = hero.defense;
    let speed = hero.speed;
    let didLevelUp = false;

    while (currentExp >= nextThreshold) {
      currentExp -= nextThreshold;
      currentLevel += 1;
      nextThreshold = currentLevel * 100;
      didLevelUp = true;

      // Class-specific stat gains
      switch (hero.archetype) {
        case 'knight':
          maxHp += 8;
          attack += 2;
          defense += 1;
          break;
        case 'archer':
          maxHp += 6;
          attack += 2;
          speed += 1;
          break;
        case 'mage':
          maxHp += 5;
          attack += 3;
          defense += 1;
          break;
      }

      levelUps.push({
        name: hero.name,
        newLevel: currentLevel,
      });
    }

    return {
      ...hero,
      level: currentLevel,
      exp: currentExp,
      expToNextLevel: nextThreshold,
      maxHp,
      attack,
      defense,
      speed,
    };
  });

  return { updatedHeroes, levelUps };
}
