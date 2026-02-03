import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

const SPRING = { type: "spring", stiffness: 260, damping: 20 } as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Choice = "none" | "yes";

/** Continuous "flow" particles (spawn at center, spring outward, fade, then removed) */
type Particle = {
  id: string;
  emoji: string;
  x: number;
  y: number;
  rotate: number;
  size: number;
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

function createParticle(): Particle {
  const now = Date.now();
  const id = `${now}-${Math.random().toString(16).slice(2)}`;

  // random direction with slight upward bias
  const angle = Math.random() * Math.PI * 2;
  const radius = 140 + Math.random() * 260;

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius - (50 + Math.random() * 160);

  return {
    id,
    emoji: EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)],
    x,
    y,
    rotate: Math.random() * 220 - 110,
    size: 18 + Math.random() * 16,
  };
}

function EmojiFlow({
  active,
  rateMs = 110,
  perTick = 2,
}: {
  active: boolean;
  rateMs?: number;
  perTick?: number;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const spawn = () => {
      const created = Array.from({ length: perTick }, () => createParticle());
      setParticles((prev) => [...prev, ...created]);

      // cleanup after animation completes
      window.setTimeout(() => {
        const ids = new Set(created.map((p) => p.id));
        setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
      }, 1700);
    };

    // immediate + continuous
    spawn();
    const interval = window.setInterval(spawn, rateMs);

    return () => window.clearInterval(interval);
  }, [active, rateMs, perTick]);

  if (!active) return null;

  return (
    <div style={styles.emojiBurst} aria-hidden="true">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.7 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: p.x,
              y: p.y,
              rotate: p.rotate,
              scale: [0.9, 1.15, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              // springy outward movement
              x: { type: "spring", stiffness: 240, damping: 18, mass: 0.8 },
              y: { type: "spring", stiffness: 220, damping: 18, mass: 0.9 },
              rotate: { type: "spring", stiffness: 160, damping: 16 },
              // fade timing
              opacity: { duration: 1.6, ease: "easeOut" },
              scale: { duration: 1.6, ease: "easeOut" },
            }}
            style={{
              ...styles.emoji,
              fontSize: p.size,
              willChange: "transform, opacity",
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

  const yesScale = useMemo(() => clamp(1 + noClicks * 0.12, 1, 2.2), [noClicks]);
  const noScale = useMemo(() => clamp(1 - noClicks * 0.12, 0.25, 1), [noClicks]);

  function onNo() {
    if (choice === "yes") return;
    setNoClicks((c) => c + 1);
  }

  function onYes() {
    setChoice("yes");
  }

  const images = useMemo(
    () => ["/1.jpg", "/2.jpg", "/3.jpg", "/4.jpg", "/5.jpg", "/6.jpg", "/7.jpg"],
    []
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
              <EmojiFlow active={choice === "yes"} rateMs={110} perTick={2} />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.05 }}
                style={styles.yesTextTop}
              >
                Good choice.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.95, y: 0 }}
                transition={{ ...SPRING, delay: 0.12 }}
                style={styles.yesText}
              >
                Pisi mi sega na ig 😊😊😊
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                transition={SPRING}
                style={styles.restartBtn}
                onClick={() => {
                  setChoice("none");
                  setNoClicks(0);
                }}
              >
                Replay
              </motion.button>
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
                  Hello there my beautiful wife 😘
                </h2>
              </div>

              <div style={styles.card}>
                {images.map((src) => (
                  <motion.div
                    key={src}
                    initial={{ opacity: 0, y: 26 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ type: "spring", stiffness: 220, damping: 20 }}
                    style={styles.photoWrap}
                  >
                    <img src={src} alt="Us" style={styles.photo} />
                  </motion.div>
                ))}

                <div style={styles.textBlock}>
                  <div style={styles.title}>{title}</div>

                  <div style={styles.buttonsRow}>
                    <motion.button
                      onClick={onYes}
                      style={{ ...styles.yesBtn, transformOrigin: "center" }}
                      animate={{ scale: yesScale }}
                      transition={SPRING}
                      whileTap={{ scale: yesScale * 0.98 }}
                    >
                      Yes
                    </motion.button>

                    <motion.button
                      onClick={onNo}
                      style={{ ...styles.noBtn, transformOrigin: "center" }}
                      animate={{ scale: noScale, opacity: noScale }}
                      transition={SPRING}
                      whileTap={{ scale: noScale * 0.95 }}
                      disabled={noScale <= 0.26}
                      title={noScale <= 0.26 ? "okay okay 😄" : undefined}
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
  emoji: {
    position: "absolute",
    textShadow: "0 10px 30px rgba(0,0,0,0.20)",
    backfaceVisibility: "hidden",
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
