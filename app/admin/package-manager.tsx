"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Package = {
  id: string;
  name: string;
  duration_label: string;
  credits_price: number;
  description: string | null;
  active: boolean;
};

export default function PackageManager({ packages }: { packages: Package[] }) {
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(packages.map((item) => [item.id, String(item.credits_price)]))
  );
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(packages.map((item) => [item.id, item.active]))
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function save(item: Package) {
    const price = Number(prices[item.id]);
    if (!Number.isSafeInteger(price) || price < 1 || price > 100000) {
      setMessage("Giá phải là số Credits nguyên từ 1 đến 100.000.");
      return;
    }

    setBusy(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/service-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: item.id, creditsPrice: price, active: active[item.id] }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Không thể lưu cấu hình gói.");
        return;
      }
      setMessage("Đã lưu cấu hình gói. Store sẽ cập nhật theo trạng thái mới.");
      router.refresh();
    } catch {
      setMessage("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="member-list">
      {packages.map((item) => (
        <article className="member-card" key={item.id}>
          <div className="member-main">
            <strong>{item.name}</strong>
            <span>{item.duration_label} · {item.description || "Gói Locket Gold"}</span>
            <small>{active[item.id] ? "ĐANG HIỂN THỊ TRÊN STORE" : "ĐANG ẨN KHỎI STORE"}</small>
          </div>
          <div className="credit-form">
            <label>
              Giá (Credits)
              <input
                type="number"
                min="1"
                max="100000"
                step="1"
                value={prices[item.id]}
                onChange={(event) => setPrices((current) => ({ ...current, [item.id]: event.target.value }))}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={active[item.id]}
                onChange={(event) => setActive((current) => ({ ...current, [item.id]: event.target.checked }))}
              />
              Hiển thị gói
            </label>
            <button className="pill credit-submit" type="button" disabled={busy !== null} onClick={() => save(item)}>
              {busy === item.id ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </article>
      ))}
      {message && <p className="admin-notice" role="status">{message}</p>}
    </div>
  );
}
