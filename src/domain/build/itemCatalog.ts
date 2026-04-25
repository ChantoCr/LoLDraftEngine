import type { ItemReference } from '@/domain/build/types'

const ITEM_CATALOG: Record<string, ItemReference> = {
  'world-atlas': { itemId: 'world-atlas', itemName: 'World Atlas', tags: ['starter', 'support'] },
  'health-potion': { itemId: 'health-potion', itemName: 'Health Potion', tags: ['starter', 'consumable'] },
  'control-ward': { itemId: 'control-ward', itemName: 'Control Ward', tags: ['vision'] },
  'ruby-crystal': { itemId: 'ruby-crystal', itemName: 'Ruby Crystal', tags: ['health', 'first-buy'] },
  'kindlegem': { itemId: 'kindlegem', itemName: 'Kindlegem', tags: ['health', 'haste', 'first-buy'] },
  'cloth-armor': { itemId: 'cloth-armor', itemName: 'Cloth Armor', tags: ['armor', 'first-buy'] },
  'null-magic-mantle': { itemId: 'null-magic-mantle', itemName: 'Null-Magic Mantle', tags: ['magic-resist', 'first-buy'] },
  'forbidden-idol': { itemId: 'forbidden-idol', itemName: 'Forbidden Idol', tags: ['heal-power', 'shield-power', 'first-buy'] },
  boots: { itemId: 'boots', itemName: 'Boots', tags: ['mobility', 'first-buy'] },
  'doran-ring': { itemId: 'doran-ring', itemName: "Doran's Ring", tags: ['starter', 'mage'] },
  'doran-blade': { itemId: 'doran-blade', itemName: "Doran's Blade", tags: ['starter', 'marksman', 'fighter'] },
  'doran-shield': { itemId: 'doran-shield', itemName: "Doran's Shield", tags: ['starter', 'defensive'] },
  'lost-chapter': { itemId: 'lost-chapter', itemName: 'Lost Chapter', tags: ['mana', 'mage', 'first-buy'] },
  'amplifying-tome': { itemId: 'amplifying-tome', itemName: 'Amplifying Tome', tags: ['ap', 'first-buy'] },
  'noonquiver': { itemId: 'noonquiver', itemName: 'Noonquiver', tags: ['crit', 'marksman', 'first-buy'] },
  'long-sword': { itemId: 'long-sword', itemName: 'Long Sword', tags: ['ad', 'first-buy'] },
  pickaxe: { itemId: 'pickaxe', itemName: 'Pickaxe', tags: ['ad', 'first-buy'] },
  'caulfields-warhammer': { itemId: 'caulfields-warhammer', itemName: "Caulfield's Warhammer", tags: ['ad', 'haste', 'first-buy'] },
  'vampiric-scepter': { itemId: 'vampiric-scepter', itemName: 'Vampiric Scepter', tags: ['sustain', 'ad', 'first-buy'] },
  'seekers-armguard': { itemId: 'seekers-armguard', itemName: "Seeker's Armguard", tags: ['armor', 'mage', 'first-buy'] },
  'executioners-calling': { itemId: 'executioners-calling', itemName: "Executioner's Calling", tags: ['anti-heal', 'ad', 'first-buy'] },
  'oblivion-orb': { itemId: 'oblivion-orb', itemName: 'Oblivion Orb', tags: ['anti-heal', 'ap', 'first-buy'] },
  'jungle-pet': { itemId: 'jungle-pet', itemName: 'Jungle Pet', tags: ['starter', 'jungle'] },
  locket: { itemId: 'locket', itemName: 'Locket of the Iron Solari', tags: ['support', 'tank', 'defensive'] },
  'knights-vow': { itemId: 'knights-vow', itemName: "Knight's Vow", tags: ['support', 'peel', 'tank'] },
  'zekes-convergence': { itemId: 'zekes-convergence', itemName: "Zeke's Convergence", tags: ['support', 'engage', 'tank'] },
  'frozen-heart': { itemId: 'frozen-heart', itemName: 'Frozen Heart', tags: ['armor', 'anti-dps', 'tank'] },
  thornmail: { itemId: 'thornmail', itemName: 'Thornmail', tags: ['armor', 'anti-heal', 'tank'] },
  'abyssal-mask': { itemId: 'abyssal-mask', itemName: 'Abyssal Mask', tags: ['magic-resist', 'tank'] },
  redemption: { itemId: 'redemption', itemName: 'Redemption', tags: ['support', 'utility', 'heal-power'] },
  mikaels: { itemId: 'mikaels', itemName: "Mikael's Blessing", tags: ['support', 'cleanse', 'magic-resist'] },
  shurelya: { itemId: 'shurelya', itemName: "Shurelya's Battlesong", tags: ['support', 'engage', 'utility'] },
  'ardent-censer': { itemId: 'ardent-censer', itemName: 'Ardent Censer', tags: ['support', 'buff'] },
  'staff-of-flowing-water': { itemId: 'staff-of-flowing-water', itemName: 'Staff of Flowing Water', tags: ['support', 'ap-buff'] },
  'imperial-mandate': { itemId: 'imperial-mandate', itemName: 'Imperial Mandate', tags: ['support', 'catch'] },
  'black-cleaver': { itemId: 'black-cleaver', itemName: 'Black Cleaver', tags: ['ad', 'anti-frontline', 'fighter'] },
  steraks: { itemId: 'steraks', itemName: "Sterak's Gage", tags: ['ad', 'anti-burst', 'fighter'] },
  'deaths-dance': { itemId: 'deaths-dance', itemName: "Death's Dance", tags: ['armor', 'fighter'] },
  maw: { itemId: 'maw', itemName: 'Maw of Malmortius', tags: ['magic-resist', 'fighter'] },
  trinity: { itemId: 'trinity', itemName: 'Trinity Force', tags: ['fighter', 'core'] },
  'sunfire-aegis': { itemId: 'sunfire-aegis', itemName: 'Sunfire Aegis', tags: ['tank', 'frontline'] },
  warmogs: { itemId: 'warmogs', itemName: "Warmog's Armor", tags: ['tank', 'health'] },
  'infinity-edge': { itemId: 'infinity-edge', itemName: 'Infinity Edge', tags: ['marksman', 'crit'] },
  runaans: { itemId: 'runaans', itemName: "Runaan's Hurricane", tags: ['marksman', 'waveclear'] },
  'lord-dominiks': { itemId: 'lord-dominiks', itemName: "Lord Dominik's Regards", tags: ['marksman', 'anti-frontline'] },
  'guardian-angel': { itemId: 'guardian-angel', itemName: 'Guardian Angel', tags: ['marksman', 'anti-burst'] },
  bloodthirster: { itemId: 'bloodthirster', itemName: 'Bloodthirster', tags: ['marksman', 'sustain'] },
  malignance: { itemId: 'malignance', itemName: 'Malignance', tags: ['mage', 'mana'] },
  shadowflame: { itemId: 'shadowflame', itemName: 'Shadowflame', tags: ['mage', 'burst'] },
  zhonyas: { itemId: 'zhonyas', itemName: "Zhonya's Hourglass", tags: ['mage', 'anti-dive'] },
  banshees: { itemId: 'banshees', itemName: "Banshee's Veil", tags: ['mage', 'anti-pick'] },
  'rabadons': { itemId: 'rabadons', itemName: "Rabadon's Deathcap", tags: ['mage', 'scaling'] },
}

export function getItemReference(itemId: string): ItemReference {
  return ITEM_CATALOG[itemId] ?? { itemId, itemName: itemId, tags: ['unknown'] }
}

export function getItemReferences(itemIds: string[]) {
  return itemIds.map((itemId) => getItemReference(itemId))
}
