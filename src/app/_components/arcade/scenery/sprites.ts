// Pixel art for the side scenery (floating isles in the empty page gutters).
// Same format as ../sprites.ts: one string per row, palette letters from Sprite.tsx, "." transparent.

// Round leafy tree. 16x17.
export const TREE = [
    ".....KKKKKK.....",
    "...KKLLLGGGKK...",
    "..KLLLLGGGGGGK..",
    ".KLLLGGGGGLGGGK.",
    ".KLLGGGGGLLLGGK.",
    "KLLGGGLGGGGGGGGK",
    "KLGGGLLLGGGGGGDK",
    "KGGGGGGGGGGLGGDK",
    "KGGLGGGGGGLLLGDK",
    ".KGGGGGGDGGGGDK.",
    ".KDGGGDDDGGGDDK.",
    "..KDDKKSDKKDDK..",
    "...KK.KSDK.KK...",
    "......KSDK......",
    "......KSDK......",
    ".....KSSDDK.....",
    "....KSSKKDDK....",
];

// Pine. 12x14.
export const PINE = [
    ".....KK.....",
    "....KLGK....",
    "...KLLGGK...",
    "...KLGGGK...",
    "..KLLGGGGK..",
    ".KKLGGGGDKK.",
    "..KLLGGGGK..",
    ".KLLGGGGGGK.",
    "KKLGGGGGGDKK",
    ".KLLGGGGGDK.",
    "KLLGGGGGGGDK",
    "KKKKKSDKKKKK",
    "....KSDK....",
    "....KSDK....",
];

// 14x7.
export const BUSH = [
    "...KKK..KKK...",
    "..KLLGKKLLGK..",
    ".KLLGGGLLGGGK.",
    "KLLGGGGGGGGGDK",
    "KLGGGLGGGGGGDK",
    "KGGGGGGGGGDDDK",
    ".KKKKKKKKKKKK.",
];

// 10x6.
export const ROCK = [
    "...KKKK...",
    "..KFFSSK..",
    ".KFWFSSDK.",
    "KFFSSSSDDK",
    "KSSSSSDDDK",
    ".KKKKKKKK.",
];

// 5x6.
export const FLOWER = [
    ".KPK.",
    "KPYPK",
    ".KPK.",
    "..G..",
    ".GG..",
    "..G..",
];

// Red bounce pad. 12x12.
export const SPRING = [
    ".KKKKKKKKKK.",
    "KRRRRRRRRRRK",
    "KRWRRRRRRRRK",
    ".KKKKKKKKKK.",
    "...KFFFFK...",
    "....KSSK....",
    "...KFFFFK...",
    "....KSSK....",
    "...KFFFFK...",
    "..KKKKKKKK..",
    ".KSSSSSSSSK.",
    ".KKKKKKKKKK.",
];

// Signpost pointing at the page. 14x10.
export const SIGN = [
    "KKKKKKKKKKKKK.",
    "KWWWWWWWWWWWKK",
    "KWWWWWKWWWWWWK",
    "KWKKKKKKWWWWWK",
    "KWWWWWKWWWWWKK",
    "KWWWWWWWWWWWK.",
    "KKKKKKKKKKKKK.",
    ".....KSDK.....",
    ".....KSDK.....",
    ".....KSDK.....",
];

// Collectible gem. Cyan, so it never reads as a coin (coins are AI credits). 8x7.
export const GEM = [
    "..KKKK..",
    ".KCWCCK.",
    "KCWCCCBK",
    "KCCCCCBK",
    ".KCCCBK.",
    "..KCBK..",
    "...KK...",
];

// 3x3.
export const FIREFLY = [
    ".L.",
    "LYL",
    ".L.",
];

// 5x5.
export const STAR = [
    "..W..",
    ".....",
    "W.W.W",
    ".....",
    "..W..",
];
