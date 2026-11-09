"use client";

import { useState } from "react";

type Order = {
  id: string;
  order_code: string;
  package_name: string;
  duration_label: string;
  locket_username: string;
  contact_method: string;
  contact_value: string;
  customer_note: string;
  status: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  pending_review: "Chờ kiểm tra",
  contacted: "Đã liên hệ",
  cancelled: "Đã đóng",
  completed: "Hoàn tất",
};

export default function OrderManager({ orders }: { orders: Order[] }) {
  const [rows, setRows] = useState(orders);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch("/api/orders/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Không cập nhật được trạng thái.");
        return;
      }
      setRows((current) => current.map((row) => row.id === id ? { ...row, status } : row));
      setMessage("Đã cập nhật trạng thái yêu cầu.");
    } catch {
      setMessage("Không kết nối được máy chủ.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      {message && <p className="admin-notice" role="status">{message}</p>}
      {rows.length === 0 ? <p className="admin-notice">Chưa có yêu cầu nào.</p> : (
        <div className="order-list">
          {rows.map((order) => (
            <article className="order-admin-card" key={order.id}>
              <div className="order-admin-head">
                <strong>{order.order_code}</strong>
                <span>{new Date(order.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
              </div>
              <div className="order-admin-grid">
                <div><small>Gói</small><strong>{order.package_name} · {order.duration_label}</strong></div>
                <div><small>Username Locket</small><strong>{order.locket_username}</strong></div>
                <div><small>Liên hệ</small><strong>{order.contact_value} ({order.contact_method === "email" ? "Email" : "Điện thoại"})</strong></div>
                {order.customer_note && <div><small>Ghi chú</small><strong>{order.customer_note}</strong></div>}
              </div>
              <div className="order-admin-actions">
                <span className="order-status">{statusLabels[order.status] || order.status}</span>
                <select aria-label={`Trạng thái ${order.order_code}`} value={order.status} disabled={busyId === order.id} onChange={(e) => updateStatus(order.id, e.target.value)}>
                  <option value="pending_review">Chờ kiểm tra</option>
                  <option value="contacted">Đã liên hệ</option>
                  <option value="cancelled">Đã đóng</option>
                  <option value="completed">Hoàn tất</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
