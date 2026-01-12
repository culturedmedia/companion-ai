import { supabase } from '../lib/supabase';

export interface EvolutionStage {
  stage: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  description: string;
  sizeMultiplier: number;
  features: string[];
  unlockMessage: string;
}

export interface CompanionEvolution {
  currentStage: EvolutionStage;
  nextStage?: EvolutionStage;
  progressToNext: number; // 0-100
  levelsToNext: number;
  totalEvolutions: number;
}

// Evolution stages for each animal type
const EVOLUTION_STAGES: Record<string, EvolutionStage[]> = {
  fox: [
    {
      stage: 1,
      name: 'Fox Kit',
      minLevel: 1,
      maxLevel: 9,
      description: 'A tiny, curious fox kit with big ears and bright eyes',
      sizeMultiplier: 0.6,
      features: ['big_ears', 'fluffy_tail_small'],
      unlockMessage: "Your fox kit is ready to grow with you!",
    },
    {
      stage: 2,
      name: 'Young Fox',
      minLevel: 10,
      maxLevel: 24,
      description: 'A playful young fox learning the ways of the world',
      sizeMultiplier: 0.8,
      features: ['normal_ears', 'fluffy_tail_medium', 'curious_eyes'],
      unlockMessage: "Your fox kit has grown into a young fox! 🦊",
    },
    {
      stage: 3,
      name: 'Adult Fox',
      minLevel: 25,
      maxLevel: 49,
      description: 'A clever and confident adult fox',
      sizeMultiplier: 1.0,
      features: ['sleek_ears', 'fluffy_tail_large', 'wise_eyes'],
      unlockMessage: "Your fox has reached adulthood! So proud! 🌟",
    },
    {
      stage: 4,
      name: 'Mystic Fox',
      minLevel: 50,
      maxLevel: 99,
      description: 'A mystical fox with an ethereal glow',
      sizeMultiplier: 1.1,
      features: ['glowing_ears', 'multiple_tails', 'mystic_eyes', 'aura'],
      unlockMessage: "Your fox has become a Mystic Fox! ✨🦊✨",
    },
    {
      stage: 5,
      name: 'Celestial Fox',
      minLevel: 100,
      maxLevel: 999,
      description: 'A legendary celestial fox radiating wisdom and power',
      sizeMultiplier: 1.2,
      features: ['celestial_ears', 'nine_tails', 'starry_eyes', 'constellation_aura', 'crown'],
      unlockMessage: "LEGENDARY! Your fox has ascended to Celestial status! 🌌🦊👑",
    },
  ],
  owl: [
    {
      stage: 1,
      name: 'Owlet',
      minLevel: 1,
      maxLevel: 9,
      description: 'A fluffy little owlet with downy feathers',
      sizeMultiplier: 0.6,
      features: ['downy_feathers', 'big_eyes'],
      unlockMessage: "Your owlet is ready to learn!",
    },
    {
      stage: 2,
      name: 'Fledgling Owl',
      minLevel: 10,
      maxLevel: 24,
      description: 'A young owl learning to spread its wings',
      sizeMultiplier: 0.8,
      features: ['growing_feathers', 'alert_eyes', 'small_wings'],
      unlockMessage: "Your owlet is now a fledgling! 🦉",
    },
    {
      stage: 3,
      name: 'Wise Owl',
      minLevel: 25,
      maxLevel: 49,
      description: 'A wise owl with keen insight',
      sizeMultiplier: 1.0,
      features: ['full_feathers', 'wise_eyes', 'strong_wings'],
      unlockMessage: "Your owl has gained wisdom! 📚🦉",
    },
    {
      stage: 4,
      name: 'Scholar Owl',
      minLevel: 50,
      maxLevel: 99,
      description: 'A scholarly owl with ancient knowledge',
      sizeMultiplier: 1.1,
      features: ['ornate_feathers', 'glowing_eyes', 'spectacles', 'book'],
      unlockMessage: "Your owl is now a Scholar! 🎓🦉",
    },
    {
      stage: 5,
      name: 'Cosmic Owl',
      minLevel: 100,
      maxLevel: 999,
      description: 'A cosmic owl that sees across time and space',
      sizeMultiplier: 1.2,
      features: ['starry_feathers', 'cosmic_eyes', 'ethereal_wings', 'moon_crown'],
      unlockMessage: "LEGENDARY! Your owl has become Cosmic! 🌙🦉✨",
    },
  ],
  cat: [
    {
      stage: 1,
      name: 'Kitten',
      minLevel: 1,
      maxLevel: 9,
      description: 'An adorable little kitten full of energy',
      sizeMultiplier: 0.6,
      features: ['tiny_paws', 'big_eyes', 'short_whiskers'],
      unlockMessage: "Your kitten is ready to play!",
    },
    {
      stage: 2,
      name: 'Young Cat',
      minLevel: 10,
      maxLevel: 24,
      description: 'A curious young cat exploring the world',
      sizeMultiplier: 0.8,
      features: ['growing_paws', 'alert_eyes', 'medium_whiskers'],
      unlockMessage: "Your kitten has grown! 🐱",
    },
    {
      stage: 3,
      name: 'Sleek Cat',
      minLevel: 25,
      maxLevel: 49,
      description: 'A graceful and sleek adult cat',
      sizeMultiplier: 1.0,
      features: ['elegant_paws', 'knowing_eyes', 'long_whiskers'],
      unlockMessage: "Your cat is now sleek and graceful! 😺",
    },
    {
      stage: 4,
      name: 'Royal Cat',
      minLevel: 50,
      maxLevel: 99,
      description: 'A regal cat with an air of nobility',
      sizeMultiplier: 1.1,
      features: ['royal_paws', 'jeweled_collar', 'majestic_whiskers', 'crown'],
      unlockMessage: "Your cat has become royalty! 👑🐱",
    },
    {
      stage: 5,
      name: 'Spirit Cat',
      minLevel: 100,
      maxLevel: 999,
      description: 'A mystical spirit cat with nine lives',
      sizeMultiplier: 1.2,
      features: ['ethereal_form', 'spirit_eyes', 'floating_whiskers', 'nine_lives_aura'],
      unlockMessage: "LEGENDARY! Your cat has become a Spirit Cat! 🌟🐱✨",
    },
  ],
  bunny: [
    {
      stage: 1, name: 'Baby Bunny', minLevel: 1, maxLevel: 9, description: 'A tiny fluffy bunny', sizeMultiplier: 0.6, features: ['tiny_ears', 'cotton_tail'], unlockMessage: "Your baby bunny is here!" },
    {
      stage: 2, name: 'Young Bunny', minLevel: 10, maxLevel: 24, description: 'A hopping young bunny', sizeMultiplier: 0.8, features: ['growing_ears', 'fluffy_tail'], unlockMessage: "Your bunny is growing! 🐰" },
    {
      stage: 3, name: 'Adult Bunny', minLevel: 25, maxLevel: 49, description: 'A happy adult bunny', sizeMultiplier: 1.0, features: ['tall_ears', 'pom_tail'], unlockMessage: "Your bunny is all grown up! 🐇" },
    {
      stage: 4, name: 'Moon Bunny', minLevel: 50, maxLevel: 99, description: 'A magical moon bunny', sizeMultiplier: 1.1, features: ['moon_ears', 'star_tail', 'moon_mark'], unlockMessage: "Your bunny has moon magic! 🌙🐰" },
    {
      stage: 5, name: 'Celestial Bunny', minLevel: 100, maxLevel: 999, description: 'A legendary celestial bunny', sizeMultiplier: 1.2, features: ['galaxy_ears', 'comet_tail', 'constellation_fur'], unlockMessage: "LEGENDARY! Celestial Bunny! 🌌🐰✨" },
  ],
  dragon: [
    {
      stage: 1, name: 'Dragon Hatchling', minLevel: 1, maxLevel: 9, description: 'A tiny dragon hatchling', sizeMultiplier: 0.6, features: ['tiny_wings', 'small_horns'], unlockMessage: "Your dragon has hatched!" },
    {
      stage: 2, name: 'Young Dragon', minLevel: 10, maxLevel: 24, description: 'A young dragon learning to fly', sizeMultiplier: 0.8, features: ['growing_wings', 'medium_horns', 'small_flames'], unlockMessage: "Your dragon is growing! 🐉" },
    {
      stage: 3, name: 'Adult Dragon', minLevel: 25, maxLevel: 49, description: 'A powerful adult dragon', sizeMultiplier: 1.0, features: ['strong_wings', 'large_horns', 'fire_breath'], unlockMessage: "Your dragon is mighty! 🔥🐉" },
    {
      stage: 4, name: 'Elder Dragon', minLevel: 50, maxLevel: 99, description: 'A wise elder dragon', sizeMultiplier: 1.1, features: ['majestic_wings', 'crown_horns', 'ancient_scales'], unlockMessage: "Your dragon is now an Elder! 👑🐉" },
    {
      stage: 5, name: 'Cosmic Dragon', minLevel: 100, maxLevel: 999, description: 'A legendary cosmic dragon', sizeMultiplier: 1.2, features: ['galaxy_wings', 'star_horns', 'nebula_breath', 'constellation_scales'], unlockMessage: "LEGENDARY! Cosmic Dragon! 🌌🐉✨" },
  ],
  axolotl: [
    {
      stage: 1, name: 'Baby Axolotl', minLevel: 1, maxLevel: 9, description: 'A tiny pink axolotl', sizeMultiplier: 0.6, features: ['tiny_gills', 'small_smile'], unlockMessage: "Your axolotl is here!" },
    {
      stage: 2, name: 'Young Axolotl', minLevel: 10, maxLevel: 24, description: 'A happy young axolotl', sizeMultiplier: 0.8, features: ['growing_gills', 'happy_smile'], unlockMessage: "Your axolotl is growing! 🦎" },
    {
      stage: 3, name: 'Adult Axolotl', minLevel: 25, maxLevel: 49, description: 'A cheerful adult axolotl', sizeMultiplier: 1.0, features: ['full_gills', 'big_smile', 'spots'], unlockMessage: "Your axolotl is all grown! 💕" },
    {
      stage: 4, name: 'Rainbow Axolotl', minLevel: 50, maxLevel: 99, description: 'A magical rainbow axolotl', sizeMultiplier: 1.1, features: ['rainbow_gills', 'sparkle_smile', 'color_shift'], unlockMessage: "Your axolotl is rainbow! 🌈" },
    {
      stage: 5, name: 'Ethereal Axolotl', minLevel: 100, maxLevel: 999, description: 'A legendary ethereal axolotl', sizeMultiplier: 1.2, features: ['crystal_gills', 'glowing_form', 'water_aura'], unlockMessage: "LEGENDARY! Ethereal Axolotl! ✨💎" },
  ],
  red_panda: [
    {
      stage: 1, name: 'Red Panda Cub', minLevel: 1, maxLevel: 9, description: 'A tiny red panda cub', sizeMultiplier: 0.6, features: ['tiny_mask', 'fluffy_tail'], unlockMessage: "Your red panda cub is here!" },
    {
      stage: 2, name: 'Young Red Panda', minLevel: 10, maxLevel: 24, description: 'A playful young red panda', sizeMultiplier: 0.8, features: ['growing_mask', 'striped_tail'], unlockMessage: "Your red panda is growing! 🐼" },
    {
      stage: 3, name: 'Adult Red Panda', minLevel: 25, maxLevel: 49, description: 'A fluffy adult red panda', sizeMultiplier: 1.0, features: ['full_mask', 'bushy_tail'], unlockMessage: "Your red panda is fluffy! 🧡" },
    {
      stage: 4, name: 'Autumn Red Panda', minLevel: 50, maxLevel: 99, description: 'A magical autumn red panda', sizeMultiplier: 1.1, features: ['leaf_mask', 'autumn_tail', 'falling_leaves'], unlockMessage: "Your red panda has autumn magic! 🍂" },
    {
      stage: 5, name: 'Forest Spirit Panda', minLevel: 100, maxLevel: 999, description: 'A legendary forest spirit', sizeMultiplier: 1.2, features: ['nature_mask', 'forest_tail', 'tree_crown', 'nature_aura'], unlockMessage: "LEGENDARY! Forest Spirit! 🌲✨" },
  ],
  penguin: [
    {
      stage: 1, name: 'Penguin Chick', minLevel: 1, maxLevel: 9, description: 'A fluffy penguin chick', sizeMultiplier: 0.6, features: ['downy_fluff', 'tiny_flippers'], unlockMessage: "Your penguin chick is here!" },
    {
      stage: 2, name: 'Young Penguin', minLevel: 10, maxLevel: 24, description: 'A waddling young penguin', sizeMultiplier: 0.8, features: ['growing_feathers', 'small_flippers'], unlockMessage: "Your penguin is growing! 🐧" },
    {
      stage: 3, name: 'Adult Penguin', minLevel: 25, maxLevel: 49, description: 'A dapper adult penguin', sizeMultiplier: 1.0, features: ['sleek_feathers', 'strong_flippers', 'bow_tie'], unlockMessage: "Your penguin is dapper! 🎩🐧" },
    {
      stage: 4, name: 'Emperor Penguin', minLevel: 50, maxLevel: 99, description: 'A majestic emperor penguin', sizeMultiplier: 1.1, features: ['golden_crest', 'royal_flippers', 'cape'], unlockMessage: "Your penguin is an Emperor! 👑🐧" },
    {
      stage: 5, name: 'Aurora Penguin', minLevel: 100, maxLevel: 999, description: 'A legendary aurora penguin', sizeMultiplier: 1.2, features: ['aurora_feathers', 'ice_crown', 'northern_lights_aura'], unlockMessage: "LEGENDARY! Aurora Penguin! 🌌🐧✨" },
  ],
};

class EvolutionService {
  // Get evolution stages for an animal type
  getEvolutionStages(animalType: string): EvolutionStage[] {
    return EVOLUTION_STAGES[animalType] || EVOLUTION_STAGES.fox;
  }

  // Get current evolution info for a companion
  getEvolution(animalType: string, level: number): CompanionEvolution {
    const stages = this.getEvolutionStages(animalType);
    
    // Find current stage
    const currentStage = stages.find(s => level >= s.minLevel && level <= s.maxLevel) || stages[0];
    const currentIndex = stages.indexOf(currentStage);
    const nextStage = stages[currentIndex + 1];

    // Calculate progress to next stage
    let progressToNext = 100;
    let levelsToNext = 0;
    
    if (nextStage) {
      const levelsInCurrentStage = currentStage.maxLevel - currentStage.minLevel + 1;
      const levelsCompleted = level - currentStage.minLevel;
      progressToNext = Math.floor((levelsCompleted / levelsInCurrentStage) * 100);
      levelsToNext = nextStage.minLevel - level;
    }

    return {
      currentStage,
      nextStage,
      progressToNext,
      levelsToNext,
      totalEvolutions: stages.length,
    };
  }

  // Check if companion just evolved
  checkEvolution(animalType: string, oldLevel: number, newLevel: number): EvolutionStage | null {
    const oldEvolution = this.getEvolution(animalType, oldLevel);
    const newEvolution = this.getEvolution(animalType, newLevel);

    if (newEvolution.currentStage.stage > oldEvolution.currentStage.stage) {
      return newEvolution.currentStage;
    }

    return null;
  }

  // Get all features for current evolution
  getFeatures(animalType: string, level: number): string[] {
    const evolution = this.getEvolution(animalType, level);
    return evolution.currentStage.features;
  }

  // Get size multiplier for rendering
  getSizeMultiplier(animalType: string, level: number): number {
    const evolution = this.getEvolution(animalType, level);
    return evolution.currentStage.sizeMultiplier;
  }

  // Record evolution in database
  async recordEvolution(userId: string, companionId: string, stage: EvolutionStage): Promise<void> {
    try {
      await supabase.from('evolution_history').insert({
        user_id: userId,
        companion_id: companionId,
        stage: stage.stage,
        stage_name: stage.name,
      });
    } catch (error) {
      console.error('Failed to record evolution:', error);
    }
  }

  // Get evolution history
  async getEvolutionHistory(companionId: string): Promise<Array<{
    stage: number;
    stageName: string;
    achievedAt: Date;
  }>> {
    try {
      const { data, error } = await supabase
        .from('evolution_history')
        .select('stage, stage_name, created_at')
        .eq('companion_id', companionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(e => ({
        stage: e.stage,
        stageName: e.stage_name,
        achievedAt: new Date(e.created_at),
      }));
    } catch (error) {
      console.error('Failed to get evolution history:', error);
      return [];
    }
  }
}

export const evolutionService = new EvolutionService();
export default evolutionService;
