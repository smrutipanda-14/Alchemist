import prisma from './client';

export const INITIAL_ITEMS = [
  // Common Herbs (id: 1..4)
  { id: 1, name: "Moonlight Lavender", type: "HERB", rarity: "COMMON", imagePath: "/assets/items/herb_lavender.png", value: 10, description: "Glows gently under the midnight moon. Soothes restless minds." },
  { id: 2, name: "Solar Bloom", type: "HERB", rarity: "COMMON", imagePath: "/assets/items/herb_solar.png", value: 12, description: "Warm to the touch, brimming with vibrant daylight energy." },
  { id: 3, name: "Dewdrop Moss", type: "HERB", rarity: "COMMON", imagePath: "/assets/items/herb_moss.png", value: 8, description: "Absorbs pure morning mist. Essential for stabilizing mixtures." },
  { id: 4, name: "Whispering Fern", type: "HERB", rarity: "COMMON", imagePath: "/assets/items/herb_fern.png", value: 15, description: "Rustles with swift breezes. Boosts agility and mental speed." },

  // Rare Herbs (id: 5..7)
  { id: 5, name: "Starfall Lotus", type: "HERB", rarity: "RARE", imagePath: "/assets/items/herb_lotus.png", value: 45, description: "A mystical flower said to blossom only when comets streak the sky." },
  { id: 6, name: "Dragon's Ember Leaf", type: "HERB", rarity: "RARE", imagePath: "/assets/items/herb_ember.png", value: 50, description: "Sizzles with unquenchable warmth. Imbues potions with burning vigor." },
  { id: 7, name: "Void Shroom", type: "HERB", rarity: "LEGENDARY", imagePath: "/assets/items/herb_void.png", value: 80, description: "Found only in the deepest ethereal caverns. Bends alchemical reality." },

  // Base Materials & Catalysts (id: 8..11)
  { id: 8, name: "Crystal Vial", type: "MATERIAL", rarity: "COMMON", imagePath: "/assets/items/vial.png", value: 5, description: "Sturdy glass container specially enchanted to hold magical reagents." },
  { id: 9, name: "Pure Springwater", type: "MATERIAL", rarity: "COMMON", imagePath: "/assets/items/water.png", value: 5, description: "Crystal clear water harvested from the sacred highland springs." },
  { id: 10, name: "Mystic Catalyst", type: "CATALYST", rarity: "UNCOMMON", imagePath: "/assets/items/catalyst.png", value: 25, description: "Purified alchemical powder that bonds disparate elements." },
  { id: 11, name: "Phoenix Ash", type: "CATALYST", rarity: "RARE", imagePath: "/assets/items/ash.png", value: 60, description: "Warm glittering embers that accelerate potion potency exponentially." },

  // Crafted Potions (id: 12..16)
  { id: 12, name: "Lesser Health Tonic", type: "POTION", rarity: "COMMON", imagePath: "/assets/items/potion_red.png", value: 35, description: "Restores vitality and dispels physical fatigue." },
  { id: 13, name: "Potion of Clarity", type: "POTION", rarity: "UNCOMMON", imagePath: "/assets/items/potion_blue.png", value: 55, description: "Heightens concentration and unlocks creative focus." },
  { id: 14, name: "Elixir of Swiftness", type: "POTION", rarity: "UNCOMMON", imagePath: "/assets/items/potion_green.png", value: 65, description: "Allows lightning-fast task completion and energetic flow." },
  { id: 15, name: "Dragonfire Brew", type: "POTION", rarity: "RARE", imagePath: "/assets/items/potion_orange.png", value: 120, description: "Ignites formidable inner power and determination." },
  { id: 16, name: "Celestial Essence", type: "POTION", rarity: "LEGENDARY", imagePath: "/assets/items/potion_purple.png", value: 220, description: "The pinnacle of the brewing arts. Radiates stellar light." }
];

export const RECIPES: Record<number, { name: string; ingredients: { itemId: number; qty: number }[]; xpYield: number }> = {
  12: { // Lesser Health Tonic
    name: "Lesser Health Tonic",
    ingredients: [{ itemId: 1, qty: 1 }, { itemId: 9, qty: 1 }, { itemId: 8, qty: 1 }],
    xpYield: 30
  },
  13: { // Potion of Clarity
    name: "Potion of Clarity",
    ingredients: [{ itemId: 2, qty: 1 }, { itemId: 3, qty: 1 }, { itemId: 8, qty: 1 }],
    xpYield: 50
  },
  14: { // Elixir of Swiftness
    name: "Elixir of Swiftness",
    ingredients: [{ itemId: 4, qty: 1 }, { itemId: 10, qty: 1 }, { itemId: 8, qty: 1 }],
    xpYield: 75
  },
  15: { // Dragonfire Brew
    name: "Dragonfire Brew",
    ingredients: [{ itemId: 6, qty: 1 }, { itemId: 11, qty: 1 }, { itemId: 8, qty: 1 }],
    xpYield: 120
  },
  16: { // Celestial Essence
    name: "Celestial Essence",
    ingredients: [{ itemId: 5, qty: 1 }, { itemId: 7, qty: 1 }, { itemId: 10, qty: 1 }, { itemId: 8, qty: 1 }],
    xpYield: 250
  }
};

export const INITIAL_BADGES = [
  { id: 1, name: "Novice Alchemist", description: "Brewed your first potion in the Cauldron.", rarity: "COMMON", imagePath: "/assets/badges/badge_novice.png" },
  { id: 2, name: "Focus Flame (3-Day)", description: "Maintained a 3-day daily streak.", rarity: "UNCOMMON", imagePath: "/assets/badges/badge_streak3.png" },
  { id: 3, name: "Master of the Flame (7-Day)", description: "Achieved a legendary 7-day productivity streak!", rarity: "RARE", imagePath: "/assets/badges/badge_streak7.png" },
  { id: 4, name: "Grand Brewmaster", description: "Crafted a Rare or Legendary potion concoction.", rarity: "RARE", imagePath: "/assets/badges/badge_brewmaster.png" },
  { id: 5, name: "Herbalist of the Grove", description: "Completed 60+ minutes of deep focus in the Garden.", rarity: "UNCOMMON", imagePath: "/assets/badges/badge_herbalist.png" },
  { id: 6, name: "Town Benefactor", description: "Fulfilled 5 potion requests from visiting townfolk.", rarity: "RARE", imagePath: "/assets/badges/badge_benefactor.png" }
];

export const INITIAL_NPC_ORDERS = [
  {
    id: 1,
    npcName: "Town Guard Derrick",
    npcSprite: "/assets/npcs/guard.png",
    requestedPotionId: 12,
    requestedPotionQty: 1,
    dialog: "Halt, alchemist! Night patrol was brutal, my limbs are aching. Do you have a Lesser Health Tonic?",
    goldReward: 50,
    rareHerbRewardId: 5, // Starfall Lotus
    badgeRewardId: null
  },
  {
    id: 2,
    npcName: "Scholar Beatrice",
    npcSprite: "/assets/npcs/scholar.png",
    requestedPotionId: 13,
    requestedPotionQty: 1,
    dialog: "Greetings! I'm deciphering ancient runes at the academy. A Potion of Clarity would aid my studies immensely!",
    goldReward: 75,
    rareHerbRewardId: null,
    badgeRewardId: 5 // Herbalist of the Grove
  },
  {
    id: 3,
    npcName: "Merchant Lyra",
    npcSprite: "/assets/npcs/merchant.png",
    requestedPotionId: 14,
    requestedPotionQty: 1,
    dialog: "My caravan departs at dawn! I require an Elixir of Swiftness to outrun forest bandits.",
    goldReward: 90,
    rareHerbRewardId: 6, // Dragon's Ember Leaf
    badgeRewardId: null
  },
  {
    id: 4,
    npcName: "Master Ignatius",
    npcSprite: "/assets/npcs/ignatius.png",
    requestedPotionId: 15,
    requestedPotionQty: 1,
    dialog: "Show me your true craft, apprentice. Bring me a Dragonfire Brew and prove your mastery!",
    goldReward: 160,
    rareHerbRewardId: 7, // Void Shroom
    badgeRewardId: 4 // Grand Brewmaster
  }
];

export const INITIAL_DAILY_TASK_POOL = [
  { id: 1, title: "Morning Meditation or Journaling", description: "Take 10 minutes of uninterrupted mindfulness to center your day.", xpReward: 50, materialRewards: [1, 9] }, // Moonlight Lavender, Springwater
  { id: 2, title: "30 Minutes Physical Exercise", description: "Walk, jog, stretch or hit the gym to activate blood circulation.", xpReward: 60, materialRewards: [2, 8] }, // Solar Bloom, Crystal Vial
  { id: 3, title: "Drink 2 Liters of Water", description: "Stay hydrated throughout your study or work sessions.", xpReward: 40, materialRewards: [3, 9] }, // Dewdrop Moss, Springwater
  { id: 4, title: "Read 15 Pages of a Book", description: "Expand your intellect and perspective with literature.", xpReward: 55, materialRewards: [4, 8] }, // Whispering Fern, Crystal Vial
  { id: 5, title: "Deep Work Sprint (45+ mins)", description: "Complete a focused session with zero phone notifications.", xpReward: 75, materialRewards: [10, 8] }, // Mystic Catalyst, Crystal Vial
  { id: 6, title: "Tidy Workspace & Desk", description: "A clear physical workspace fosters a clear alchemical mind.", xpReward: 45, materialRewards: [1, 3] }, // Lavender, Moss
  { id: 7, title: "Review Daily Budget / Finances", description: "Keep track of expenses and financial goals.", xpReward: 50, materialRewards: [2, 10] } // Solar Bloom, Catalyst
];

export const INITIAL_BANNERS = [
  { id: 1, name: "Mystic Observatory", imagePath: "/assets/banners/observatory.jpg", priceGold: 80, description: "Starlit glass dome gazing into the celestial cosmos." },
  { id: 2, name: "Enchanted Twilight Grove", imagePath: "/assets/banners/forest.jpg", priceGold: 120, description: "Luminescent flora blooming beneath purple twilight." },
  { id: 3, name: "Dragon's Flame Hearth", imagePath: "/assets/banners/forge.jpg", priceGold: 160, description: "Roaring embers and molten gold from the deep forge." },
  { id: 4, name: "Cyber Alchemist Lab", imagePath: "/assets/banners/cyberlab.jpg", priceGold: 220, description: "Holographic alembics and neon bio-luminescence." }
];

export const INITIAL_STICKERS = [
  { id: 1, name: "Golden Cauldron", imagePath: "/assets/stickers/sticker_cauldron.png", goldCost: 30, category: "alchemy" },
  { id: 2, name: "Radiant Potion", imagePath: "/assets/stickers/sticker_potion.png", goldCost: 35, category: "alchemy" },
  { id: 3, name: "Starlight Shard", imagePath: "/assets/stickers/sticker_crystal.png", goldCost: 45, category: "magic" },
  { id: 4, name: "Sprout Mandrake", imagePath: "/assets/stickers/sticker_mandrake.png", goldCost: 50, category: "nature" }
];

export async function seedDatabase() {
  console.log("🌱 Seeding database with Items, Badges, Quests, Banners, Stickers, and Task Pools...");

  for (const item of INITIAL_ITEMS) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: item,
      create: item
    });
  }

  for (const badge of INITIAL_BADGES) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: badge,
      create: badge
    });
  }

  for (const order of INITIAL_NPC_ORDERS) {
    await prisma.npcOrder.upsert({
      where: { id: order.id },
      update: order,
      create: order
    });
  }

  for (const banner of INITIAL_BANNERS) {
    await prisma.bannerCosmetic.upsert({
      where: { id: banner.id },
      update: banner,
      create: banner
    });
  }

  for (const sticker of INITIAL_STICKERS) {
    await (prisma as any).sticker.upsert({
      where: { id: sticker.id },
      update: sticker,
      create: sticker
    });
  }

  console.log("✨ Seeding completed successfully!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
