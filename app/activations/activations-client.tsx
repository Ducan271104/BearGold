"use client";

import { useCallback, useEffect, useState } from "react";

type Activation = {
  id?: string | number;
  activationCode?: string;
  locketUsername?: string;
  username?: string;
  packageName?: string;
  status?: string;
  isDnsActive?: boolean;
  expiresAt?: string | null;
  createdAt?: string;
};

function dateLabel(value?: string | null) {
  if (!value) return "Không có thông tin";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không có thông tin";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function getRows(payload: Record<string, unknown>): Activation[] {
  const candidates = [payload.activations, payload.data, payload.records, payload.items];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as Activation[];
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      for (const key of ["activations", "records", "items"]) {
        if (Array.isArray(nested[key])) return nested[key] as Activation[];
      }
    }
  }
  return [];
}

export default function ActivationsClient() {
  const [rows, setRows] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/provider/activations", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json() as Record<string, unknown>;
      if (!response.ok || payload.success === false) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Không tải được danh sách hồ sơ.");
      }
      setRows(getRows(payload));
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="admin-page">
      <header className="topbar">
        <div>
          <div className="eyebrow">BEARGOLD · PROVIDER MANAGEMENT</div>
          <h1>Hồ sơ DNS</h1>
          <p className="sub">Danh sách hồ sơ được trả về từ nhà cung cấp Uplocket.</p>
        </div>
        <a className="pill" href="/admin">← Quản trị</a>
      </header>

      <section className="admin-summary">
        <div>
          <span className="pill">READ ONLY · NO CHANGES</span>
          <h2>Quản lý hồ sơ kích hoạt</h2>
          <p>Trang này chỉ đọc dữ liệu. Không tạo, gia hạn, bật/tắt DNS hoặc trừ Credits.</p>
        </div>
        <button className="pill activation-refresh" type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Đang tải…" : "↻ Làm mới"}
        </button>
      </section>

      <section className="admin-stats">
        <article className="card">
          <div className="metric-label">Hồ sơ tải được</div>
          <div className="metric">{rows.length}</div>
        </article>
        <article className="card">
          <div className="metric-label">DNS đang bật</div>
          <div className="metric">{rows.filter((row) => row.isDnsActive === true).length}</div>
        </article>
        <article className="card">
          <div className="metric-label">DNS đang tắt</div>
          <div className="metric">{rows.filter((row) => row.isDnsActive === false).length}</div>
        </article>
        <article className="card">
          <div className="metric-label">Trạng thái tải</div>
          <div className="metric activation-state">{loading ? "Đang tải" : error ? "Lỗi" : loaded ? "Đã tải" : "Chưa tải"}</div>
        </article>
      </section>

      {error ? <p className="admin-notice" role="alert">{error}</p> : null}
      {!error && !loading && rows.length === 0 ? (
        <p className="admin-notice">Nhà cung cấp chưa trả về hồ sơ nào, hoặc cấu trúc phản hồi chưa được nhận diện.</p>
      ) : null}

      <section className="admin-section">
        <div className="section-head">
          <h2>Danh sách hồ sơ</h2>
          <span>Tối đa 20 hồ sơ gần nhất · Chỉ xem</span>
        </div>
        <div className="table-wrap">
          <table className="activation-table">
            <thead>
              <tr>
                <th>USERNAME</th>
                <th>MÃ KÍCH HOẠT</th>
                <th>GÓI</th>
                <th>TRẠNG THÁI</th>
                <th>DNS</th>
                <th>HẾT HẠN</th>
                <th>NGÀY TẠO</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id ?? row.activationCode ?? index}>
                  <td>{row.locketUsername || row.username || "—"}</td>
                  <td>{row.activationCode || "—"}</td>
                  <td>{row.packageName || "—"}</td>
                  <td>{row.status || "—"}</td>
                  <td>
                    <span className={row.isDnsActive === true ? "activation-on" : "activation-off"}>
                      {row.isDnsActive === true ? "Đang bật" : row.isDnsActive === false ? "Đang tắt" : "Không rõ"}
                    </span>
                  </td>
                  <td>{dateLabel(row.expiresAt)}</td>
                  <td>{dateLabel(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="footer">BEARGOLD © 2026 · PROVIDER DATA · READ ONLY</p>
    </main>
  );
}
