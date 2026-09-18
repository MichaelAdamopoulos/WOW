export const C = {
  bg: "#14171A",
  surface: "#1C2023",
  surfaceAlt: "#20262A",
  paper: "#EDE6D6",
  ink: "#1C2023",
  textPrimary: "#F4F1EA",
  textMuted: "#8A9199",
  green: "#7FD99A",
  red: "#FF7A68",
  amber: "#F2C14E",
  border: "rgba(244,241,234,0.1)",
};

export const AVATAR_COLORS = ["#7FD99A", "#F2C14E", "#FF7A68", "#6FB8E0", "#C792EA", "#F29E4C", "#6FE0C6"];

export const fmt = (n) => {
  const v = Math.abs(n) < 0.005 ? 0 : n;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2);
};

export const inputStyle = {
  width: "100%",
  background: C.surfaceAlt,
  border: `1px solid ${C.border}`,
  borderRadius: "10px",
  padding: "10px 12px",
  color: C.textPrimary,
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle = { fontSize: "12px", color: C.textMuted, marginBottom: "6px", fontWeight: 500 };

export const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    * { box-sizing: border-box; }
    body { margin: 0; background: ${C.bg}; }
    .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
    .display { font-family: 'Space Grotesk', sans-serif; }
    input, select { font-family: inherit; }
    button { font-family: inherit; cursor: pointer; }
  `}</style>
);
