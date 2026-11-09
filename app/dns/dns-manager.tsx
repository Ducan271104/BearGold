"use client";

import { useCallback, useEffect, useState } from "react";

type Profile = { username?: string; uid?: string; name?: string; avatar?: string };
type Activation = { id: number; activationCode?: string; locketUsername?: string; username?: string; packageName?: string; status?: string; isDnsActive?: boolean; expiresAt?: string | null; createdAt?: string; installUrl?: string; downloadUrl?: string; enrollUrl?: string; url?: string };
type LookupResult = { success?: boolean; error?: string; profile?: Profile; provisional?: boolean };

function dateLabel(value?: string | null) {
  if (!value) return "Không thời hạn / chưa rõ";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });
}

export default function DnsManager() {
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyMessage, setKeyMessage] = useState("");
  const [username, setUsername] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [packageName, setPackageName] = useState("Locket Gold");
  const [videoMode, setVideoMode] = useState("15s");
  const [memberSinceDate, setMemberSinceDate] = useState("classic");
  const [customMemberDate, setCustomMemberDate] = useState("");
  const [exportResult, setExportResult] = useState<{ code?: string; url?: string } | null>(null);
  const [busyAction, setBusyAction] = useState("");
  const [notice, setNotice] = useState("");

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(path, { ...init, cache: "no-store", headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || "Yêu cầu không thành công.");
    return data;
  }, []);

  const refreshData = useCallback(async () => {
    setListBusy(true); setListError("");
    try {
      const [balance, list] = await Promise.all([api("/api/dns/credits"), api("/api/dns/activations?limit=100")]);
      setCredits(Number(balance.balance ?? balance.credits ?? balance.data?.balance ?? 0));
      const rows = Array.isArray(list) ? list : list.activations ?? list.profiles ?? list.data?.activations ?? list.data?.profiles ?? [];
      setActivations(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Không tải được dữ liệu DNS.");
    } finally { setListBusy(false); }
  }, [api]);

  useEffect(() => {
    api("/api/dns/key").then((data) => setConfigured(Boolean(data.configured))).catch((error) => setKeyMessage(error.message));
  }, [api]);

  useEffect(() => { if (configured) void refreshData(); }, [configured, refreshData]);

  async function saveKey(event: React.FormEvent) {
    event.preventDefault(); setKeyBusy(true); setKeyMessage("");
    try {
      await api("/api/dns/key", { method: "POST", body: JSON.stringify({ apiKey }) });
      setConfigured(true); setApiKey(""); setKeyMessage("Đã lưu API key an toàn cho tài khoản CTV này."); setNotice("");
    } catch (error) { setKeyMessage(error instanceof Error ? error.message : "Không thể lưu API key."); }
    finally { setKeyBusy(false); }
  }

  async function lookupLocket(event: React.FormEvent) {
    event.preventDefault(); setLookupBusy(true); setLookup(null); setLookupError("");
    try {
      const data = await api("/api/dns/dns/lookup", { method: "POST", body: JSON.stringify({ username: username.trim() }) });
      if (!data.success) throw new Error(data.error || "Không tìm thấy tài khoản.");
      setLookup(data);
    } catch (error) { setLookupError(error instanceof Error ? error.message : "Tra cứu thất bại."); }
    finally { setLookupBusy(false); }
  }

  async function exportProfile(event: React.FormEvent) {
    event.preventDefault(); setBusyAction("export"); setNotice("");
    try {
      const data = await api("/api/dns/dns/export", { method: "POST", body: JSON.stringify({ username: username.trim(), durationDays: Number(durationDays), packageName, videoMode, memberSinceDate: memberSinceDate === "custom" ? customMemberDate : memberSinceDate }) });
      const installUrl = data.installUrl || data.downloadUrl || data.enrollUrl || data.url;
      setExportResult({ code: data.activationCode, url: installUrl });
      setNotice("Tạo hoặc cập nhật hồ sơ thành công.");
      await refreshData();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể tạo hồ sơ."); }
    finally { setBusyAction(""); }
  }

  async function activationAction(item: Activation, action: "renew" | "toggle") {
    setBusyAction(action + item.id); setNotice("");
    try {
      const body = action === "renew" ? JSON.stringify({ durationDays: Number(durationDays) }) : undefined;
      const data = await api(`/api/dns/dns/activations/${item.id}/${action}`, { method: "POST", ...(body ? { body } : {}) });
      setNotice(action === "renew" ? "Đã gửi yêu cầu gia hạn thành công." : (data.isDnsActive ? "DNS đã bật." : "DNS đã tắt."));
      await refreshData();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Thao tác thất bại."); }
    finally { setBusyAction(""); }
  }

  return <div className="dns-content">
    <section className="dns-panel">
      <div className="section-head"><h2>Kết nối Uplocket</h2><span>{configured ? "Đã cấu hình" : "Cần cấu hình"}</span></div>
      <p className="dns-help">Mỗi CTV sử dụng API key riêng. Key được mã hóa khi lưu và chỉ dùng ở máy chủ; không hiển thị lại sau khi lưu.</p>
      <form className="dns-key-form" onSubmit={saveKey}>
        <input type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={configured ? "Nhập key mới nếu muốn thay đổi" : "Dán API key Uplocket của bạn"} minLength={12} maxLength={512} />
        <button className="pill" disabled={keyBusy || apiKey.trim().length < 12}>{keyBusy ? "Đang lưu…" : configured ? "Cập nhật key" : "Lưu API key"}</button>
      </form>
      {keyMessage && <p className="dns-message" role="status">{keyMessage}</p>}
      <div className="dns-balance"><span>Số dư Uplocket</span><strong>{credits === null ? "—" : credits.toLocaleString("vi-VN")} Credits</strong><button type="button" className="pill" onClick={() => void refreshData()} disabled={!configured || listBusy}>Làm mới</button></div>
    </section>

    <section className="dns-panel">
      <div className="section-head"><h2>Tra cứu Locket</h2><span>Không trừ Credits</span></div>
      <form className="dns-form" onSubmit={lookupLocket}>
        <label>Tên người dùng hoặc link Locket<input value={username} onChange={e => setUsername(e.target.value)} placeholder="Ví dụ: tuan_locket" required /></label>
        <button className="pill" disabled={!configured || lookupBusy || !username.trim()}>{lookupBusy ? "Đang tra cứu…" : "Tra cứu tài khoản"}</button>
      </form>
      {lookupError && <p className="dns-error" role="alert">{lookupError}</p>}
      {lookup?.profile && <div className="lookup-result">
        {lookup.profile.avatar && <img src={lookup.profile.avatar} alt="" referrerPolicy="no-referrer" />}
        <div><strong>{lookup.profile.name || lookup.profile.username}</strong><p>@{lookup.profile.username} · UID: {lookup.profile.uid || "—"}</p><span>{lookup.provisional ? "Dữ liệu tạm, chưa xác minh" : "Thông tin tài khoản đã xác minh"}</span></div>
      </div>}
    </section>

    <section className="dns-panel">
      <div className="section-head"><h2>Tạo hồ sơ DNS</h2><span>1 Credits / lần theo API</span></div>
      <form className="dns-form dns-export-form" onSubmit={exportProfile}>
        <label>Username Locket<input value={username} onChange={e => setUsername(e.target.value)} placeholder="Nhập username cần tạo hồ sơ" required /></label>
        <label>Thời hạn<select value={durationDays} onChange={e => setDurationDays(e.target.value)}><option value="7">7 ngày</option><option value="30">30 ngày</option><option value="90">90 ngày</option><option value="365">365 ngày</option><option value="9999">Vĩnh viễn</option></select></label>
        <label>Tên gói<input value={packageName} onChange={e => setPackageName(e.target.value)} maxLength={80} /></label>
        <label>Video mode<select value={videoMode} onChange={e => setVideoMode(e.target.value)}><option value="5s">5 giây</option><option value="15s">15 giây</option><option value="30s">30 giây</option></select></label>
        <label>Ngày thành viên<select value={memberSinceDate} onChange={e => setMemberSinceDate(e.target.value)}><option value="classic">Classic</option><option value="today">Today</option><option value="custom">Ngày cụ thể</option></select></label>
        {memberSinceDate === "custom" && <label>Ngày thành viên<input type="date" value={customMemberDate} onChange={e => setCustomMemberDate(e.target.value)} required /></label> }
        <button className="pill" disabled={!configured || busyAction === "export" || !username.trim() || (memberSinceDate === "custom" && !customMemberDate)}>{busyAction === "export" ? "Đang tạo…" : "Tạo / cập nhật hồ sơ"}</button>
      </form>
      {notice && <p className="dns-message" role="status">{notice}</p>}
      {exportResult && <div className="lookup-result"><div><strong>Mã kích hoạt: {exportResult.code || "Đã tạo"}</strong>{exportResult.url && <p><a className="dns-install" href={exportResult.url} target="_blank" rel="noreferrer">Mở link cài đặt ↗</a></p>}</div></div>}
    </section>

    <section className="dns-panel">
      <div className="section-head"><h2>Hồ sơ kích hoạt</h2><span>{activations.length} hồ sơ</span></div>
      {listError && <p className="dns-error" role="alert">{listError}</p>}
      {listBusy ? <p className="dns-help">Đang tải dữ liệu…</p> : activations.length === 0 ? <p className="dns-help">Chưa có hồ sơ nào hoặc chưa thể tải dữ liệu.</p> : <div className="activation-list">{activations.map((item) => <article className="activation-card" key={item.id}>
        <div><strong>{item.locketUsername || item.username || "Locket profile"}</strong><p>Mã: {item.activationCode || "—"} · Gói: {item.packageName || "—"}</p><small>Hết hạn: {dateLabel(item.expiresAt)}</small></div>
        <div className="activation-actions"><span className={item.isDnsActive ? "dns-on" : "dns-off"}>{item.isDnsActive ? "DNS đang bật" : "DNS đang tắt"}</span><button type="button" className="pill" disabled={Boolean(busyAction)} onClick={() => void activationAction(item, "toggle")}>{busyAction === "toggle" + item.id ? "Đang xử lý…" : item.isDnsActive ? "Tắt DNS" : "Bật DNS"}</button><button type="button" className="pill" disabled={Boolean(busyAction)} onClick={() => void activationAction(item, "renew")}>{busyAction === "renew" + item.id ? "Đang gia hạn…" : "Gia hạn"}</button></div>
        {(item.installUrl || item.downloadUrl || item.enrollUrl || item.url) && <a className="dns-install" href={item.installUrl || item.downloadUrl || item.enrollUrl || item.url} target="_blank" rel="noreferrer">Mở link cài đặt ↗</a>}
      </article>)}</div>}
    </section>
  </div>;
}
