import { AbsoluteFill } from "remotion";
import { rgba, useTheme } from "./theme";

/** Light, slowly moving background behind effects that shrink the video (chat, phone, frame escape). */
export const Backdrop: React.FC<{ seconds: number }> = ({ seconds: s }) => {
  const theme = useTheme();
  const sweep = (s % 12) / 12;
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(150deg, ${theme.light} 0%, ${theme.sand} 100%)` }} />
      <AbsoluteFill
        style={{
          background:
            `radial-gradient(60% 40% at ${70 - 20 * Math.cos(s * 0.14)}% ${20 + 12 * Math.sin(s * 0.17)}%, ` +
            `${rgba(theme.gold, 0.24)} 0%, ${rgba(theme.gold, 0)} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            `radial-gradient(55% 38% at ${25 + 16 * Math.sin(s * 0.11)}% 82%, ` +
            `${rgba(theme.deep, 0.1)} 0%, ${rgba(theme.deep, 0)} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "220%",
          height: "24%",
          left: "-60%",
          top: `${(110 - sweep * 140).toFixed(1)}%`,
          transform: "rotate(-16deg)",
          background: `linear-gradient(180deg, transparent, ${rgba(theme.paper, 0.35)}, transparent)`,
        }}
      />
    </>
  );
};
