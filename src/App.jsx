import { useState, useEffect, useRef } from "react";

const genId = () => Math.random().toString(36).substr(2, 9);
const STORAGE_KEY = "notepad-todo-v1";

const newItem = () => ({ id: genId(), text: "", done: false, createdAt: null });

const formatStamp = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${month} ${day}, ${time}`;
};

export default function App() {
  const [items, setItems] = useState([newItem()]);
  const [loaded, setLoaded] = useState(false);
  const inputRefs = useRef({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length > 0) setItems(saved);
    } catch (_) {}
    setLoaded(true);
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }, [items, loaded]);

  // Auto-focus first active item on load
  useEffect(() => {
    if (!loaded) return;
    const first = items.find(i => !i.done);
    if (first) {
      setTimeout(() => {
        const el = inputRefs.current[first.id];
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }, 100);
    }
  }, [loaded]);

  const activeItems = items.filter(i => !i.done);
  const doneItems = items.filter(i => i.done);

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const created = newItem();
      setItems(prev => {
        const idx = prev.findIndex(i => i.id === id);
        const next = [...prev];
        next.splice(idx + 1, 0, created);
        return next;
      });
      setTimeout(() => inputRefs.current[created.id]?.focus(), 0);
    } else if (e.key === "Backspace") {
      const item = items.find(i => i.id === id);
      if (item?.text === "" && activeItems.length > 1) {
        e.preventDefault();
        const idx = activeItems.findIndex(i => i.id === id);
        const prev = activeItems[Math.max(0, idx - 1)];
        setItems(p => p.filter(i => i.id !== id));
        setTimeout(() => {
          const el = inputRefs.current[prev?.id];
          if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
        }, 0);
      }
    }
  };

  const handleChange = (id, value) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const createdAt = i.createdAt || (value.length > 0 ? Date.now() : null);
      return { ...i, text: value, createdAt };
    }));
  };

  const toggleDone = (id) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, done: !i.done } : i);
      if (updated.filter(i => !i.done).length === 0)
        return [...updated, newItem()];
      return updated;
    });
  };

  const clearDone = () => {
    setItems(prev => {
      const remaining = prev.filter(i => !i.done);
      return remaining.length === 0 ? [newItem()] : remaining;
    });
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          min-height: 100vh;
          background: #b0a090;
          background-image:
            radial-gradient(ellipse at top left, #c8b89a, transparent 60%),
            radial-gradient(ellipse at bottom right, #8a7a6a, transparent 60%);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 16px 80px;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
        }

        .pad-wrap {
          width: 100%;
          max-width: 440px;
          position: relative;
        }

        .page-stack {
          position: absolute;
          bottom: -6px; left: 4px; right: -4px;
          height: 100%;
          background: #FFF9C4;
          border-radius: 0 0 3px 3px;
          z-index: 0;
        }
        .page-stack-2 {
          position: absolute;
          bottom: -10px; left: 8px; right: -8px;
          height: 100%;
          background: #FFF5A0;
          border-radius: 0 0 3px 3px;
          z-index: -1;
        }

        .notepad {
          position: relative;
          z-index: 1;
          background: #FFF59D;
          box-shadow:
            0 1px 0 #e8d84a,
            0 2px 0 #d4c230,
            0 4px 12px rgba(0,0,0,0.2),
            0 12px 32px rgba(0,0,0,0.15);
          border-radius: 2px 2px 4px 4px;
        }

        .binding {
          background: linear-gradient(180deg, #2a1f0e 0%, #3d2d14 60%, #2a1f0e 100%);
          padding: 10px 16px;
          border-radius: 2px 2px 0 0;
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }
        .binding::before {
          content: '';
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            90deg, transparent, transparent 18px,
            rgba(255,255,255,0.04) 18px, rgba(255,255,255,0.04) 19px
          );
        }
        .perf-line {
          position: absolute;
          bottom: -1px; left: 0; right: 0;
          height: 3px;
          background: repeating-linear-gradient(
            90deg, #FFF59D 0px, #FFF59D 6px,
            #2a1f0e 6px, #2a1f0e 8px
          );
        }
        .brand-label {
          font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase; letter-spacing: 3px;
          flex: 1;
        }
        .header-date {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.5px;
        }

        .paper {
          position: relative;
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0px, transparent 43px,
            rgba(30, 100, 200, 0.16) 43px, rgba(30, 100, 200, 0.16) 44px
          );
          min-height: 520px;
        }
        .paper::before {
          content: '';
          position: absolute;
          left: 60px; top: 0; bottom: 0;
          width: 1.5px;
          background: rgba(220, 50, 50, 0.38);
          pointer-events: none;
          z-index: 1;
        }

        .todo-item {
          display: flex;
          align-items: center;
          min-height: 44px;
          padding: 5px 14px;
          position: relative;
        }

        .circle-btn {
          width: 19px; height: 19px;
          border-radius: 50%;
          border: 1.5px solid rgba(30, 100, 200, 0.4);
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
          margin-right: 10px;
          margin-left: 5px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: none;
          position: relative;
          z-index: 2;
          align-self: flex-start;
          margin-top: 4px;
        }
        .circle-btn:hover {
          border-color: rgba(30, 100, 200, 0.7);
          background: rgba(30, 100, 200, 0.07);
          transform: scale(1.1);
        }
        .circle-btn.done {
          background: rgba(30, 100, 200, 0.7);
          border-color: rgba(30, 100, 200, 0.7);
        }
        .circle-btn.done::after {
          content: '';
          display: block;
          width: 4px; height: 8px;
          border: 1.5px solid white;
          border-top: none; border-left: none;
          transform: rotate(45deg) translate(-1px, -1px);
        }

        .item-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          position: relative;
          z-index: 2;
        }

        .item-input {
          border: none;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #1a1200;
          outline: none;
          padding: 0;
          width: 100%;
          caret-color: #1a6ae0;
          line-height: 1.3;
        }
        .item-input::placeholder { color: rgba(26, 18, 0, 0.22); }

        .item-text-done {
          font-size: 16px;
          font-weight: 400;
          color: rgba(26, 18, 0, 0.35);
          text-decoration: line-through;
          text-decoration-color: rgba(200, 50, 50, 0.5);
          text-decoration-thickness: 1.5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .item-stamp {
          font-size: 10.5px;
          color: rgba(26, 18, 0, 0.3);
          margin-top: 1px;
          line-height: 1;
        }
        .item-stamp.faded { color: rgba(26, 18, 0, 0.18); }

        .divider-row {
          display: flex;
          align-items: center;
          padding: 4px 14px 4px 63px;
          gap: 10px;
          min-height: 32px;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(220, 50, 50, 0.25); }
        .divider-text {
          font-size: 10px;
          color: rgba(220, 50, 50, 0.48);
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
        }

        .footer {
          border-top: 1px solid rgba(30, 100, 200, 0.14);
          padding: 10px 16px 14px 63px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-count { font-size: 12px; color: rgba(26, 18, 0, 0.35); }
        .clear-btn {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 13px; font-weight: 600;
          color: rgba(210, 50, 50, 0.8);
          background: none;
          border: 1.5px solid rgba(210, 50, 50, 0.28);
          border-radius: 20px;
          padding: 4px 14px;
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
        }
        .clear-btn:hover { background: rgba(210,50,50,0.07); border-color: rgba(210,50,50,0.55); }
        .clear-btn:disabled { opacity: 0.28; cursor: default; }
      `}</style>

      <div className="pad-wrap">
        <div className="page-stack-2" />
        <div className="page-stack" />

        <div className="notepad">
          <div className="binding">
            <span className="brand-label">✎ My Notes</span>
            <span className="header-date">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <div className="perf-line" />
          </div>

          <div className="paper">
            {activeItems.map((item, idx) => (
              <div key={item.id} className="todo-item">
                <button className="circle-btn" onClick={() => toggleDone(item.id)} tabIndex={-1} />
                <div className="item-body">
                  <input
                    ref={el => { if (el) inputRefs.current[item.id] = el; }}
                    className="item-input"
                    type="text"
                    value={item.text}
                    placeholder={idx === 0 ? "Start typing..." : ""}
                    onChange={e => handleChange(item.id, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, item.id)}
                    spellCheck={false}
                  />
                  {item.createdAt && (
                    <span className="item-stamp">{formatStamp(item.createdAt)}</span>
                  )}
                </div>
              </div>
            ))}

            {doneItems.length > 0 && (
              <>
                <div className="divider-row">
                  <div className="divider-line" />
                  <span className="divider-text">Done</span>
                  <div className="divider-line" />
                </div>
                {doneItems.map(item => (
                  <div key={item.id} className="todo-item">
                    <button className="circle-btn done" onClick={() => toggleDone(item.id)} tabIndex={-1} />
                    <div className="item-body">
                      <span className="item-text-done">{item.text || "(empty)"}</span>
                      {item.createdAt && (
                        <span className="item-stamp faded">{formatStamp(item.createdAt)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="footer">
            <span className="footer-count">
              {activeItems.filter(i => i.text).length} active
              {doneItems.length > 0 ? ` · ${doneItems.length} done` : ""}
            </span>
            <button className="clear-btn" onClick={clearDone} disabled={doneItems.length === 0}>
              Clear Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
