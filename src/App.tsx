import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const SPRING = { type: "spring", stiffness: 260, damping: 20 } as const;

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

type Choice = "none" | "yes";

type Particle = {
    id: string;
    emoji: string;
    // spawn position (px) inside the container
    sx: number;
    sy: number;
    // travel delta (px)
    dx: number;
    dy: number;
    rotate: number;
    size: number;
    duration: number;
    delay: number;
};

const EMOJI_POOL = [
    "💖",
    "💘",
    "✨",
    "🌸",
    "🥰",
    "💝",
    "🎉",
    "😍",
    "💗",
    "💞",
    "🌹",
    "🫶",
];

function rand(min: number, max: number) {
    return min + Math.random() * (max - min);
}

function createParticle(w: number, h: number): Particle {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // spawn anywhere on screen
    const sx = rand(0, Math.max(1, w));
    const sy = rand(0, Math.max(1, h));

    // gentle upward drift + small sideways movement (looks floaty)
    const dx = rand(-140, 140);
    const dy = -rand(180, 420);

    return {
        id,
        emoji: EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)],
        sx,
        sy,
        dx,
        dy,
        rotate: rand(-120, 120),
        size: rand(14, 28),
        duration: rand(2.4, 3.8),
        delay: rand(0, 0.18),
    };
}

export function EmojiFlowEverywhere({
    active,
    rateMs = 140,
    perTick = 2,
    maxParticles = 70,
}: {
    active: boolean;
    rateMs?: number;
    perTick?: number;
    maxParticles?: number;
}) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const fieldRef = useRef<HTMLDivElement | null>(null);
    const timeoutsRef = useRef<number[]>([]);

    const clearAllTimeouts = () => {
        timeoutsRef.current.forEach((t) => window.clearTimeout(t));
        timeoutsRef.current = [];
    };

    useEffect(() => {
        if (!active) {
            clearAllTimeouts();
            setParticles([]);
            return;
        }

        const spawn = () => {
            const rect = fieldRef.current?.getBoundingClientRect();
            const w = rect?.width ?? window.innerWidth;
            const h = rect?.height ?? window.innerHeight;

            const created = Array.from({ length: perTick }, () =>
                createParticle(w, h),
            );

            setParticles((prev) => {
                const next = [...prev, ...created];
                return next.length > maxParticles
                    ? next.slice(next.length - maxParticles)
                    : next;
            });

            created.forEach((p) => {
                const ttl = (p.duration + p.delay + 0.25) * 1000;
                const tid = window.setTimeout(() => {
                    setParticles((prev) => prev.filter((x) => x.id !== p.id));
                }, ttl);
                timeoutsRef.current.push(tid);
            });
        };

        spawn();
        const interval = window.setInterval(spawn, rateMs);

        return () => {
            window.clearInterval(interval);
            clearAllTimeouts();
        };
    }, [active, rateMs, perTick, maxParticles]);

    if (!active) return null;

    return (
        <div ref={fieldRef} style={styles.field} aria-hidden="true">
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.span
                        key={p.id}
                        // start exactly where it spawned
                        initial={{
                            opacity: 0,
                            x: p.sx,
                            y: p.sy,
                            scale: 0.8,
                            rotate: 0,
                            filter: "blur(0.2px)",
                        }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            x: [p.sx, p.sx + p.dx * 0.5, p.sx + p.dx],
                            y: [p.sy, p.sy + p.dy * 0.55, p.sy + p.dy],
                            scale: [0.9, 1.05, 1],
                            rotate: [0, p.rotate * 0.6, p.rotate],
                            filter: ["blur(0.2px)", "blur(0px)", "blur(0px)"],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: p.duration,
                            delay: p.delay,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            ...styles.emoji,
                            fontSize: p.size,
                            willChange: "transform, opacity, filter",
                        }}
                    >
                        {p.emoji}
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default function App() {
    const title = `Will you be my valentine 😊`;

    const [choice, setChoice] = useState<Choice>("none");
    const [noClicks, setNoClicks] = useState(0);

    const yesScale = useMemo(
        () => clamp(1 + noClicks * 0.12, 1, 2.2),
        [noClicks],
    );
    const noScale = useMemo(
        () => clamp(1 - noClicks * 0.12, 0.25, 1),
        [noClicks],
    );

    function onNo() {
        if (choice === "yes") return;
        setNoClicks((c) => c + 1);
    }

    function onYes() {
        setChoice("yes");
    }

    const images = useMemo(
        () => ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg", "/6.jpg"],
        [],
    );

    return (
        <div style={styles.page}>
            <div style={styles.center}>
                <AnimatePresence mode="wait">
                    {choice === "yes" ? (
                        <motion.div
                            key="yesBlock"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={SPRING}
                            style={styles.yesBlock}
                        >
                            {/* Continuous flowing emojis from the center */}
                            <EmojiFlowEverywhere
                                active={choice === "yes"}
                                rateMs={140}
                                perTick={2}
                                maxParticles={70}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={SPRING}
                            style={{ width: "100%" }}
                        >
                            <div style={{ marginBottom: 18 }}>
                                <h2 style={{ textAlign: "center", margin: 0 }}>
                                    Hello there my beautiful 😘
                                </h2>
                            </div>

                            <div style={styles.card}>
                                {images.map((src) => (
                                    <motion.div
                                        key={src}
                                        initial={{ opacity: 0, y: 26 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 220,
                                            damping: 20,
                                        }}
                                        style={styles.photoWrap}
                                    >
                                        <img
                                            src={src}
                                            alt="Us"
                                            style={styles.photo}
                                        />
                                    </motion.div>
                                ))}

                                <div style={styles.textBlock}>
                                    <div style={styles.title}>{title}</div>

                                    <div style={styles.buttonsRow}>
                                        <motion.button
                                            onClick={onYes}
                                            style={{
                                                ...styles.yesBtn,
                                                transformOrigin: "center",
                                            }}
                                            animate={{ scale: yesScale }}
                                            transition={SPRING}
                                            whileTap={{
                                                scale: yesScale * 0.98,
                                            }}
                                        >
                                            Yes
                                        </motion.button>

                                        <motion.button
                                            onClick={onNo}
                                            style={{
                                                ...styles.noBtn,
                                                transformOrigin: "center",
                                            }}
                                            animate={{
                                                scale: noScale,
                                                opacity: noScale,
                                            }}
                                            transition={SPRING}
                                            whileTap={{ scale: noScale * 0.95 }}
                                            disabled={noScale <= 0.26}
                                            title={
                                                noScale <= 0.26
                                                    ? "okay okay 😄"
                                                    : undefined
                                            }
                                        >
                                            No
                                        </motion.button>
                                    </div>

                                    {noClicks >= 3 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.75 }}
                                            transition={SPRING}
                                            style={styles.hint}
                                        >
                                            (The “No” is getting shy.)
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    page: {
        overflowX: "hidden",
        width: "100%",
        minHeight: "100vh",
        background: "white",
        color: "black",
    },
    center: {
        width: "100%",
        maxWidth: 720,
        margin: "0 auto",
    },
    card: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 16,
        padding: 18,
        borderRadius: 18,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "rgba(0,0,0,0.02)",
    },
    photoWrap: {
        width: "100%",
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.08)",
    },
    photo: {
        width: "100%",
        height: 340,
        objectFit: "cover",
        display: "block",
    },
    textBlock: {
        padding: "6px 4px 10px",
        display: "flex",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        marginTop: 8,
    },
    title: {
        fontSize: 28,
        lineHeight: 1.1,
        textAlign: "center",
    },
    buttonsRow: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
        marginTop: 14,
    },
    yesBtn: {
        borderRadius: 999,
        padding: "10px 18px",
        border: "1px solid rgba(0,0,0,0.12)",
        background: "rgba(255, 82, 140, 0.75)",
        color: "white",
        cursor: "pointer",
        fontSize: 16,
    },
    noBtn: {
        borderRadius: 999,
        padding: "10px 18px",
        border: "1px solid rgba(0,0,0,0.12)",
        background: "black",
        color: "white",
        cursor: "pointer",
        fontSize: 16,
    },
    hint: {
        marginTop: 12,
        fontSize: 12,
        opacity: 0.8,
    },

    // YES SCREEN
    yesBlock: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        border: "1px solid rgba(0,0,0,0.08)",
        background:
            "radial-gradient(900px 500px at 30% 20%, rgba(255, 82, 140, 0.18), transparent 55%)," +
            "radial-gradient(900px 500px at 70% 30%, rgba(255, 210, 120, 0.16), transparent 60%)," +
            "white",
    },
    emojiBurst: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        contain: "layout paint",
    },
    field: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        contain: "layout paint",
    },
    emoji: {
        position: "absolute",
        left: 0,
        top: 0,
        textShadow: "0 8px 24px rgba(0,0,0,0.14)",
        backfaceVisibility: "hidden",
        transform: "translateZ(0)",
    },
    yesTextTop: {
        fontSize: 20,
        position: "relative",
        zIndex: 1,
    },
    yesText: {
        marginTop: 8,
        lineHeight: 1.6,
        position: "relative",
        zIndex: 1,
        fontSize: 15,
        opacity: 0.95,
    },
    restartBtn: {
        marginTop: 18,
        borderRadius: 999,
        padding: "10px 16px",
        border: "1px solid rgba(0,0,0,0.12)",
        background: "rgba(0,0,0,0.06)",
        cursor: "pointer",
    },
};
