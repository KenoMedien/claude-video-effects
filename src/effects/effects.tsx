import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Freeze, Img, OffthreadVideo, interpolate, staticFile, useVideoConfig } from "remotion";
import { Backdrop } from "./Backdrop";
import { EASE_IN_POW4, EASE_OUT, EASE_OUT_POW4, EASE_SLAM } from "./motion";
import { HEIGHT, WIDTH, rgba, useTheme } from "./theme";

/**
 * Effects that change the camera footage itself (zoom, glass, cut-out, frames). Each cue covers its
 * time window completely; outside of every window the layer renders nothing and the plain video
 * underneath shows through. Every video element here is muted: the sound comes from the base video.
 */
export type EffectKind =
  | "vorschau"
  | "greenscreen"
  | "magazin"
  | "chat"
  | "kurve"
  | "glas"
  | "orbit"
  | "dolly"
  | "papier"
  | "schlagzeilen"
  | "handy"
  | "snap"
  | "studio"
  | "liquid"
  | "portal"
  | "broll"
  | "text"
  | "sucher"
  | "rahmen"
  | "zoomschnitt"
  | "haekchen"
  | "checkliste";

export type EffectCue = {
  kind: EffectKind;
  /** Window in seconds of the video; the effect covers all of it. */
  from: number;
  to: number;
  /** Number and name in the header row; 0 keeps the cue out of the header. */
  nr: number;
  name: string;
  /** Trigger in seconds from `from`, usually the spoken word. */
  at?: number;
  /** Face centre in frame pixels (1080 x 1920), measured on a still. */
  face?: { x: number; y: number };
  /** Image in public/ used by the effect (photo, empty room, still of the moment). */
  src?: string;
  /** Still of the empty room in public/, shown behind the cut-out instead of the camera frame. */
  plate?: string;
  /** `text`: the word behind you. `magazin`: the masthead. `checkliste`: the closing line. */
  word?: string;
  /** Text lines of `schlagzeilen`, `haekchen`, `chat` (steps), `magazin` (cover lines), `kurve` (two labels). */
  lines?: string[];
  /** `chat`: the message in the bubble. */
  prompt?: string;
  /** `magazin`: text on the round badge. `chat`: small chip next to the name. */
  badge?: string;
  /** `handy`: profile picture in public/. Without it a coloured circle with the first letter shows. */
  avatar?: string;
  /** `handy`: account name next to the profile picture. */
  handle?: string;
};

export type EffectsSpec = {
  cues: EffectCue[];
  /** Total number shown in the header progress bar. */
  total: number;
};

type Ctx = { t: number; d: number; cue: EffectCue; seconds: number; source: string; cutout?: string; names: string[] };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (t: number, a: number, b: number, from = 0, to = 1, easing = EASE_OUT) =>
  interpolate(t, [a, b], [from, to], { ...clamp, easing });

const FULL: CSSProperties = { position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT };

const Cam: React.FC<{ src: string; style?: CSSProperties; transparent?: boolean }> = ({ src, style, transparent }) => (
  <OffthreadVideo src={staticFile(src)} muted transparent={transparent} style={{ ...FULL, objectFit: "cover", ...style }} />
);

const Picture: React.FC<{ src: string; style?: CSSProperties }> = ({ src, style }) => (
  <Img src={staticFile(src)} style={{ ...FULL, objectFit: "cover", ...style }} />
);

/** Camera frame and cut-out under one shared transform, so both stay pixel-aligned. */
const Layer: React.FC<{ transform?: string; origin?: { x: number; y: number }; children: ReactNode; style?: CSSProperties }> = ({
  transform,
  origin,
  children,
  style,
}) => <div style={{ ...FULL, transform, transformOrigin: origin ? `${origin.x}px ${origin.y}px` : undefined, ...style }}>{children}</div>;

const faceOf = (cue: EffectCue) => cue.face ?? { x: 540, y: 820 };

const line = (cue: EffectCue, index: number, fallback: string) => cue.lines?.[index] ?? fallback;

/** Neutral four-point spark, used where the original video showed an app logo. */
const Spark: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 1.5c.7 5.6 4.9 9.8 10.5 10.5-5.6.7-9.8 4.9-10.5 10.5C11.3 16.9 7.1 12.7 1.5 12 7.1 11.3 11.3 7.1 12 1.5z" fill={color} />
  </svg>
);

const Check: React.FC<{ size: number; done: number }> = ({ size, done }) => {
  const theme = useTheme();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: done > 0.5 ? theme.success : "rgba(10,10,12,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        scale: `${0.7 + 0.3 * done}`,
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
        <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - done} />
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Header row: number and name of the running effect                                          */
/* ------------------------------------------------------------------------------------------ */

const EffectHeader: React.FC<{ cue: EffectCue; t: number; total: number; enter: number }> = ({ cue, t, total, enter }) => {
  const theme = useTheme();
  const pop = ramp(t, 0, 0.22, 0.86, 1, EASE_SLAM);
  const box: CSSProperties = { height: 70, fontFamily: theme.font, fontSize: 40, display: "flex", alignItems: "center", boxShadow: "0 10px 26px rgba(10,10,12,0.28)" };
  return (
    <div
      style={{
        position: "absolute",
        top: 228,
        left: 0,
        width: WIDTH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        opacity: enter,
        translate: `0px ${((1 - enter) * -30).toFixed(1)}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, scale: `${pop}` }}>
        <div style={{ ...box, minWidth: 70, justifyContent: "center", borderRadius: 18, background: theme.accent, color: "#fff", fontWeight: 800 }}>
          {String(cue.nr).padStart(2, "0")}
        </div>
        <div style={{ ...box, padding: "0 30px", borderRadius: 20, background: "#fff", color: theme.ink, fontWeight: 700, letterSpacing: "-0.01em" }}>{cue.name}</div>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ width: 20, height: 7, borderRadius: 4, background: i < cue.nr ? theme.accent : "rgba(255,255,255,0.75)", boxShadow: "0 2px 6px rgba(10,10,12,0.3)" }} />
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Hook preview: all effect names pop up above the head                                         */
/* ------------------------------------------------------------------------------------------ */

const Vorschau: React.FC<Ctx> = ({ t, d, cue, source, names }) => {
  const theme = useTheme();
  const at = cue.at ?? 0.3;
  const out = ramp(t, d - 0.25, d, 1, 0);
  // The pills end just above the cap, so they never cover the head; never higher than y 240.
  const rows = Math.ceil(names.length / 3);
  const top = Math.max(240, faceOf(cue).y - 420 - rows * 56);
  return (
    <AbsoluteFill>
      <Cam src={source} />
      <div style={{ position: "absolute", left: 125, top, width: 830, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, opacity: out }}>
        {names.map((name, i) => {
          const p = ramp(t, at + i * 0.08, at + i * 0.08 + 0.22, 0, 1, EASE_SLAM);
          return (
            <div
              key={name}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "#fff",
                color: theme.ink,
                fontFamily: theme.font,
                fontWeight: 700,
                fontSize: names.length > 14 ? 26 : 30,
                boxShadow: "0 8px 20px rgba(10,10,12,0.25)",
                opacity: p,
                scale: `${0.6 + 0.4 * p}`,
              }}
            >
              {name}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Green screen: studio green behind you, a circle opens a photo                               */
/* ------------------------------------------------------------------------------------------ */

const GreenScreen: React.FC<Ctx> = ({ t, cue, source, cutout }) => {
  const theme = useTheme();
  const at = cue.at ?? 0.8;
  const r = ramp(t, at, at + 0.5, 0, 1500, EASE_OUT_POW4);
  const push = interpolate(t, [at, at + 2], [1.1, 1.0], clamp);
  return (
    <AbsoluteFill>
      <div style={{ ...FULL, background: `repeating-linear-gradient(90deg, ${theme.chroma} 0 64px, ${rgba(theme.chroma, 0.9)} 64px 128px)`, backgroundColor: theme.ink }} />
      <div style={{ ...FULL, clipPath: `circle(${r.toFixed(0)}px at 540px 820px)` }}>
        {cue.src ? (
          <Picture src={cue.src} style={{ scale: `${push}` }} />
        ) : (
          <div style={{ ...FULL, background: "linear-gradient(180deg, #1c2a5c 0%, #e9663a 62%, #ffb35c 100%)", scale: `${push}` }} />
        )}
      </div>
      {cutout ? <Cam src={cutout} transparent /> : <Cam src={source} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Magazine cover: cream studio paper, masthead behind your head, cover lines in front          */
/* ------------------------------------------------------------------------------------------ */

const Barcode: React.FC = () => {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 70, background: "#fff", padding: "8px 10px" }}>
      {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1].map((w, i) => (
        <div key={i} style={{ width: w * 2, height: 54, background: theme.ink }} />
      ))}
    </div>
  );
};

const Magazin: React.FC<Ctx> = ({ t, cue, source, cutout }) => {
  const theme = useTheme();
  const mast = ramp(t, 0, 0.3, 0, 1, EASE_SLAM);
  const enter = (at: number) => ({ opacity: ramp(t, at, at + 0.2), translate: `${((1 - ramp(t, at, at + 0.3)) * -40).toFixed(1)}px 0px` });
  const badge = ramp(t, 0.5, 0.75, 0, 1, EASE_SLAM);
  const masthead = cue.word ?? "COVER";
  const column = Math.max(170, Math.min(250, faceOf(cue).x - 330));
  return (
    <AbsoluteFill>
      {cutout ? (
        <div style={{ ...FULL, background: `radial-gradient(75% 55% at 52% 48%, #fff 0%, ${theme.light} 45%, ${theme.sand} 100%)` }} />
      ) : (
        <Cam src={source} />
      )}
      <div style={{ position: "absolute", left: 140, top: 1180, width: 800, height: 260, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(10,10,12,0.22), rgba(10,10,12,0))" }} />
      <div
        style={{
          position: "absolute",
          top: 352,
          left: 0,
          width: WIDTH,
          textAlign: "center",
          fontFamily: theme.font,
          fontWeight: 900,
          // Wide capitals (C, O, W) take about 0.74 em; longer mastheads shrink to the frame width.
          fontSize: Math.min(330, Math.floor(1000 / (masthead.length * 0.74))),
          lineHeight: 0.82,
          letterSpacing: "-0.06em",
          color: theme.accent,
          opacity: mast,
          scale: `${1.12 - 0.12 * mast}`,
        }}
      >
        {masthead}
      </div>
      {cutout ? <Cam src={cutout} transparent style={{ filter: "drop-shadow(0 24px 40px rgba(10,10,12,0.25))" }} /> : null}
      <div style={{ position: "absolute", top: 336, left: 130, right: 250, display: "flex", justifyContent: "space-between", fontFamily: theme.font, fontWeight: 700, fontSize: 22, letterSpacing: "0.14em", color: theme.ink, opacity: mast }}>
        <span>DIE KI AUSGABE</span>
        <span>NR. 01</span>
      </div>
      <div style={{ position: "absolute", left: 110, top: 640, width: column, fontFamily: theme.font, color: theme.ink }}>
        <div style={{ ...enter(0.15), fontSize: 24, fontWeight: 800, letterSpacing: "0.12em", color: theme.accent }}>{line(cue, 0, "TITELSTORY")}</div>
        <div style={{ ...enter(0.22), fontSize: 130, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em" }}>{line(cue, 1, "21")}</div>
        <div style={{ ...enter(0.3), fontSize: 36, fontWeight: 800, lineHeight: 1.08 }}>{line(cue, 2, "Effekte. Ein Prompt.")}</div>
        <div style={{ ...enter(0.38), marginTop: 18, fontSize: 26, fontWeight: 700, lineHeight: 1.12 }}>{line(cue, 3, "Claude schneidet jetzt Videos")}</div>
      </div>
      <div
        style={{
          position: "absolute",
          // Right of the head, above the barcode: the text column on the left needs its full height.
          left: Math.min(870, faceOf(cue).x + 300),
          top: 800,
          width: 170,
          height: 170,
          borderRadius: "50%",
          background: theme.gold,
          color: theme.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: theme.font,
          fontWeight: 900,
          fontSize: 40,
          lineHeight: 1,
          rotate: "-12deg",
          scale: `${badge}`,
          boxShadow: "0 12px 30px rgba(10,10,12,0.35)",
        }}
      >
        {cue.badge ?? "NEU"}
      </div>
      <div style={{ position: "absolute", left: 870, top: 1010, opacity: ramp(t, 0.45, 0.6) }}>
        <Barcode />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Chat takeover: the frame shrinks into the attachment of a chat message                      */
/* ------------------------------------------------------------------------------------------ */

const CHAT = { left: 70, top: 345, width: 940, height: 800 };
const BUBBLE = { left: 145, top: 470, width: 685, height: 406 };
const THUMB = { left: 170, top: 495, width: 200, height: 356 };

const Chat: React.FC<Ctx> = ({ t, cue, source, seconds }) => {
  const theme = useTheme();
  const p = ramp(t, 0, 0.55, 0, 1, EASE_OUT_POW4);
  const lerp = (a: number, b: number) => a + (b - a) * p;
  const win = ramp(t, 0.1, 0.45);
  const steps = [
    { at: 1.2, label: line(cue, 0, "Pausen rausschneiden") },
    { at: 1.5, label: line(cue, 1, "Jedes Wort untertiteln") },
    { at: 1.8, label: line(cue, 2, "Effekte einbauen") },
  ];
  const reply = ramp(t, 0.85, 1.05);
  return (
    <AbsoluteFill style={{ fontFamily: theme.font, color: theme.ink }}>
      <Backdrop seconds={seconds} />
      <div style={{ opacity: win, translate: `0px ${((1 - win) * 40).toFixed(1)}px` }}>
        <div style={{ position: "absolute", ...CHAT, borderRadius: 34, background: theme.light, border: `1px solid ${rgba(theme.deep, 0.16)}`, boxShadow: "0 26px 70px rgba(10,10,12,0.34), 0 6px 18px rgba(10,10,12,0.18)" }} />
        <div style={{ position: "absolute", left: 145, top: 372, width: 685, display: "flex", alignItems: "center", gap: 14 }}>
          <Spark size={48} color={theme.accent} />
          <span style={{ fontSize: 38, fontWeight: 700 }}>Claude</span>
          {cue.badge ? <span style={{ marginLeft: "auto", fontSize: 26, fontWeight: 700, padding: "6px 18px", borderRadius: 999, background: theme.sand }}>{cue.badge}</span> : null}
        </div>
        <div style={{ position: "absolute", ...BUBBLE, borderRadius: 30, background: "#fff", boxShadow: "0 8px 22px rgba(10,10,12,0.1)" }} />
        <div style={{ position: "absolute", left: 395, top: 500, width: 410, fontSize: 36, fontWeight: 600, lineHeight: 1.28, opacity: ramp(t, 0.25, 0.5) }}>
          {cue.prompt ?? "Schneide dieses Video, setz Untertitel für jedes Wort und bau diese Effekte ein."}
        </div>
      </div>
      <div style={{ position: "absolute", left: 145, top: 905, opacity: reply, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 38, fontWeight: 700 }}>
          <Spark size={42} color={theme.accent} />
          Mach ich.
        </div>
        {steps.map((step) => (
          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 32, fontWeight: 600, opacity: ramp(t, step.at - 0.15, step.at) }}>
            <Check size={38} done={ramp(t, step.at + 0.1, step.at + 0.3)} />
            {step.label}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: lerp(0, THUMB.left),
          top: lerp(0, THUMB.top),
          width: lerp(WIDTH, THUMB.width),
          height: lerp(HEIGHT, THUMB.height),
          borderRadius: lerp(0, 20),
          overflow: "hidden",
          boxShadow: p > 0.05 ? "0 14px 34px rgba(10,10,12,0.3)" : "none",
        }}
      >
        <Cam src={source} style={{ width: "100%", height: "100%" }} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Growth curve: dark grid behind you, a glowing line shoots up                                */
/* ------------------------------------------------------------------------------------------ */

const CURVE = "M156 1000 C306 998 456 990 562 965 C675 937 750 770 785 372";

const Kurve: React.FC<Ctx> = ({ t, cue, source, cutout }) => {
  const theme = useTheme();
  const at = cue.at ?? 0.83;
  // Flat part first, then the steep climb on the trigger word.
  const draw = t < at ? ramp(t, 0.12, at, 0, 0.45, (x) => x) : ramp(t, at, at + 0.24, 0.45, 1, EASE_OUT_POW4);
  const peak = ramp(t, at + 0.22, at + 0.4, 0, 1, EASE_SLAM);
  const night = `color-mix(in srgb, ${theme.deep} 38%, ${theme.ink})`;
  const grid = rgba(theme.glow, 0.12);
  const pill: CSSProperties = { position: "absolute", display: "flex", alignItems: "center", whiteSpace: "nowrap", fontFamily: theme.font, lineHeight: 1, borderRadius: 999 };
  return (
    <AbsoluteFill>
      {cutout ? (
        <div
          style={{
            ...FULL,
            background:
              `radial-gradient(ellipse 75% 60% at 50% 42%, transparent 0%, transparent 35%, ${rgba(theme.ink, 0.72)} 100%),` +
              `linear-gradient(90deg, ${grid} 1px, transparent 1px) 0 0 / 90px 90px,` +
              `linear-gradient(0deg, ${grid} 1px, transparent 1px) 0 10px / 90px 90px, ${night}`,
          }}
        />
      ) : (
        <Cam src={source} />
      )}
      <svg width={WIDTH} height={HEIGHT} style={FULL}>
        <defs>
          <filter id="curve-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <path d={CURVE} fill="none" stroke={theme.glow} strokeWidth={30} strokeLinecap="round" opacity={0.55} filter="url(#curve-soft)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        <path d={CURVE} fill="none" stroke={theme.glow} strokeWidth={13} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        <circle cx={156} cy={1000} r={14} fill={theme.paper} stroke={theme.glow} strokeWidth={5} />
        <circle cx={785} cy={372} r={18 * peak} fill={theme.glow} />
        <circle cx={785} cy={372} r={40 * peak} fill={theme.glow} opacity={0.35} filter="url(#curve-soft)" />
      </svg>
      <div style={{ ...pill, left: 139, top: 924, height: 54, padding: "0 26px", fontSize: 30, fontWeight: 600, color: theme.paper, background: rgba(theme.ink, 0.55), border: `2px solid ${rgba(theme.glow, 0.45)}` }}>
        {line(cue, 0, "vorher")}
      </div>
      <div style={{ ...pill, right: 322, top: 350, height: 76, padding: "0 32px", fontSize: 40, fontWeight: 800, color: theme.ink, background: theme.glow, opacity: peak, scale: `${0.7 + 0.3 * peak}` }}>
        {line(cue, 1, "mit Claude")}
      </div>
      {cutout ? <Cam src={cutout} transparent style={{ filter: `drop-shadow(0 0 40px ${rgba(theme.glow, 0.25)})` }} /> : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Glass break: cracks, then the frozen frame falls apart in shards                            */
/* ------------------------------------------------------------------------------------------ */

const random = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

type Shard = { points: [number, number][]; cx: number; cy: number; vx: number; vy: number; spin: number; tilt: number; delay: number };

const buildShards = (impact: { x: number; y: number }): { shards: Shard[]; cracks: [number, number][][] } => {
  const rnd = random(20261023);
  const rings = [0, 70, 180, 340, 600, 1000, 2600];
  const sectors = 14;
  const base = Array.from({ length: sectors }, (_, k) => (k / sectors) * Math.PI * 2 + rnd() * 0.25);
  const vertex = rings.map((r, j) =>
    base.map((a) => {
      const angle = a + (j === 0 ? 0 : (rnd() - 0.5) * 0.18);
      const radius = r * (j === 0 || j === rings.length - 1 ? 1 : 0.85 + rnd() * 0.3);
      return [impact.x + Math.cos(angle) * radius, impact.y + Math.sin(angle) * radius] as [number, number];
    }),
  );
  const shards: Shard[] = [];
  for (let j = 0; j < rings.length - 1; j++) {
    for (let k = 0; k < sectors; k++) {
      const k2 = (k + 1) % sectors;
      const points: [number, number][] = j === 0 ? [vertex[0][k], vertex[1][k], vertex[1][k2]] : [vertex[j][k], vertex[j][k2], vertex[j + 1][k2], vertex[j + 1][k]];
      const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
      const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
      const dx = cx - impact.x;
      const dy = cy - impact.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const speed = 900 + rnd() * 900;
      shards.push({
        points,
        cx,
        cy,
        vx: (dx / len) * speed * 0.6 + (rnd() - 0.5) * 300,
        vy: (dy / len) * speed * 0.35 - 200 - rnd() * 300,
        spin: (rnd() - 0.5) * 540,
        tilt: (rnd() - 0.5) * 140,
        delay: Math.min(0.18, len / 4000) + rnd() * 0.05,
      });
    }
  }
  const cracks: [number, number][][] = base.map((_, k) => rings.slice(0, -1).map((__, j) => vertex[j][k]));
  for (let j = 1; j < rings.length - 2; j++) cracks.push([...vertex[j], vertex[j][0]]);
  return { shards, cracks };
};

/** The frozen frame: a still image if given, otherwise the video held on the first frame of the cue (slower to render). */
const FrozenFrame: React.FC<{ cue: EffectCue; source: string }> = ({ cue, source }) => {
  const { fps } = useVideoConfig();
  if (cue.src) return <Picture src={cue.src} />;
  return (
    <Freeze frame={Math.round(cue.from * fps)}>
      <Cam src={source} />
    </Freeze>
  );
};

const Glas: React.FC<Ctx> = ({ t, cue, source }) => {
  const impact = cue.face ? { x: cue.face.x + 190, y: cue.face.y - 40 } : { x: 760, y: 760 };
  const { shards, cracks } = buildShards(impact);
  const breakAt = cue.at ?? 0.38;
  const draw = ramp(t, 0, 0.16);
  const flash = interpolate(t, [0, 0.03, 0.12], [0, 0.55, 0], clamp);
  const fallT = Math.max(0, t - breakAt);
  return (
    <AbsoluteFill style={{ perspective: 1400 }}>
      <Cam src={source} />
      {t < breakAt ? (
        <>
          <FrozenFrame cue={cue} source={source} />
          <svg width={WIDTH} height={HEIGHT} style={{ ...FULL, filter: "drop-shadow(0 0 2px rgba(10,10,12,0.8))" }}>
            {cracks.map((pts, i) => (
              <polyline
                key={i}
                points={pts.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke="rgba(255,255,255,0.92)"
                strokeWidth={i < 14 ? 3.2 : 2}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - draw}
              />
            ))}
          </svg>
        </>
      ) : (
        shards.map((s, i) => {
          const local = Math.max(0, fallT - s.delay);
          const x = s.vx * local;
          const y = s.vy * local + 2600 * local * local;
          const fade = interpolate(local, [0.55, 0.9], [1, 0], clamp);
          if (fade <= 0) return null;
          return (
            <div
              key={i}
              style={{
                ...FULL,
                clipPath: `polygon(${s.points.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(",")})`,
                transformOrigin: `${s.cx.toFixed(0)}px ${s.cy.toFixed(0)}px`,
                transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotateZ(${(s.spin * local).toFixed(1)}deg) rotateX(${(s.tilt * local).toFixed(1)}deg)`,
                opacity: fade,
                filter: `brightness(${(1 + 0.25 * Math.sin(i)).toFixed(2)})`,
              }}
            >
              <FrozenFrame cue={cue} source={source} />
            </div>
          );
        })
      )}
      <div style={{ ...FULL, background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Orbit: icons circle the head, passing behind the cut-out on the far side                    */
/* ------------------------------------------------------------------------------------------ */

const OrbitIcon: React.FC<{ index: number }> = ({ index }) => {
  const theme = useTheme();
  const content = [
    <Spark key="spark" size={58} color={theme.accent} />,
    <div key="wave" style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {[18, 34, 46, 30, 20].map((h, i) => (
        <div key={i} style={{ width: 7, height: h, borderRadius: 4, background: theme.deep }} />
      ))}
    </div>,
    <span key="cc" style={{ fontFamily: theme.font, fontWeight: 800, fontSize: 30, color: theme.ink, border: `3px solid ${theme.ink}`, borderRadius: 8, padding: "2px 7px" }}>CC</span>,
    <svg key="cut" width={52} height={52} viewBox="0 0 24 24" fill="none" stroke={theme.ink} strokeWidth={2} strokeLinecap="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </svg>,
    <span key="aa" style={{ fontFamily: theme.font, fontWeight: 800, fontSize: 40, color: theme.ink }}>Aa</span>,
    <svg key="play" width={44} height={44} viewBox="0 0 24 24">
      <path d="M7 4.5v15l12.5-7.5z" fill={theme.accent} />
    </svg>,
  ][index];
  return (
    <div style={{ width: 104, height: 104, borderRadius: 28, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(10,10,12,0.3)" }}>
      {content}
    </div>
  );
};

const Orbit: React.FC<Ctx> = ({ t, d, cue, source, cutout }) => {
  const face = faceOf(cue);
  const center = { x: face.x, y: face.y - 280 };
  const grow = ramp(t, 0, 0.4, 0, 1, EASE_OUT_POW4);
  const out = ramp(t, d - 0.2, d, 1, 0);
  const rx = 340 * grow;
  const ry = 105 * grow;
  const icons = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + t * 2.1;
    const depth = Math.sin(angle);
    return { i, x: center.x + Math.cos(angle) * rx, y: center.y + depth * ry, depth };
  });
  const place = (icon: (typeof icons)[number]) => (
    <div
      key={icon.i}
      style={{
        position: "absolute",
        left: icon.x - 52,
        top: icon.y - 52,
        scale: `${(0.82 + (0.22 * (icon.depth + 1)) / 2) * (0.4 + 0.6 * grow)}`,
        opacity: out * (icon.depth < 0 ? 0.88 : 1),
      }}
    >
      <OrbitIcon index={icon.i} />
    </div>
  );
  return (
    <AbsoluteFill>
      <Cam src={source} />
      <svg width={WIDTH} height={HEIGHT} style={{ ...FULL, opacity: out * grow }}>
        <ellipse cx={center.x} cy={center.y} rx={rx} ry={ry} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={3} strokeDasharray="10 12" />
      </svg>
      {icons.filter((icon) => icon.depth < 0).map(place)}
      {cutout ? <Cam src={cutout} transparent /> : null}
      {icons.filter((icon) => icon.depth >= 0).map(place)}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Dolly zoom: the face keeps its size, the empty room behind contracts                        */
/* ------------------------------------------------------------------------------------------ */

const DOLLY_ZOOM = 1.38;

const Dolly: React.FC<Ctx> = ({ t, d, cue, source, cutout }) => {
  const face = faceOf(cue);
  const p = interpolate(t, [0, d], [0, 1], { ...clamp, easing: EASE_OUT });
  const bg = DOLLY_ZOOM - (DOLLY_ZOOM - 1) * p;
  const room = cue.src ?? cue.plate;
  if (!cutout || !room) {
    return (
      <Layer transform={`scale(${(1 + (DOLLY_ZOOM - 1) * p).toFixed(4)})`} origin={face}>
        <Cam src={source} />
      </Layer>
    );
  }
  return (
    <AbsoluteFill>
      <Layer transform={`scale(${bg.toFixed(4)})`} origin={face}>
        <Picture src={room} />
      </Layer>
      <Layer transform={`scale(${DOLLY_ZOOM})`} origin={face}>
        <Cam src={cutout} transparent />
      </Layer>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Paper cut-out: you with a white paper edge on a flat colour field                           */
/* ------------------------------------------------------------------------------------------ */

const PAPER_EDGE = [
  "drop-shadow(9px 0 0 #fff)",
  "drop-shadow(-9px 0 0 #fff)",
  "drop-shadow(0 9px 0 #fff)",
  "drop-shadow(0 -9px 0 #fff)",
  "drop-shadow(0 18px 22px rgba(10,10,12,0.35))",
].join(" ");

const Star: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 1.8l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.6l-6.3 3.6 1.5-7.1L1.8 9.2 9 8.4z" fill={color} />
  </svg>
);

const Papier: React.FC<Ctx> = ({ t, source, cutout }) => {
  const theme = useTheme();
  const pop = (at: number) => ramp(t, at, at + 0.28, 0, 1, EASE_SLAM);
  const settle = ramp(t, 0, 0.3, 0, 1, EASE_SLAM);
  return (
    <AbsoluteFill>
      <div style={{ ...FULL, background: theme.gold }} />
      <svg width={WIDTH} height={HEIGHT} style={{ ...FULL, opacity: 0.18, mixBlendMode: "multiply" }}>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={WIDTH} height={HEIGHT} filter="url(#paper-grain)" />
      </svg>
      <div style={{ position: "absolute", left: 650, top: 360, width: 300, height: 300, borderRadius: "50%", background: theme.deep, scale: `${pop(0.05)}` }} />
      <div style={{ position: "absolute", left: 120, top: 400, rotate: `${(1 - pop(0.1)) * -120}deg`, scale: `${pop(0.1)}` }}>
        <Star size={150} color={theme.ink} />
      </div>
      <div style={{ position: "absolute", left: -60, top: 1010, width: 1300, height: 90, background: theme.ink, rotate: "-14deg", translate: `${((1 - pop(0.15)) * -1300).toFixed(0)}px 0px` }} />
      <div style={{ position: "absolute", left: 170, top: 760, width: 46, height: 46, borderRadius: "50%", background: theme.paper, scale: `${pop(0.2)}` }} />
      <div style={{ position: "absolute", left: 880, top: 700, width: 60, height: 60, borderRadius: "50%", background: theme.paper, scale: `${pop(0.25)}` }} />
      <Layer transform={`rotate(${(-2.5 * settle).toFixed(2)}deg) scale(${(1.04 - 0.06 * settle).toFixed(4)})`} origin={{ x: 540, y: 1200 }} style={{ filter: PAPER_EDGE }}>
        {cutout ? <Cam src={cutout} transparent /> : <Cam src={source} />}
      </Layer>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Headline storm: breaking-news bands fly in and run behind you                               */
/* ------------------------------------------------------------------------------------------ */

const HEADLINE_DEFAULTS = ["CLAUDE SCHNEIDET JETZT VIDEOS", "21 EFFEKTE, EIN PROMPT", "JEDES WORT UNTERTITELT", "ROHVIDEO REIN, REEL RAUS", "GESCHNITTEN MIT CLAUDE"];
const HEADLINE_TAGS = ["EILMELDUNG", "NEU", "LIVE", "EILMELDUNG", "NEU"];
const HEADLINE_ROT = [-7, 5, -4, 6, -6];
/** With a cut-out the bands may run at head height, because you stand in front of them. */
const HEADLINE_ROWS_CUTOUT = [430, 600, 760, 920, 1080];
const HEADLINE_ROWS_FLAT = [360, 470, 575, 1010, 1110];

const Schlagzeilen: React.FC<Ctx> = ({ t, cue, source, cutout }) => {
  const theme = useTheme();
  const rows = cutout ? HEADLINE_ROWS_CUTOUT : HEADLINE_ROWS_FLAT;
  const texts = (cue.lines?.length ? cue.lines : HEADLINE_DEFAULTS).slice(0, 5);
  return (
    <AbsoluteFill>
      {cue.plate && cutout ? <Picture src={cue.plate} /> : <Cam src={source} />}
      {texts.map((text, i) => {
        const p = ramp(t, 0.05 + i * 0.13, 0.33 + i * 0.13, 0, 1, EASE_OUT_POW4);
        const from = i % 2 === 0 ? -1 : 1;
        return (
          <div
            key={`${i}-${text}`}
            style={{
              position: "absolute",
              left: 125,
              top: rows[i],
              display: "flex",
              alignItems: "stretch",
              rotate: `${HEADLINE_ROT[i]}deg`,
              translate: `${((1 - p) * 1300 * from + t * 14).toFixed(1)}px 0px`,
              boxShadow: "0 12px 28px rgba(10,10,12,0.35)",
              fontFamily: theme.font,
            }}
          >
            <div style={{ background: theme.accent, color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: "0.08em", padding: "0 14px", display: "flex", alignItems: "center" }}>{HEADLINE_TAGS[i]}</div>
            <div style={{ background: "#fff", color: theme.ink, fontWeight: 900, fontSize: 40, letterSpacing: "-0.01em", padding: "12px 22px", whiteSpace: "nowrap" }}>{text}</div>
          </div>
        );
      })}
      {cutout ? <Cam src={cutout} transparent /> : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Phone mock-up: the video shrinks into a phone with a Reels-style interface                  */
/* ------------------------------------------------------------------------------------------ */

const PHONE = { left: 335, top: 345, width: 410, height: 800, bezel: 14, radius: 64 };

const ReelsIcon: React.FC<{ d: string }> = ({ d }) => (
  <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>
    <path d={d} />
  </svg>
);

const Handy: React.FC<Ctx> = ({ t, cue, source, seconds }) => {
  const theme = useTheme();
  const p = ramp(t, 0, 0.5, 0, 1, EASE_OUT_POW4);
  const screen = { left: PHONE.left + PHONE.bezel, top: PHONE.top + PHONE.bezel, width: PHONE.width - PHONE.bezel * 2, height: PHONE.height - PHONE.bezel * 2 };
  const lerp = (a: number, b: number) => a + (b - a) * p;
  const ui = ramp(t, 0.45, 0.7);
  const handle = cue.handle ?? "deinname";
  const avatar: CSSProperties = { width: 40, height: 40, borderRadius: "50%", border: "2px solid #fff" };
  return (
    <AbsoluteFill>
      <Backdrop seconds={seconds} />
      <div
        style={{
          position: "absolute",
          left: PHONE.left,
          top: PHONE.top,
          width: PHONE.width,
          height: PHONE.height,
          borderRadius: PHONE.radius,
          background: theme.ink,
          boxShadow: "0 40px 90px rgba(10,10,12,0.45), inset 0 0 0 3px rgba(255,255,255,0.12)",
          opacity: ramp(t, 0.1, 0.4),
          scale: `${lerp(1.4, 1)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: lerp(0, screen.left),
          top: lerp(0, screen.top),
          width: lerp(WIDTH, screen.width),
          height: lerp(HEIGHT, screen.height),
          borderRadius: lerp(0, PHONE.radius - PHONE.bezel),
          overflow: "hidden",
        }}
      >
        <Cam src={source} style={{ width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", inset: 0, opacity: ui, fontFamily: theme.font, color: "#fff" }}>
          <div style={{ position: "absolute", top: 14, left: "50%", width: 110, height: 32, marginLeft: -55, borderRadius: 20, background: theme.ink }} />
          <div style={{ position: "absolute", top: 62, left: 22, fontSize: 24, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>Reels</div>
          <div style={{ position: "absolute", right: 14, bottom: 120, display: "flex", flexDirection: "column", gap: 26 }}>
            <ReelsIcon d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
            <ReelsIcon d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
            <ReelsIcon d="M21 4L10.5 13.5M21 4l-6.5 17-3.9-7.5L3 9.6z" />
          </div>
          <div style={{ position: "absolute", left: 18, bottom: 64, display: "flex", alignItems: "center", gap: 10, fontSize: 21, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            {cue.avatar ? (
              <Img src={staticFile(cue.avatar)} style={{ ...avatar, objectFit: "cover" }} />
            ) : (
              <div style={{ ...avatar, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>{handle.charAt(0).toUpperCase()}</div>
            )}
            {handle}
            <span style={{ border: "1.5px solid #fff", borderRadius: 8, padding: "2px 10px", fontSize: 18 }}>Folgen</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "rgba(255,255,255,0.35)" }}>
            <div style={{ width: `${Math.min(100, t * 30).toFixed(1)}%`, height: "100%", background: "#fff" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Snap zoom                                                                                    */
/* ------------------------------------------------------------------------------------------ */

const Snap: React.FC<Ctx> = ({ t, cue, source }) => {
  const at = cue.at ?? 0;
  const s = ramp(t, at, at + 0.13, 1, 1.62, EASE_OUT_POW4);
  const blur = interpolate(t, [at, at + 0.06, at + 0.16], [0, 7, 0], clamp);
  return (
    <Layer transform={`scale(${s.toFixed(4)})`} origin={faceOf(cue)} style={{ filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
      <Cam src={source} />
    </Layer>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Studio reveal: dark studio, the lights switch on with the word                              */
/* ------------------------------------------------------------------------------------------ */

const Studio: React.FC<Ctx> = ({ t, cue, source, cutout }) => {
  const theme = useTheme();
  const at = cue.at ?? 0.6;
  const flicker = t < at ? 0 : t < at + 0.05 ? 1 : t < at + 0.11 ? 0.25 : ramp(t, at + 0.11, at + 0.3, 0.6, 1);
  const room = 0.14 + 0.86 * flicker;
  const person = 0.32 + 0.68 * flicker;
  const intro = ramp(t, 0, 0.3);
  const on = flicker > 0.5;
  return (
    <AbsoluteFill style={{ background: theme.ink }}>
      {cue.src ? (
        <Picture src={cue.src} style={{ filter: `brightness(${room.toFixed(3)})`, opacity: intro }} />
      ) : (
        <div style={{ ...FULL, background: `radial-gradient(80% 50% at 50% 40%, #3a3640 0%, ${theme.ink} 100%)`, filter: `brightness(${room.toFixed(3)})`, opacity: intro }} />
      )}
      {[220, 860].map((x) => (
        <div key={x} style={{ position: "absolute", left: x - 260, top: 430 - 260, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 65%)", opacity: flicker }} />
      ))}
      <div style={{ ...FULL, filter: `brightness(${person.toFixed(3)}) drop-shadow(0 0 ${(26 * flicker).toFixed(0)}px rgba(255,255,255,${(0.35 * flicker).toFixed(2)}))` }}>
        {cutout ? <Cam src={cutout} transparent /> : <Cam src={source} />}
      </div>
      <div
        style={{
          position: "absolute",
          left: 540 - 130,
          top: 345,
          width: 260,
          height: 74,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.font,
          fontWeight: 900,
          fontSize: 40,
          letterSpacing: "0.12em",
          color: on ? "#fff" : rgba(theme.accent, 0.45),
          background: on ? theme.accent : rgba(theme.accent, 0.12),
          border: `3px solid ${rgba(theme.accent, on ? 1 : 0.4)}`,
          boxShadow: on ? `0 0 46px ${rgba(theme.accent, 0.8)}` : "none",
          opacity: intro,
        }}
      >
        ON AIR
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Liquid glass: a refracting lens glides over the frame                                       */
/* ------------------------------------------------------------------------------------------ */

const LENS = 200;

const Liquid: React.FC<Ctx> = ({ t, d, cue, source }) => {
  const face = faceOf(cue);
  const p = interpolate(t, [0, d], [0, 1], { ...clamp, easing: EASE_OUT });
  const cx = face.x - 260 + 470 * p;
  const cy = face.y - 60 + 120 * Math.sin(p * Math.PI);
  const appear = ramp(t, 0, 0.3, 0, 1, EASE_SLAM);
  return (
    <AbsoluteFill>
      <Cam src={source} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="liquid-lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feImage href={staticFile("lens-map.png")} x="0" y="0" width={LENS * 2} height={LENS * 2} preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={150} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div style={{ position: "absolute", left: cx - LENS, top: cy - LENS, width: LENS * 2, height: LENS * 2, borderRadius: "50%", overflow: "hidden", scale: `${appear}`, boxShadow: "0 24px 60px rgba(10,10,12,0.3)" }}>
        <div style={{ position: "absolute", inset: 0, filter: "url(#liquid-lens)" }}>
          <Cam src={source} style={{ left: -(cx - LENS), top: -(cy - LENS), transformOrigin: `${cx}px ${cy}px`, scale: "1.32", filter: "saturate(1.15) brightness(1.05)" }} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.9), inset 0 0 26px rgba(255,255,255,0.55), inset 0 -30px 60px rgba(255,255,255,0.35), inset 0 30px 50px rgba(10,10,12,0.2)",
            background: "radial-gradient(60% 40% at 32% 22%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Zoom portal: a circle shows the live frame, then the camera flies into it                   */
/* ------------------------------------------------------------------------------------------ */

const PORTAL = { x: 290, y: 600, r: 150, inner: 0.42 };

const Portal: React.FC<Ctx> = ({ t, cue, source }) => {
  const theme = useTheme();
  const flyAt = cue.at ?? 1.0;
  const appear = ramp(t, 0, 0.3, 0, 1, EASE_SLAM);
  const p = ramp(t, flyAt, flyAt + 0.42, 0, 1, EASE_IN_POW4);
  const k = 1 + (1 / PORTAL.inner - 1) * p;
  const tx = (540 - PORTAL.x) * p;
  const ty = (960 - PORTAL.y) * p;
  const clipR = PORTAL.r * appear + (1400 - PORTAL.r) * p * p;
  const blur = interpolate(p, [0, 0.5, 1], [0, 10, 0], clamp);
  if (p >= 1) return <Cam src={source} />;
  return (
    <AbsoluteFill style={{ background: theme.ink }}>
      <Layer transform={`translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${k.toFixed(4)})`} origin={{ x: PORTAL.x, y: PORTAL.y }} style={{ filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
        <Cam src={source} />
        <div style={{ ...FULL, clipPath: `circle(${clipR.toFixed(1)}px at ${PORTAL.x}px ${PORTAL.y}px)` }}>
          <div style={{ ...FULL, background: theme.ink }} />
          <Cam src={source} style={{ transformOrigin: "540px 960px", transform: `translate(${PORTAL.x - 540}px, ${PORTAL.y - 960}px) scale(${PORTAL.inner})` }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: PORTAL.x - clipR,
            top: PORTAL.y - clipR,
            width: clipR * 2,
            height: clipR * 2,
            borderRadius: "50%",
            border: `8px solid ${theme.glow}`,
            boxShadow: `0 0 40px ${rgba(theme.glow, 0.8)}, inset 0 0 30px ${rgba(theme.glow, 0.6)}`,
            opacity: appear * (1 - p),
          }}
        />
      </Layer>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* B-roll overlay: an editing program slides up, your video plays in its preview window        */
/* ------------------------------------------------------------------------------------------ */

const HOLE = { left: 330, top: 360, width: 420, height: 747 };

const BRoll: React.FC<Ctx> = ({ t, d, cue, source }) => {
  const theme = useTheme();
  const rise = ramp(t, 0, 0.32, HEIGHT, 0, EASE_OUT_POW4);
  const fall = ramp(t, d - 0.25, d, 0, HEIGHT, EASE_IN_POW4);
  const at = cue.at ?? 1.0;
  const drop = ramp(t, at, at + 0.14, -90, 0, EASE_OUT_POW4);
  const dropped = t >= at;
  const flash = interpolate(t, [at + 0.12, at + 0.16, at + 0.4], [0, 1, 0], clamp);
  const timeline = { left: 139, top: 1160, width: 802, height: 230 };
  const head = timeline.left + 120 + ((t * 230) % (timeline.width - 140));
  const panel = "#f1ede6";
  const rule = "rgba(10,10,12,0.12)";
  return (
    <AbsoluteFill>
      <Cam src={source} />
      <div style={{ ...FULL, translate: `0px ${(rise + fall).toFixed(1)}px`, fontFamily: theme.font, color: theme.ink }}>
        <div style={{ ...FULL, background: `linear-gradient(160deg, ${theme.light} 0%, ${theme.sand} 100%)` }} />
        <div style={{ position: "absolute", left: 139, top: 345, display: "flex", gap: 10 }}>
          {[theme.accent, theme.gold, theme.success].map((c) => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 139, top: 380, fontSize: 34, fontWeight: 800 }}>Schnitt</div>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 139,
              top: 470 + i * 118,
              width: 171,
              height: 100,
              borderRadius: 14,
              background: i % 2 === 0 ? rgba(theme.deep, 0.18) : rgba(theme.gold, 0.35),
              border: `2px solid ${rule}`,
              opacity: ramp(t, 0.07 + i * 0.06, 0.3 + i * 0.06),
              translate: `0px ${((1 - ramp(t, 0.07 + i * 0.06, 0.3 + i * 0.06)) * 30).toFixed(1)}px`,
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 139, top: 1046, width: 171, height: 54, borderRadius: 12, background: theme.success, color: "#fff", fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>Export</div>
        <div style={{ position: "absolute", left: HOLE.left - 8, top: HOLE.top - 8, width: HOLE.width + 16, height: HOLE.height + 16, borderRadius: 22, background: theme.ink, boxShadow: `0 0 0 3px ${flash > 0 ? rgba(theme.accent, flash) : rule}` }} />
        <div style={{ position: "absolute", ...HOLE, overflow: "hidden", borderRadius: 18 }}>
          <Cam src={source} style={{ width: "100%", height: "100%" }} />
        </div>
        <div style={{ position: "absolute", ...timeline, borderRadius: 18, background: panel, border: `2px solid ${rule}` }} />
        {["V2", "V1"].map((track, i) => (
          <div key={track} style={{ position: "absolute", left: timeline.left + 20, top: timeline.top + 40 + i * 90, fontSize: 24, fontWeight: 800, opacity: 0.6 }}>
            {track}
          </div>
        ))}
        <div style={{ position: "absolute", left: timeline.left + 90, top: timeline.top + 120, width: 690, height: 64, borderRadius: 10, background: rgba(theme.deep, 0.75), color: "#fff", fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", paddingLeft: 18 }}>
          Sprechvideo
        </div>
        {dropped ? (
          <div style={{ position: "absolute", left: head - 120, top: timeline.top + 30 + drop, width: 260, height: 64, borderRadius: 10, background: theme.accent, color: "#fff", fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", paddingLeft: 18 }}>
            B-Roll
          </div>
        ) : null}
        <div style={{ position: "absolute", left: head, top: timeline.top + 12, width: 4, height: timeline.height - 24, background: theme.accent, borderRadius: 2 }} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Text behind you: a huge word between the room and you                                       */
/* ------------------------------------------------------------------------------------------ */

const TextHinter: React.FC<Ctx> = ({ t, cue, source, cutout }) => {
  const theme = useTheme();
  const at = cue.at ?? 0;
  const p = ramp(t, at, at + 0.3, 0, 1, EASE_SLAM);
  const drift = interpolate(t, [at, cue.to - cue.from], [1, 1.05], clamp);
  // From the word on, the empty room replaces the camera frame behind the cut-out: with fast
  // movement the blurred person of the camera frame must never show next to the cut-out.
  const onPlate = Boolean(cue.plate && cutout) && t >= at;
  const word = cue.word ?? "WOW";
  // 380 px fits four capitals; longer words shrink to the frame width (wide capitals take about 0.74 em).
  const fontSize = Math.min(380, Math.floor(980 / (word.length * 0.74)));
  return (
    <AbsoluteFill>
      {onPlate && cue.plate ? <Picture src={cue.plate} /> : <Cam src={source} />}
      {p > 0 ? (
        <div
          style={{
            position: "absolute",
            top: 520,
            left: 0,
            width: WIDTH,
            textAlign: "center",
            fontFamily: theme.font,
            fontWeight: 900,
            fontSize,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: theme.deep,
            opacity: p,
            scale: `${(1.25 - 0.25 * p) * drift}`,
            textShadow: "0 18px 40px rgba(10,10,12,0.25)",
          }}
        >
          {word}
        </div>
      ) : null}
      {cutout ? <Cam src={cutout} transparent /> : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Viewfinder with digital zoom                                                                */
/* ------------------------------------------------------------------------------------------ */

const Sucher: React.FC<Ctx> = ({ t, cue, source, seconds }) => {
  const theme = useTheme();
  const { fps } = useVideoConfig();
  const showAt = cue.at ?? 0.8;
  const zoomAt = showAt + 0.96;
  const show = ramp(t, showAt, showAt + 0.2);
  const z = ramp(t, zoomAt, zoomAt + 0.5, 1, 2, EASE_OUT);
  const corner = (style: CSSProperties) => (
    <div style={{ position: "absolute", width: 90, height: 90, borderColor: "#fff", borderStyle: "solid", borderWidth: 0, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))", ...style }} />
  );
  const blink = Math.floor(t * 2.5) % 2 === 0;
  const whole = Math.floor(seconds);
  const pad = (n: number) => String(n).padStart(2, "0");
  const timecode = `00:${pad(Math.floor(whole / 60))}:${pad(whole % 60)}:${pad(Math.floor((seconds - whole) * fps))}`;
  return (
    <AbsoluteFill>
      <Layer transform={`scale(${z.toFixed(4)})`} origin={faceOf(cue)}>
        <Cam src={source} />
      </Layer>
      <div style={{ ...FULL, opacity: show, fontFamily: theme.mono, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
        {corner({ left: 125, top: 340, borderTopWidth: 6, borderLeftWidth: 6 })}
        {corner({ left: 740, top: 340, borderTopWidth: 6, borderRightWidth: 6 })}
        {corner({ left: 125, top: 1050, borderBottomWidth: 6, borderLeftWidth: 6 })}
        {corner({ left: 740, top: 1050, borderBottomWidth: 6, borderRightWidth: 6 })}
        <div style={{ position: "absolute", left: 160, top: 370, display: "flex", alignItems: "center", gap: 12, fontSize: 32, fontWeight: 700 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: theme.accent, opacity: blink ? 1 : 0.25 }} />
          REC
        </div>
        <div style={{ position: "absolute", right: 260, top: 372, fontSize: 28 }}>{timecode}</div>
        <div style={{ position: "absolute", left: 540 - 70, top: 440, width: 140, textAlign: "center", fontSize: 32, fontWeight: 700, padding: "6px 0", borderRadius: 14, background: "rgba(10,10,12,0.45)" }}>
          {z.toFixed(1).replace(".", ",")}x
        </div>
        <svg width={WIDTH} height={HEIGHT} style={FULL}>
          <path d="M540 905v30M540 985v30M485 960h30M565 960h30" stroke="#fff" strokeWidth={3} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Frame escape: the video becomes a tilted card, the head climbs out over its top edge        */
/* ------------------------------------------------------------------------------------------ */

const Rahmen: React.FC<Ctx> = ({ t, cue, source, cutout, seconds }) => {
  const p = ramp(t, 0, 0.5, 0, 1, EASE_OUT_POW4);
  const climb = ramp(t, 0.35, 0.95, 0, 1, EASE_OUT);
  const face = faceOf(cue);
  // Centred and lifted, so captions at the bottom sit under the chin, not on the face.
  const transform = `translate(${((540 - face.x) * p).toFixed(1)}px, ${(-60 * p).toFixed(1)}px) rotate(${(-4 * p).toFixed(2)}deg) scale(${(1 - 0.36 * p).toFixed(4)})`;
  const cardTop = (face.y + 230) * climb;
  return (
    <AbsoluteFill>
      <Backdrop seconds={seconds} />
      <Layer transform={transform} origin={{ x: 540, y: 960 }}>
        <div
          style={{
            position: "absolute",
            left: -22,
            top: cardTop - 22,
            width: WIDTH + 44,
            height: HEIGHT - cardTop + 44,
            background: "#fff",
            borderRadius: 26,
            boxShadow: `0 40px 90px rgba(10,10,12,${(0.45 * p).toFixed(2)})`,
          }}
        />
        <div style={{ ...FULL, clipPath: `inset(${cardTop.toFixed(1)}px 0px 0px 0px)` }}>
          <Cam src={source} />
        </div>
        {cutout ? (
          // Overlap the camera frame by a few pixels: two edges on the same line leave an
          // anti-aliased seam through which the white card shows as a hairline.
          <div style={{ ...FULL, clipPath: `inset(0px 0px ${Math.max(0, HEIGHT - cardTop - 4).toFixed(1)}px 0px)` }}>
            <Cam src={cutout} transparent />
          </div>
        ) : null}
      </Layer>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Zoom-through cut                                                                            */
/* ------------------------------------------------------------------------------------------ */

const Zoomschnitt: React.FC<Ctx> = ({ t, cue, source }) => {
  const at = cue.at ?? 0.25;
  const inP = ramp(t, at, at + 0.22, 0, 1, EASE_IN_POW4);
  const outP = ramp(t, at + 0.22, at + 0.52, 0, 1, EASE_OUT_POW4);
  const crossed = t >= at + 0.22;
  const s = crossed ? 2.6 - 1.6 * outP : 1 + 1.6 * inP;
  const blur = crossed ? 24 * (1 - outP) : 24 * inP;
  const flash = interpolate(t, [at + 0.18, at + 0.22, at + 0.3], [0, 0.35, 0], clamp);
  return (
    <AbsoluteFill>
      <Layer transform={`scale(${s.toFixed(4)})`} origin={faceOf(cue)} style={{ filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
        <Cam src={source} />
      </Layer>
      <div style={{ ...FULL, background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Check pills pop up next to you                                                              */
/* ------------------------------------------------------------------------------------------ */

const Haekchen: React.FC<Ctx> = ({ t, cue, source }) => {
  const theme = useTheme();
  const at = cue.at ?? 0.5;
  const pills = (cue.lines?.length ? cue.lines : ["Geschnitten", "Untertitelt", "Effekte drin"]).slice(0, 4);
  // Stack ends just above the cap; never higher than y 340, below the header row.
  const top = Math.max(340, faceOf(cue).y - 420 - pills.length * 104);
  return (
    <AbsoluteFill>
      <Cam src={source} />
      {pills.map((label, i) => {
        const p = ramp(t, at + i * 0.35, at + i * 0.35 + 0.28, 0, 1, EASE_SLAM);
        return (
          <div
            key={`${i}-${label}`}
            style={{
              position: "absolute",
              left: 125,
              top: top + i * 104,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 24px 12px 14px",
              borderRadius: 999,
              background: "#fff",
              boxShadow: "0 12px 28px rgba(10,10,12,0.3)",
              fontFamily: theme.font,
              fontWeight: 700,
              fontSize: 38,
              color: theme.ink,
              scale: `${p}`,
              transformOrigin: "left center",
            }}
          >
            <Check size={44} done={ramp(t, at + i * 0.35 + 0.1, at + i * 0.35 + 0.3)} />
            {label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* Checklist: every effect of the video gets ticked off, a counter runs along                  */
/* ------------------------------------------------------------------------------------------ */

const Checkliste: React.FC<Ctx> = ({ t, d, cue, source, names }) => {
  const theme = useTheme();
  const items = names.length ? names : ["Geschnitten", "Untertitelt", "Effekte drin"];
  const rise = ramp(t, 0, 0.3, HEIGHT, 0, EASE_OUT_POW4);
  const start = 0.3;
  // Tick all rows within the first ~60 % of the window, at most 0.115 s apart.
  const step = Math.min(0.115, Math.max(0.04, (d * 0.6 - start) / items.length));
  const done = Math.max(0, Math.min(items.length, Math.floor((t - start) / step) + 1));
  const finalAt = start + items.length * step + 0.25;
  const half = Math.ceil(items.length / 2);
  const rowGap = Math.min(47, Math.floor(560 / half));
  return (
    <AbsoluteFill>
      <Cam src={source} />
      <div style={{ ...FULL, translate: `0px ${rise.toFixed(1)}px`, background: `linear-gradient(160deg, ${theme.light} 0%, ${theme.sand} 100%)`, fontFamily: theme.font, color: theme.ink }}>
        <div style={{ position: "absolute", left: 139, top: 346, display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 150, fontWeight: 900, color: theme.accent, lineHeight: 1 }}>{t < start ? 0 : done}</span>
          <span style={{ fontSize: 44, fontWeight: 700 }}>/ {items.length} Effekte</span>
        </div>
        {items.map((name, i) => {
          const tick = ramp(t, start + i * step, start + i * step + 0.12);
          const column = i < half ? 0 : 1;
          const row = column === 0 ? i : i - half;
          return (
            <div key={`${i}-${name}`} style={{ position: "absolute", left: column === 0 ? 139 : 482, top: 540 + row * rowGap, display: "flex", alignItems: "center", gap: 12, fontSize: 26, fontWeight: 600 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, border: `3px solid ${theme.accent}`, background: tick > 0.5 ? theme.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", scale: `${1 + 0.15 * Math.sin(tick * Math.PI)}` }}>
                <svg width={20} height={20} viewBox="0 0 24 24">
                  <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
                </svg>
              </div>
              {name}
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 139, top: 1080, display: "flex", alignItems: "center", gap: 14, fontSize: 44, fontWeight: 800, opacity: ramp(t, finalAt, finalAt + 0.2), scale: `${ramp(t, finalAt, finalAt + 0.25, 0.85, 1, EASE_SLAM)}`, transformOrigin: "left center" }}>
          <Spark size={48} color={theme.accent} />
          {cue.word ?? "Alle Effekte drin."}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------ */

const RENDERERS: Record<EffectKind, React.FC<Ctx>> = {
  vorschau: Vorschau,
  greenscreen: GreenScreen,
  magazin: Magazin,
  chat: Chat,
  kurve: Kurve,
  glas: Glas,
  orbit: Orbit,
  dolly: Dolly,
  papier: Papier,
  schlagzeilen: Schlagzeilen,
  handy: Handy,
  snap: Snap,
  studio: Studio,
  liquid: Liquid,
  portal: Portal,
  broll: BRoll,
  text: TextHinter,
  sucher: Sucher,
  rahmen: Rahmen,
  zoomschnitt: Zoomschnitt,
  haekchen: Haekchen,
  checkliste: Checkliste,
};

export const EffectLayer: React.FC<{ spec: EffectsSpec; seconds: number; source: string; cutout?: string }> = ({ spec, seconds, source, cutout }) => {
  const cue = spec.cues.find((entry) => seconds >= entry.from && seconds < entry.to);
  const numbered = spec.cues.filter((entry) => entry.nr > 0);
  const names = numbered.map((entry) => entry.name);
  const effect = cue
    ? (() => {
        const Effect = RENDERERS[cue.kind];
        return <Effect t={seconds - cue.from} d={cue.to - cue.from} cue={cue} seconds={seconds} source={source} cutout={cutout} names={names} />;
      })()
    : null;
  if (numbered.length === 0) return effect ? <AbsoluteFill>{effect}</AbsoluteFill> : null;
  const first = numbered[0];
  const last = numbered[numbered.length - 1];
  const headerOn = seconds >= first.from && seconds < last.to;
  // Gaps between cues keep the previous effect's header.
  const headerCue = [...numbered].reverse().find((entry) => entry.from <= seconds) ?? first;
  return (
    <>
      {effect ? <AbsoluteFill>{effect}</AbsoluteFill> : null}
      {headerOn ? (
        <EffectHeader
          cue={headerCue}
          t={seconds - headerCue.from}
          total={spec.total || numbered.length}
          enter={ramp(seconds, first.from, first.from + 0.3) * ramp(seconds, last.to - 0.25, last.to, 1, 0)}
        />
      ) : null}
    </>
  );
};
