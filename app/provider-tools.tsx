"use client";

import { useState } from "react";

type Result = Record<string, unknown> | null;

export default function ProviderTools() {
  const [username, setUsername] = useState("");
  const [credits, setCredits] = useState<Result>(null);
  const [lookup, setLookup] = useState<Result>(null);
  const [dns, setDns] = useState<Result>(null);
  const [busy, setBusy] = useState("");

  async function run(action: "credits" | "lookup" | "dns") {
    setBusy(action);
    if (action === "credits") setCredits(null);
    if (action === "lookup") setLookup(null);
    if (action === "dns") setDns(null);
    try {
      const response = action === "credits"
        ? await fetch("/api/provider/credits", { cache: "no-store" })
        : await fetch(action === "lookup" ? "/api/provider/locket-lookup" : "/api/provider/dns-lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.trim() }),
          });
      const data = await response.json().catch(() => ({ success: false, error: "Phản hồi máy chủ không hợp lệ." }));
      if (action === "credits") setCredits(data);
      if (action === "lookup") setLookup(data);
      if (action === "dns") setDns(data);
    } catch {
      const data = { success: false, error: "Không kết nối được BearGold. Vui lòng thử lại." };
      if (action === "credits") setCredits(data);
      if (action === "lookup") setLookup(data);
      if (action === "dns") setDns(data);
    } finally {
      setBusy("");
    }
  }

  const panel: React.CSSProperties = {
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 16,
    padding: 18,
    minWidth: 0,
  };
  const field: React.CSSProperties = {
    width: "100%",
    minWidth: 0,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(0,0,0,.22)",
    color: "inherit",
    margin: "10px 0",
  };
  const button: React.CSSProperties = {
    border: 0,
    borderRadius: 999,
    padding: "10px 16px",
    cursor: "pointer",
    color: "#111",
    background: "#d7bd78",
    fontWeight: 700,
    margin: "4px 6px 4px 0",
  };
  const output: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontSize: 12,
    lineHeight: 1.5,
    maxHeight: 220,
    overflow: "auto",
    padding: 12,
    borderRadius: 10,
    background: "rgba(0,0,0,.25)",
    marginTop: 12,
  };

  return (
    <section className="admin-section" aria-label="Công cụ nhà cung cấp">
      <div className="section-head">
        <h2>Kết nối nhà cung cấp</h2>
        <span>API xử lý phía máy chủ</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 14 }}>
        <article style={panel}>
          <strong>Số dư Uplocket Credits</strong>
          <p className="sub">Kiểm tra số dư tài khoản nhà cung cấp.</p>
          <button style={button} type="button" disabled={!!busy} onClick={() => run("credits")}>
            {busy === "credits" ? "Đang kiểm tra…" : "Kiểm tra Credits"}
          </button>
          {credits && <pre style={output}>{JSON.stringify(credits, null, 2)}</pre>}
        </article>
        <article style={panel}>
          <strong>Tra cứu tài khoản Locket</strong>
          <p className="sub">Nhập username hoặc link cá nhân Locket.</p>
          <input style={field} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username hoặc link Locket" aria-label="Username hoặc link Locket" />
          <button style={button} type="button" disabled={!!busy || !username.trim()} onClick={() => run("lookup")}>
            {busy === "lookup" ? "Đang tra cứu…" : "Tra cứu Locket"}
          </button>
          {lookup && <pre style={output}>{JSON.stringify(lookup, null, 2)}</pre>}
        </article>
        <article style={panel}>
          <strong>Tra cứu hồ sơ DNS</strong>
          <p className="sub">Kiểm tra hồ sơ DNS theo username.</p>
          <input style={field} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username Locket" aria-label="Username Locket để tra cứu DNS" />
          <button style={button} type="button" disabled={!!busy || !username.trim()} onClick={() => run("dns")}>
            {busy === "dns" ? "Đang tra cứu…" : "Tra cứu DNS"}
          </button>
          {dns && <pre style={output}>{JSON.stringify(dns, null, 2)}</pre>}
        </article>
      </div>
      <p className="admin-notice">Các công cụ này chỉ tra cứu dữ liệu. Không xuất, gia hạn, bật/tắt DNS hoặc trừ Credits.</p>
    </section>
  );
}
