// Background music: one looping <audio> shared by every screen that plays music.
// Each screen names its default track; a track the player picks overrides every default.
// Stored in localStorage: "music" ("on" | "off", on by default) and "musicTrack" (a track id).
// Browsers block audio until the page gets a click or key press, so playback waits for one.

export const TRACKS = [
    { id: "level-one-sunlight", title: "Level One Sunlight" },
    { id: "saturday-morning-save-point", title: "Saturday Morning Save Point" },
    { id: "answer-key-afternoon", title: "Answer Key Afternoon" },
    { id: "high-score-picnic", title: "High Score Picnic" },
    { id: "cartridge-sunday", title: "Cartridge Sunday" },
] as const;

export type TrackId = typeof TRACKS[number]["id"];

const ON_KEY = "music";
const TRACK_KEY = "musicTrack";
const VOLUME = 0.3;
export const MUSIC_EVENT = "musicchange";

const isTrackId = (v: string | null): v is TrackId => TRACKS.some(t => t.id === v);
export const trackTitle = (id: TrackId) => TRACKS.find(t => t.id === id)!.title;

let audio: HTMLAudioElement | null = null;
let screenDefault: TrackId | null = null; // null: no screen wants music right now
let waitingForGesture = false;

function read(key: string) {
    try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string | null) {
    try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* private mode */ }
}
const notify = () => window.dispatchEvent(new Event(MUSIC_EVENT));

export function isMusicOn() {
    return read(ON_KEY) !== "off";
}

/** The track the player picked, or null to use each screen's default. */
export function pickedTrack(): TrackId | null {
    const v = read(TRACK_KEY);
    return isTrackId(v) ? v : null;
}

/** What should be playing on the current screen. */
export function currentTrack(): TrackId | null {
    return screenDefault ? pickedTrack() ?? screenDefault : null;
}

function retryOnGesture() {
    if (waitingForGesture) return;
    waitingForGesture = true;
    const go = () => {
        waitingForGesture = false;
        window.removeEventListener("pointerdown", go);
        window.removeEventListener("keydown", go);
        sync();
    };
    window.addEventListener("pointerdown", go);
    window.addEventListener("keydown", go);
}

/** Make the audio element match the settings and the current screen. */
function sync() {
    if (typeof window === "undefined") return;
    const track = currentTrack();

    if (!track || !isMusicOn()) {
        audio?.pause();
        return;
    }
    if (!audio) {
        audio = new Audio();
        audio.loop = true;
        audio.volume = VOLUME;
        audio.preload = "auto";
    }
    const src = `/music/${track}.mp3`;
    if (!audio.src.endsWith(src)) audio.src = src;
    if (audio.paused) audio.play().catch(retryOnGesture);
}

/** Called by a screen that plays music. Returns the cleanup that stops it. */
export function startScreenMusic(defaultTrack: TrackId) {
    screenDefault = defaultTrack;
    sync();
    notify();
    return () => {
        if (screenDefault !== defaultTrack) return;
        screenDefault = null;
        sync();
        notify();
    };
}

export function setMusicOn(on: boolean) {
    write(ON_KEY, on ? "on" : "off");
    sync();
    notify();
}

/** Pick a track for every screen, or null to go back to each screen's default. */
export function pickTrack(id: TrackId | null) {
    write(TRACK_KEY, id);
    write(ON_KEY, "on"); // picking a track means "play this"
    sync();
    notify();
}
