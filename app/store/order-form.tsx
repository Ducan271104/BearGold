"use client";

import { useState } from "react";

type Package = {
  id: string;
  name: string;
  duration_label: string;
  credits_price: number;
  description: string;
};

export default function OrderForm({ packages }: { packages: Package[] }) {
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [username, setUsername] = useState("");
  const [contactMethod, setContactMethod] = useState<"phone" | "email">("phone");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          username: username.trim(),
          contactMethod,
          contact: contact.trim(),
          note: note.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Chưa gửi được yêu cầu. Vui lòng thử lại.");
        return;
      }
      window.location.assign(result.trackingUrl);
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="public-order-form" onSubmit={submit}>
      <label>Chọn gói dịch vụ
        <select value={packageId} onChange={(e) => setPackageId(e.target.value)} required>
          {packages.map((item) => <option value={item.id} key={item.id}>{item.duration_label} · {item.credits_price} Credits dự kiến</option>)}
        </select>
      </label>
      <label>Username Locket
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ví dụ: ten_nguoidung" minLength={2} maxLength={80} pattern="[A-Za-z0-9._-]+" autoComplete="off" required />
      </label>
      <label>Thông tin liên hệ
        <div className="contact-row">
          <select aria-label="Loại liên hệ" value={contactMethod} onChange={(e) => setContactMethod(e.target.value as "phone" | "email")}>
            <option value="phone">Số điện thoại</option>
            <option value="email">Email</option>
          </select>
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={contactMethod === "phone" ? "Số điện thoại liên hệ" : "Email liên hệ"} type={contactMethod === "email" ? "email" : "tel"} maxLength={120} required />
        </div>
      </label>
      <label>Ghi chú (không bắt buộc)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={3} placeholder="Thông tin bổ sung nếu có…" />
      </label>
      <p className="order-privacy">Không nhập mật khẩu Locket, mật khẩu Apple ID hoặc mã xác minh. BearGold chỉ dùng thông tin trên để liên hệ về yêu cầu.</p>
      {error && <p className="order-error" role="alert">{error}</p>}
      <button className="order-submit" type="submit" disabled={busy || !packageId}>{busy ? "Đang gửi yêu cầu…" : "Gửi yêu cầu tư vấn"}</button>
      <p className="order-disclaimer">Đây là yêu cầu tư vấn, chưa phải đơn hàng đã thanh toán. Chưa trừ Credits và chưa kích hoạt dịch vụ.</p>
    </form>
  );
}
