// Renders pixel art from sprites.ts as a crisp SVG. Works in server and client components.

const PALETTE: Record<string, string> = {
    K: "var(--px-0)", // void (outline)
    N: "var(--px-1)", // night
    D: "var(--px-2)", // dusk (shade)
    S: "var(--px-3)", // steel
    F: "var(--px-4)", // fog
    W: "var(--px-5)", // snow (highlight)
    R: "var(--px-7)", // red
    O: "var(--px-8)", // orange
    Y: "var(--px-9)", // yellow
    L: "var(--px-a)", // lime
    G: "var(--px-b)", // green
    C: "var(--px-c)", // cyan
    B: "var(--px-d)", // blue
    U: "var(--px-e)", // purple
    P: "var(--px-f)", // pink
};

interface SpriteProps {
    art: string[];
    /** Screen pixels per art pixel. */
    scale?: number;
    className?: string;
    /** Accessible name. Omit for decorative sprites. */
    title?: string;
}

export default function Sprite({ art, scale = 4, className = "", title }: SpriteProps) {
    const height = art.length;
    const width = art[0].length;
    const rects: React.ReactNode[] = [];

    // Merge horizontal runs of the same color into one rect.
    art.forEach((row, y) => {
        let x = 0;
        while (x < row.length) {
            const ch = row[x];
            let run = 1;
            while (x + run < row.length && row[x + run] === ch) run++;
            if (ch !== "." && PALETTE[ch]) {
                rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={PALETTE[ch]} />);
            }
            x += run;
        }
    });

    return (
        <svg
            width={width * scale}
            height={height * scale}
            viewBox={`0 0 ${width} ${height}`}
            className={`px-sprite shrink-0 ${className}`}
            role={title ? "img" : undefined}
            aria-label={title}
            aria-hidden={title ? undefined : true}
        >
            {rects}
        </svg>
    );
}
