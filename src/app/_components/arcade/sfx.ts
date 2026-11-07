// Tiny chiptune engine: square-wave blips synthesized with Web Audio. No audio files.
// Sound is OFF until the player turns it on (stored in localStorage under "sfx").

export type Sfx = "blip" | "select" | "start" | "coin" | "correct" | "wrong" | "levelup";

const SFX_KEY = "sfx";
export const SFX_EVENT = "sfxchange";

// [frequency Hz, start offset s, duration s, waveform]
type Note = [number, number, number, OscillatorType?];
const SEQUENCES: Record<Sfx, Note[]> = {
    blip: [[880, 0, 0.05]],
    select: [[660, 0, 0.04], [990, 0.04, 0.05]],
    start: [[523, 0, 0.08], [659, 0.08, 0.08], [784, 0.16, 0.08], [1047, 0.24, 0.18]],
    coin: [[988, 0, 0.07], [1319, 0.07, 0.24]],
    correct: [[784, 0, 0.07], [1175, 0.07, 0.16]],
    wrong: [[196, 0, 0.12, "sawtooth"], [147, 0.12, 0.24, "sawtooth"]],
    levelup: [[523, 0, 0.07], [659, 0.07, 0.07], [784, 0.14, 0.07], [1047, 0.21, 0.07], [1319, 0.28, 0.22]],
};

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
}

export function isSfxOn(): boolean {
    try { return localStorage.getItem(SFX_KEY) === "on"; } catch { return false; }
}

export function setSfxOn(on: boolean) {
    try { localStorage.setItem(SFX_KEY, on ? "on" : "off"); } catch { /* private mode: setting just won't persist */ }
    window.dispatchEvent(new Event(SFX_EVENT));
}

/** Plays a sound if the player has sound on (or `force` for previews they asked for). */
export function playSfx(name: Sfx, force = false) {
    const notes = SEQUENCES[name];
    if (!notes) return; // e.g. data-sfx="none" opts an element out of the default blip
    if (!force && !isSfxOn()) return;
    const ac = getContext();
    if (!ac) return;
    const t0 = ac.currentTime + 0.01;
    for (const [freq, offset, dur, type = "square"] of notes) {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0 + offset);
        gain.gain.setValueAtTime(0.05, t0 + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + dur);
        osc.connect(gain).connect(ac.destination);
        osc.start(t0 + offset);
        osc.stop(t0 + offset + dur + 0.02);
    }
}
