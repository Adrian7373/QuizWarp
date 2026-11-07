// Orbi, the AI companion: a pixel hologram sphere built from broken amber light.
// The art is generated from geometry (shell, tilted equator band, spinning meridian, core),
// so every frame stays a crisp pixel sprite. No hooks: renders in server and client components.
import Sprite from "./Sprite";

export type HoloMood = "idle" | "happy" | "sad";

const SIZE = 31;
const C = 15;
const FRAMES = 6;
const FRAME_SECONDS = 0.2;

// Deterministic per-pixel noise, so server and client render identical sprites.
function hash(x: number, y: number, f: number) {
    let h = (x * 374761393 + y * 668265263 + f * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Approximate pixel distance from (dx, dy) to an ellipse with radii rx, ry.
function ellipseDistance(dx: number, dy: number, rx: number, ry: number) {
    const f = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) - 1;
    const grad = Math.hypot((2 * dx) / (rx * rx), (2 * dy) / (ry * ry)) || 1;
    return Math.abs(f) / grad;
}

function frameArt(frame: number, mood: HoloMood): string[] {
    // Phase offset keeps the meridian from ever sitting exactly on the shell.
    const meridianRx = 14 * Math.abs(Math.cos(((frame + 0.5) / FRAMES) * Math.PI));
    const happy = mood === "happy";
    const rows: string[] = [];

    for (let y = 0; y < SIZE; y++) {
        let row = "";
        for (let x = 0; x < SIZE; x++) {
            const dx = x - C;
            const dy = y - C;
            const d = Math.hypot(dx, dy);
            const still = hash(x, y, 0);            // gaps that stay put
            const flicker = hash(x, y, frame + 1);  // light that shimmers frame to frame
            let ch = ".";

            // Outer shell: a thin broken ring of light.
            if (Math.abs(d - 14) < 0.55 && still > 0.25) ch = still > 0.78 ? "Y" : "O";

            // A sparse inner shell gives the sphere depth.
            if (ch === "." && Math.abs(d - 11.5) < 0.45 && still > 0.72) ch = "O";

            // Equator band, tilted like an orbit.
            if (ch === "." && d < 14.5 && ellipseDistance(dx, dy - dx * 0.25, 14, 4) < 0.5 && still > 0.15) ch = "Y";

            // A second orbit crossing the other way.
            if (ch === ".") {
                const a = Math.PI / 3;
                const u = dx * Math.cos(a) + dy * Math.sin(a);
                const v = -dx * Math.sin(a) + dy * Math.cos(a);
                if (d < 14.5 && ellipseDistance(u, v, 13, 4.5) < 0.45 && still > 0.35) ch = "O";
            }

            // Meridian ring: its width changes each frame, which reads as the sphere turning.
            if (ch === "." && d < 14.5 && meridianRx < 13 && flicker > 0.2) {
                const onMeridian = meridianRx < 0.8 ? Math.abs(dx) < 0.6 : ellipseDistance(dx, dy, meridianRx, 14) < 0.55;
                if (onMeridian) ch = "Y";
            }

            // The eye: a bright ring around a white core.
            if (Math.abs(d - 2.6) < 0.5) ch = happy ? "W" : "Y";
            if (d < (happy ? 1.5 : 1.1)) ch = "W";

            // Data streaks: short horizontal dashes drifting inside.
            const streak = happy ? 0.035 : 0.022;
            if (ch === "." && d < 12.5 && (flicker < streak || hash(x - 1, y, frame + 1) < streak)) ch = "O";

            // Happy: sparks fly off the shell.
            if (ch === "." && happy && d > 14.8 && d < 15.6 && flicker < 0.3) ch = "Y";

            // Sad: the light dims to embers.
            if (mood === "sad") ch = ch === "Y" ? "O" : ch === "O" ? "S" : ch === "W" ? "O" : ch;

            row += ch;
        }
        rows.push(row);
    }
    return rows;
}

// Precompute every frame once per module load.
const ART: Record<HoloMood, string[][]> = {
    idle: Array.from({ length: FRAMES }, (_, f) => frameArt(f, "idle")),
    happy: Array.from({ length: FRAMES }, (_, f) => frameArt(f, "happy")),
    sad: Array.from({ length: FRAMES }, (_, f) => frameArt(f, "sad")),
};

interface HoloOrbProps {
    mood?: HoloMood;
    /** Screen pixels per art pixel. The sprite is 31×31. */
    scale?: number;
    /** Spin through the frames. Off for small static uses like the logo. */
    spin?: boolean;
    title?: string;
    className?: string;
}

export default function HoloOrb({ mood = "idle", scale = 2, spin = true, title, className = "" }: HoloOrbProps) {
    const frames = ART[mood];
    const px = SIZE * scale;

    if (!spin) {
        return <Sprite art={frames[0]} scale={scale} title={title} className={`px-holo ${className}`} />;
    }

    // A real sprite strip: all frames in one row behind a one-frame window, slid by a single stepped
    // animation. One animation means exactly one frame is always on screen (separate per-frame
    // fades left gaps at the handovers, which made the orb blink out).
    return (
        <span
            className={`px-holo relative inline-block shrink-0 overflow-hidden ${className}`}
            style={{ width: px, height: px }}
            role={title ? "img" : undefined}
            aria-label={title}
            aria-hidden={title ? undefined : true}
        >
            <span
                className="px-holo-strip flex"
                style={{ width: px * FRAMES, animation: `px-strip ${FRAMES * FRAME_SECONDS}s steps(${FRAMES}, end) infinite` }}
            >
                {frames.map((art, i) => <Sprite key={i} art={art} scale={scale} />)}
            </span>
        </span>
    );
}
