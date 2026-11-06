/**
 * Pixel art, one string per row. Each character is a palette index (see PALETTE in Sprite.tsx);
 * "." is transparent. Every row in a sprite must be the same length.
 *
 * The mascots are original: an armored hero ("Volt"); Orbi, the AI, is generated in HoloOrb.tsx.
 */

// Volt: mech-suit hero. Blue armor, cyan visor, pink chest core, yellow gauntlets. 16x20.
export const HERO = [
    "....KKKKKKKK....",
    "...KBBBBBBBBK...",
    "..KBBWBBBBBBBK..",
    "..KBBBBBBBBBBK..",
    "..KBKKKKKKKKBK..",
    "..KBKCCCCCCKBK..",
    "..KBKCWCCCCKBK..",
    "..KBKKKKKKKKBK..",
    "...KBBBDDBBBK...",
    "....KKSSSSKK....",
    ".KKBBBBBBBBBBKK.",
    "KBBDBBBKKBBBDBBK",
    "KBBDBBKPPKBBDBBK",
    "KBBDBBKPWKBBDBBK",
    "KSKDBBBKKBBBDKSK",
    "KYK.KBBBBBBK.KYK",
    "....KDDYYDDK....",
    "....KBBKKBBK....",
    "....KSSKKSSK....",
    "...KKKKKKKKKK...",
];

// HUD icons.
export const HEART = [
    ".RR.RR.",
    "RWRRRRR",
    "RRRRRRR",
    ".RRRRR.",
    "..RRR..",
    "...R...",
];
export const HEART_EMPTY = [
    ".SS.SS.",
    "S..S..S",
    "S.....S",
    ".S...S.",
    "..S.S..",
    "...S...",
];
export const COIN = [
    ".YYYY.",
    "YWYYYO",
    "YWYOYO",
    "YYYOYO",
    "YYYYOO",
    ".OOOO.",
];
export const FLAME = [
    "...O..",
    "..OO..",
    ".OOYO.",
    ".OYYO.",
    "OYYWYO",
    "OYWWYO",
    ".OYYO.",
    "..OO..",
];

// Game-mode icons, drawn in ink to sit on a colored tile. 8x8.
export const ICON_LIVE = [
    "....KK..",
    "...KK...",
    "..KK....",
    ".KKKKKK.",
    "....KK..",
    "...KK...",
    "..KK....",
    ".KK.....",
];
export const ICON_HOMEWORK = [
    ".K....K.",
    "KKKKKKKK",
    "KKKKKKKK",
    "K......K",
    "K.K.K..K",
    "K......K",
    "K.K.KK.K",
    "KKKKKKKK",
];
export const ICON_STUDY = [
    "..KKKKKK",
    "..K....K",
    "KKKKKK.K",
    "K....K.K",
    "K.KK.K.K",
    "K....KKK",
    "K.KK.K..",
    "KKKKKK..",
];
export const ICON_REPORTS = [
    "......KK",
    "......KK",
    "...KK.KK",
    "...KK.KK",
    "KK.KK.KK",
    "KK.KK.KK",
    "KK.KK.KK",
    "KKKKKKKK",
];
