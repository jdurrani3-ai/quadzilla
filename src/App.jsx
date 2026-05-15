import { useState, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════ */
function extractYouTubeId(input) {
  if (!input) return null;
  const t = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(t)) return t;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractKickChannel(input) {
  if (!input) return null;
  const t = input.trim();
  const m = t.match(/kick\.com\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]+$/.test(t) && !t.includes(".")) return t;
  return null;
}

function buildYTEmbed(id, muted) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&rel=0&modestbranding=1`;
}

function buildKickEmbed(channel, muted) {
  return `https://player.kick.com/${channel}?autoplay=true&muted=${muted}`;
}

/* ═══════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════ */
const PlayIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const MuteIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);
const UnmuteIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);
const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);
const LinkIcon = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
  </svg>
);

/* ═══════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════ */
const PANEL_CFG = [
  { id: 1, type: "youtube",  label: "YOUTUBE",      color: "#FF4444", hint: "paste youtube url · press enter" },
  { id: 2, type: "kick",     label: "KICK.COM",     color: "#53FC18", hint: "paste kick.com url · press enter" },
  { id: 3, type: "direct",   label: "DIRECT URL",   color: "#4DFFB4", hint: "paste .mp4 or .m3u8 url · press enter" },
  { id: 4, type: "launcher", label: "LAUNCHER",     color: "#E8FF00", hint: "or paste any stream url · enter" },
];

const APPS = [
  { name: "NETFLIX",    url: "nflx://",     fallback: "https://www.netflix.com",            color: "#E50914" },
  { name: "PRIME",      url: "aiv://",      fallback: "https://www.amazon.com/prime-video", color: "#00A8E0" },
  { name: "HULU",       url: "hulu://",     fallback: "https://www.hulu.com",               color: "#1CE783" },
  { name: "PARAM+",     url: "pplus://",    fallback: "https://www.paramountplus.com",      color: "#0064FF" },
  { name: "PEACOCK",    url: "peacock://",  fallback: "https://www.peacocktv.com",          color: "#FA4616" },
  { name: "SLING FREE", url: "slingtv://",  fallback: "https://watch.sling.com",            color: "#FF7A00" },
];

const LAYOUTS = {
  "2×2":   {
    grid: { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" },
    visible: [1, 2, 3, 4],
    style: () => ({}),
  },
  "DUAL":  {
    grid: { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" },
    visible: [1, 2],
    style: () => ({}),
  },
  "FOCUS": {
    grid: { gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr 1fr" },
    visible: [1, 2, 3, 4],
    style: (id) => id === 1 ? { gridRow: "1 / 4", gridColumn: "1" } : {},
  },
  "CINEMA":{
    grid: { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" },
    visible: [1],
    style: () => ({}),
  },
};

/* ═══════════════════════════════════════════════════
   PANEL
═══════════════════════════════════════════════════ */
function Panel({ panelId, data, onUpdate, extraStyle }) {
  const cfg = PANEL_CFG[panelId - 1];
  const [input, setInput]   = useState("");
  const [error, setError]   = useState(false);
  const [hov,   setHov]     = useState(null);
  const isLauncher = cfg.type === "launcher" && !data.overrideMode;
  const hasStream  = !!data.src;

  const load = () => {
    const val = input.trim();
    if (!val) return;

    if (cfg.type === "youtube") {
      const id = extractYouTubeId(val);
      if (id) { setError(false); setInput(""); onUpdate(panelId, { type: "youtube", src: buildYTEmbed(id, true), videoId: id, muted: true }); }
      else setError(true);
    }
    else if (cfg.type === "kick") {
      const ch = extractKickChannel(val);
      if (ch) { setError(false); setInput(""); onUpdate(panelId, { type: "kick", src: buildKickEmbed(ch, true), channel: ch, muted: true }); }
      else setError(true);
    }
    else if (cfg.type === "direct" || cfg.type === "launcher") {
      if (val.startsWith("http")) {
        setError(false); setInput("");
        const isVid = /\.(mp4|webm|ogg)(\?.*)?$/i.test(val);
        onUpdate(panelId, { type: isVid ? "video" : "iframe", src: val, muted: true, overrideMode: cfg.type === "launcher" });
      } else setError(true);
    }
  };

  const toggleMute = () => {
    if (!data.src) return;
    const muted = !data.muted;
    let src = data.src;
    if (data.type === "youtube" && data.videoId) src = buildYTEmbed(data.videoId, muted);
    if (data.type === "kick"    && data.channel)  src = buildKickEmbed(data.channel, muted);
    onUpdate(panelId, { ...data, muted, src });
  };

  const clear = () => { setInput(""); onUpdate(panelId, { type: null, src: null, muted: true }); };

  const btnBase = {
    width: "22px", height: "20px",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0, transition: "all 0.12s",
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: "#09090D",
      border: `1px solid ${hasStream ? cfg.color + "28" : "#111118"}`,
      overflow: "hidden", transition: "border-color 0.3s",
      ...extraStyle,
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "0 8px", height: "32px",
        background: "#06060A",
        borderBottom: `1px solid ${hasStream ? cfg.color + "18" : "#0E0E14"}`,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: "14px",
          color: hasStream ? cfg.color : "#1A1A22",
          letterSpacing: "1px", minWidth: "18px", lineHeight: 1,
          transition: "color 0.3s",
        }}>
          {String(panelId).padStart(2, "0")}
        </span>

        {hasStream && (
          <div style={{
            width: "5px", height: "5px", borderRadius: "50%",
            background: cfg.color, boxShadow: `0 0 6px ${cfg.color}`,
            animation: "qzPulse 2s ease-in-out infinite", flexShrink: 0,
          }} />
        )}

        <div style={{ width: "1px", height: "12px", background: "#141418", flexShrink: 0 }} />

        {!isLauncher ? (
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && load()}
            placeholder={hasStream ? "— active —" : cfg.hint}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: error ? "#FF4D6D" : "#383848",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9.5px", minWidth: 0,
            }}
          />
        ) : (
          <span style={{ flex: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#1A1A28" }}>
            {cfg.hint}
          </span>
        )}

        {!hasStream && (
          <button onClick={load} onMouseEnter={() => setHov("load")} onMouseLeave={() => setHov(null)}
            style={{
              ...btnBase,
              background: hov === "load" ? cfg.color : "transparent",
              border: `1px solid ${cfg.color}`,
              color: hov === "load" ? "#06060A" : cfg.color,
            }}>
            <PlayIcon />
          </button>
        )}

        {hasStream && (
          <>
            {(data.type === "youtube" || data.type === "kick" || data.type === "video") && (
              <button onClick={toggleMute} onMouseEnter={() => setHov("mute")} onMouseLeave={() => setHov(null)}
                style={{
                  ...btnBase,
                  background: "transparent",
                  border: "1px solid",
                  borderColor: data.muted ? "#1C1C28" : "#4DFFB4",
                  color: data.muted ? "#2E2E3E" : "#4DFFB4",
                }}>
                {data.muted ? <MuteIcon /> : <UnmuteIcon />}
              </button>
            )}
            <button onClick={clear} onMouseEnter={() => setHov("close")} onMouseLeave={() => setHov(null)}
              style={{
                ...btnBase,
                background: "transparent",
                border: "1px solid",
                borderColor: hov === "close" ? "#FF4D6D" : "#1C1C28",
                color: hov === "close" ? "#FF4D6D" : "#2E2E3E",
              }}>
              <CloseIcon />
            </button>
          </>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>

        {/* YouTube */}
        {hasStream && data.type === "youtube" && (
          <iframe key={`yt-${data.videoId}-${data.muted}`} src={data.src}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen />
        )}

        {/* Kick */}
        {hasStream && data.type === "kick" && (
          <iframe key={`kick-${data.channel}-${data.muted}`} src={data.src}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        )}

        {/* Direct video */}
        {hasStream && data.type === "video" && (
          <video key={`vid-${data.src}`} src={data.src} autoPlay controls muted={data.muted}
            style={{ width: "100%", height: "100%", display: "block", background: "#000" }} />
        )}

        {/* Iframe (direct url / launcher override) */}
        {hasStream && data.type === "iframe" && (
          <iframe key={`url-${data.src}`} src={data.src}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        )}

        {/* App Launcher grid */}
        {!hasStream && cfg.type === "launcher" && (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", flexDirection: "column",
            padding: "6px",
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "7px",
              color: "#141420", letterSpacing: "2px", textAlign: "center",
              marginBottom: "5px", paddingBottom: "4px",
              borderBottom: "1px solid #0E0E14",
            }}>
              TAP TO OPEN · UNIVERSAL LINKS
            </div>
            <div style={{
              flex: 1, display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: "4px",
            }}>
              {APPS.map(app => (
                <a key={app.name} href={app.url}
                  style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "4px", padding: "4px",
                    background: `${app.color}0A`,
                    border: `1px solid ${app.color}22`,
                    textDecoration: "none", cursor: "pointer",
                    transition: "all 0.15s",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${app.color}1A`; e.currentTarget.style.borderColor = `${app.color}44`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${app.color}0A`; e.currentTarget.style.borderColor = `${app.color}22`; }}
                >
                  <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: app.color, opacity: 0.7, flexShrink: 0 }} />
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: "6.5px",
                    color: `${app.color}CC`, letterSpacing: "0.3px",
                    textAlign: "center", lineHeight: 1.3,
                  }}>{app.name}</span>
                  <LinkIcon style={{ color: `${app.color}55` }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state — panels 1-3 */}
        {!hasStream && cfg.type !== "launcher" && (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "5px",
            background: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.006) 3px, rgba(255,255,255,0.006) 4px)",
          }}>
            <span style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: "clamp(48px, 9vw, 80px)",
              color: "#0D0D14", lineHeight: 1, userSelect: "none",
            }}>
              {String(panelId).padStart(2, "0")}
            </span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "8px", color: "#111118",
              letterSpacing: "5px", userSelect: "none",
            }}>
              NO SIGNAL
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   APP
═══════════════════════════════════════════════════ */
export default function App() {
  const [panels, setPanels] = useState({
    1: { type: null, src: null, muted: true },
    2: { type: null, src: null, muted: true },
    3: { type: null, src: null, muted: true },
    4: { type: null, src: null, muted: true },
  });
  const [layout,      setLayout]      = useState("2×2");
  const [layoutHover, setLayoutHover] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;500&family=Outfit:wght@300;400;500&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.id = "qz-styles";
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; overflow: hidden; background: #06060A; }
      input::placeholder { color: #1A1A26 !important; }
      a { -webkit-tap-highlight-color: transparent; }
      @keyframes qzPulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--c); }
        50%       { opacity: 0.3; box-shadow: 0 0 2px var(--c); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      const s = document.getElementById("qz-styles");
      if (s) document.head.removeChild(s);
    };
  }, []);

  const updatePanel = useCallback((id, data) => {
    setPanels(prev => ({ ...prev, [id]: data }));
  }, []);

  const cfg       = LAYOUTS[layout];
  const liveCount = Object.values(panels).filter(p => p.src).length;

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "#06060A",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Outfit', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        height: "42px", flexShrink: 0,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        background: "#040407",
        borderBottom: "1px solid #0D0D14",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: "#E8FF00",
            boxShadow: "0 0 8px #E8FF00, 0 0 18px rgba(232,255,0,0.2)",
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: "22px", color: "#E8FF00",
            letterSpacing: "9px", lineHeight: 1,
          }}>
            QUADZILLA
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "8px", color: "#131320", letterSpacing: "3px",
          }}>
            MULTI·STREAM
          </span>
          {liveCount > 0 && (
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "8px", color: "#4DFFB4", letterSpacing: "2px",
              background: "rgba(77,255,180,0.05)",
              border: "1px solid rgba(77,255,180,0.12)",
              padding: "2px 8px",
            }}>
              {liveCount} / 4 ACTIVE
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "8px", color: "#111120",
            letterSpacing: "3px", marginRight: "6px",
          }}>
            LAYOUT
          </span>
          {Object.keys(LAYOUTS).map(l => {
            const active = layout === l;
            const hov    = layoutHover === l;
            return (
              <button key={l}
                onClick={() => setLayout(l)}
                onMouseEnter={() => setLayoutHover(l)}
                onMouseLeave={() => setLayoutHover(null)}
                style={{
                  background:   active ? "#E8FF00" : hov ? "rgba(232,255,0,0.06)" : "transparent",
                  color:        active ? "#04040A" : hov ? "#E8FF00" : "#1E1E2E",
                  border:       "1px solid",
                  borderColor:  active ? "#E8FF00" : hov ? "rgba(232,255,0,0.25)" : "#0E0E18",
                  padding:      "3px 11px",
                  fontFamily:   "'IBM Plex Mono', monospace",
                  fontSize:     "9px", cursor: "pointer",
                  letterSpacing:"0.5px", fontWeight: "500",
                  transition:   "all 0.15s", lineHeight: "1.6",
                }}>
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel Grid ── */}
      <div style={{
        flex: 1, display: "grid",
        gap: "2px", padding: "2px",
        overflow: "hidden",
        ...cfg.grid,
      }}>
        {cfg.visible.map(id => (
          <Panel
            key={id}
            panelId={id}
            data={panels[id]}
            onUpdate={updatePanel}
            extraStyle={cfg.style(id)}
          />
        ))}
      </div>
    </div>
  );
}
