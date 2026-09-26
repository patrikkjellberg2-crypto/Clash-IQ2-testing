export type UpgradeResource = 'Gold' | 'Elixir' | 'Dark Elixir';

export type UpgradeCost = {
  cost: number;
  resource: UpgradeResource;
  seconds: number;
};

/*
 * Upgrade economics used by Village Intelligence.
 * Values are kept locally so the app never has to scrape a third-party site
 * on every page load. The catalog is based on Clash Ninja's published
 * upgrade tables; update this file when Supercell changes costs/times.
 *
 * Key = target level. Example: Cannon[18] is the cost/time for Lv17 -> Lv18.
 */
const h = (days: number, hours = 0) => (days * 24 + hours) * 3600;

export const UPGRADE_COSTS: Record<string, Record<number, UpgradeCost>> = {
  Cannon: {
    14: { cost: 2_000_000, resource: 'Gold', seconds: h(1) },
    15: { cost: 2_200_000, resource: 'Gold', seconds: h(0, 20) },
    16: { cost: 2_500_000, resource: 'Gold', seconds: h(1) },
    17: { cost: 3_000_000, resource: 'Gold', seconds: h(1, 12) },
    18: { cost: 3_500_000, resource: 'Gold', seconds: h(2) },
    19: { cost: 4_000_000, resource: 'Gold', seconds: h(2, 12) },
  },
  'Archer Tower': {
    14: { cost: 2_200_000, resource: 'Gold', seconds: h(0, 20) },
    15: { cost: 2_500_000, resource: 'Gold', seconds: h(1) },
    16: { cost: 3_000_000, resource: 'Gold', seconds: h(1, 12) },
    17: { cost: 3_500_000, resource: 'Gold', seconds: h(2) },
    18: { cost: 4_000_000, resource: 'Gold', seconds: h(2, 12) },
    19: { cost: 4_500_000, resource: 'Gold', seconds: h(3) },
  },
  'Air Defense': {
    10: { cost: 5_800_000, resource: 'Gold', seconds: h(4) },
    11: { cost: 7_500_000, resource: 'Gold', seconds: h(4, 12) },
  },
  'Bomb Tower': {
    7: { cost: 6_000_000, resource: 'Gold', seconds: h(4, 12) },
    8: { cost: 8_000_000, resource: 'Gold', seconds: h(6) },
  },
  'Hidden Tesla': {
    10: { cost: 5_000_000, resource: 'Gold', seconds: h(3, 12) },
    11: { cost: 5_500_000, resource: 'Gold', seconds: h(4) },
    12: { cost: 6_000_000, resource: 'Gold', seconds: h(4, 6) },
  },
  'Inferno Tower': {
    6: { cost: 6_500_000, resource: 'Gold', seconds: h(6) },
    7: { cost: 8_000_000, resource: 'Gold', seconds: h(7) },
  },
  Mortar: {
    9: { cost: 2_500_000, resource: 'Gold', seconds: h(2) },
    10: { cost: 3_500_000, resource: 'Gold', seconds: h(2, 12) },
    11: { cost: 5_800_000, resource: 'Gold', seconds: h(3) },
    12: { cost: 6_500_000, resource: 'Gold', seconds: h(3, 12) },
    13: { cost: 8_200_000, resource: 'Gold', seconds: h(4) },
  },
  'Wizard Tower': {
    11: { cost: 4_500_000, resource: 'Gold', seconds: h(3) },
    12: { cost: 5_000_000, resource: 'Gold', seconds: h(3, 12) },
    13: { cost: 5_500_000, resource: 'Gold', seconds: h(4) },
  },
  'X-Bow': {
    7: { cost: 7_000_000, resource: 'Gold', seconds: h(6) },
    8: { cost: 7_500_000, resource: 'Gold', seconds: h(7) },
  },
  'Clan Castle': {
    8: { cost: 6_400_000, resource: 'Elixir', seconds: h(5) },
    9: { cost: 10_000_000, resource: 'Elixir', seconds: h(6) },
  },
  'Elixir Storage': {
    12: { cost: 1_000_000, resource: 'Gold', seconds: h(1) },
    13: { cost: 1_800_000, resource: 'Gold', seconds: h(2) },
    14: { cost: 2_800_000, resource: 'Gold', seconds: h(3) },
  },
  'Gold Storage': {
    12: { cost: 1_000_000, resource: 'Elixir', seconds: h(1) },
    13: { cost: 1_800_000, resource: 'Elixir', seconds: h(2) },
    14: { cost: 2_800_000, resource: 'Elixir', seconds: h(3) },
  },
  'Dark Elixir Storage': {
    8: { cost: 5_400_000, resource: 'Elixir', seconds: h(5) },
  },
  Workshop: {
    4: { cost: 9_000_000, resource: 'Elixir', seconds: h(7) },
    5: { cost: 10_000_000, resource: 'Elixir', seconds: h(8) },
  },
  'Spell Factory': {
    4: { cost: 1_200_000, resource: 'Elixir', seconds: h(3) },
    5: { cost: 2_000_000, resource: 'Elixir', seconds: h(4) },
  },
  'Dark Barracks': {
    8: { cost: 7_000_000, resource: 'Elixir', seconds: h(6) },
    9: { cost: 7_200_000, resource: 'Elixir', seconds: h(7) },
    10: { cost: 11_000_000, resource: 'Elixir', seconds: h(8) },
  },
  'Eagle Artillery': {
    4: { cost: 10_000_000, resource: 'Gold', seconds: h(10) },
  },
  Scattershot: {
    1: { cost: 8_000_000, resource: 'Gold', seconds: h(8) },
    2: { cost: 9_000_000, resource: 'Gold', seconds: h(9) },
  },
};

export function getUpgradeCost(name: string, targetLevel: number): UpgradeCost | undefined {
  return UPGRADE_COSTS[name]?.[targetLevel];
}
