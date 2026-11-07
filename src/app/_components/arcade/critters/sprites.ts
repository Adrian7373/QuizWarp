// The critters: an original cast of tiny study-themed sprites that wander the site.
// Same format as ../sprites.ts (palette letters from Sprite.tsx, "." transparent).
// Every critter is 12x12 with two walk frames; most share a body and swap legs.

export interface CritterArt {
    id: string;
    name: string;
    frames: [string[], string[]];
    lines: string[];
}

const LEGS_A = ["...KK..KK...", "...KK..KK..."];
const LEGS_B = ["..KK....KK..", "..K......K.."];
const walker = (body: string[], a = LEGS_A, b = LEGS_B): [string[], string[]] => [[...body, ...a], [...body, ...b]];

const PIP = walker([
    "...KKKKKK...",
    "...KPPPPK...",
    "...KFFFFK...",
    "..KYYYYYYK..",
    "..KYKYYKYK..",
    "..KYYYYYYK..",
    "..KYYRRYYK..",
    "..KYYYYYYK..",
    "...KWWWWK...",
    "....KSSK....",
]);

const BYTE = walker([
    ".....K......",
    ".....Y......",
    "..KKKKKKKK..",
    "..KSSSSSSK..",
    "..KSCCCCSK..",
    "..KSCKKCSK..",
    "..KSSSSSSK..",
    "..KKKKKKKK..",
    ".KSKFFFFKSK.",
    "..KKFPPFKK..",
]);

// No legs: the slime squishes instead.
const GLOOP: [string[], string[]] = [
    [
        "............",
        "............",
        "............",
        "....KKKK....",
        "...KLLLLK...",
        "..KLWLLLLK..",
        "..KLKLLKLK..",
        ".KLLLLLLLLK.",
        ".KLLLRRLLLK.",
        "KLLLLLLLLLLK",
        "KGGGGGGGGGGK",
        "KKKKKKKKKKKK",
    ],
    [
        "............",
        "............",
        "............",
        "............",
        "....KKKK....",
        "..KKLLLLKK..",
        ".KLWLLLLLLK.",
        ".KLKLLLKLLK.",
        "KLLLLRRLLLLK",
        "KLLLLLLLLLLK",
        "KGGGGGGGGGGK",
        "KKKKKKKKKKKK",
    ],
];

const HOOT = walker([
    "..K......K..",
    "..KK....KK..",
    "..KOKKKKOK..",
    "..KOOOOOOK..",
    ".KWKOOOOKWK.",
    ".KWWOYYOWWK.",
    "..KOOYYOOK..",
    ".KOOFFFFOOK.",
    ".KOOFFFFOOK.",
    "..KOOOOOOK..",
], ["...KY..YK...", "...KK..KK..."], ["..KY....YK..", "..KK....KK.."]);

const DISK = walker([
    "............",
    ".KKKKKKKKKK.",
    ".KBBFFFFBBK.",
    ".KBBFSFFBBK.",
    ".KBBFFFFBBK.",
    ".KBBBBBBBBK.",
    ".KBBKBBKBBK.",
    ".KBBBBBBBBK.",
    ".KBWWWWWWBK.",
    ".KKKKKKKKKK.",
]);

const TOME = walker([
    "............",
    "..KKKKKKKK..",
    "..KRRRRRRK..",
    "..KRYYYYRK..",
    "..KRRRRRRK..",
    "..KRKRRKRK..",
    "..KRRRRRRK..",
    "..KRRPPRRK..",
    "..KRRRRRRK..",
    "..KWWWWWWK..",
]);

const SPROUT = walker([
    "...KK..KK...",
    "..KLLKKLLK..",
    "..KLGLLGLK..",
    "...KKLLKK...",
    "....KGGK....",
    "..KKKKKKKK..",
    "..KOOOOOOK..",
    "..KOKOOKOK..",
    "..KOOOOOOK..",
    "...KOOOOK...",
]);

export const CRITTERS: CritterArt[] = [
    { id: "pip", name: "Pip", frames: PIP, lines: ["Pop quiz!", "Sharpened and ready.", "Show your work!", "Is this on the test?"] },
    { id: "byte", name: "Byte", frames: BYTE, lines: ["Beep boop. Correct!", "Saving… don't turn off.", "Loading answer…", "01000001. That's A."] },
    { id: "gloop", name: "Gloop", frames: GLOOP, lines: ["Blorp.", "I absorb knowledge.", "Squish to continue.", "Streak ×3!"] },
    { id: "hoot", name: "Hoot", frames: HOOT, lines: ["Hoo knows the answer?", "Night owl studying.", "Hint: it's not C.", "Wise choice."] },
    { id: "disk", name: "Floppy", frames: DISK, lines: ["1.44 MB of facts.", "Insert disk 2.", "Save point reached.", "Remember me?"] },
    { id: "tome", name: "Tome", frames: TOME, lines: ["Read me!", "Chapter 1: You.", "Flashcards are my cardio.", "Don't judge my cover."] },
    { id: "sprout", name: "Sprout", frames: SPROUT, lines: ["Growing my brain.", "+100 XP!", "Water me with answers.", "Ready, player one?"] },
];

export const CRITTER_SIZE = 12;
