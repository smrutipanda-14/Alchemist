/**
 * Standard Non-Linear RPG Level Scaling:
 * level = floor(sqrt(totalXp / 100)) + 1
 *
 * Level Thresholds:
 * - Level 1: 0 - 99 XP (100 XP to reach Lv. 2)
 * - Level 2: 100 - 399 XP (300 XP to reach Lv. 3)
 * - Level 3: 400 - 899 XP (500 XP to reach Lv. 4)
 * - Level L: Base total XP = (L - 1)^2 * 100
 */
export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) return 1;
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

export function getXpProgress(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpNeededForLevel: number;
  progressPercent: number;
} {
  const level = calculateLevel(totalXp);
  const currentLevelBaseXp = Math.pow(level - 1, 2) * 100;
  const nextLevelBaseXp = Math.pow(level, 2) * 100;
  const xpNeededForLevel = nextLevelBaseXp - currentLevelBaseXp;
  const currentLevelXp = Math.max(0, totalXp - currentLevelBaseXp);
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXp / xpNeededForLevel) * 100));

  return { level, currentLevelXp, xpNeededForLevel, progressPercent };
}
