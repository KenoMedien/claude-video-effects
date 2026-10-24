import { useMemo } from "react";
import { type Caption, createTikTokStyleCaptions } from "@remotion/captions";
import { WIDTH, useTheme } from "./effects/theme";

/** Word-by-word captions under the chin: short groups of words, the spoken word in the accent colour. */
export const Captions: React.FC<{ captions: Caption[]; seconds: number; top: number }> = ({ captions, seconds, top }) => {
  const theme = useTheme();
  const { pages } = useMemo(() => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: 900 }), [captions]);
  const ms = seconds * 1000;
  const page = pages.find((entry) => ms >= entry.startMs && ms < entry.startMs + entry.durationMs);
  if (!page) return null;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 90,
        width: WIDTH - 180,
        textAlign: "center",
        fontFamily: theme.font,
        fontWeight: 800,
        fontSize: 64,
        lineHeight: 1.15,
        color: "#fff",
        WebkitTextStroke: `10px ${theme.ink}`,
        paintOrder: "stroke fill",
        whiteSpace: "pre-wrap",
      }}
    >
      {page.tokens.map((token) => (
        <span key={token.fromMs} style={{ color: ms >= token.fromMs && ms < token.toMs ? theme.accent : "#fff" }}>
          {token.text}
        </span>
      ))}
    </div>
  );
};
