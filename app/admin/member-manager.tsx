"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  credits: number;
  created_at: string;
};

function CreditAdjustForm({ member }: { member: Member }) {
  const router = useRouter();
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [amount, setAmount] = useState("10");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [credits, setCredits] = useState(member.credits ?? 0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const value = Number(amount);
    if (!Number.isSafeInteger(value) || value <= 0 || value > 100000) {
      setMessage("Nhập số Credits từ 1 đến 100.000.");
      return;
    }
    if (!window.confirm(`${mode === "add" ? "Cộng" : "Trừ"} ${value} Credits cho ${member.email || member.id}?`)) return;

    setBusy(true);
    try {
      const response = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          delta: mode === "add" ? value : -value,
          reason,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "Không thể cập nhật Credits.");
        return;
      }
      setCredits(result.credits);
      setAmount("10");
      setReason("");
      setMessage("Đã cập nhật Credits và ghi nhật ký.");
      router.refresh();
    } catch {
      setMessage("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="credit-form" onSubmit={submit}>
      <strong>Số dư: {credits.toLocaleString("vi-VN")} Credits</strong>
      <div className="credit-controls">
        <select aria-label="Loại điều chỉnh" value={mode} onChange={(event) => setMode(event.target.value as "add" | "subtract")}>
          <option value="add">Cộng</option>
          <option value="subtract">Trừ</option>
        </select>
        <input aria-label="Số Credits" type="number" min="1" max="100000" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        <input aria-label="Lý do" type="text" maxLength={200} placeholder="Lý do (không bắt buộc)" value={reason} onChange={(event) => setReason(event.target.value)} />
        <button className="pill credit-submit" type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Xác nhận"}</button>
      </div>
      {message && <p className="credit-message" role="status">{message}</p>}
    </form>
  );
}

export default function MemberManager({ members }: { members: Member[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    if (!term) return members;
    return members.filter((member) =>
      [member.email, member.display_name, member.id].some((value) =>
        value?.toLocaleLowerCase("vi").includes(term)
      )
    );
  }, [members, search]);

  return (
    <>
      <div className="member-tools">
        <input
          type="search"
          placeholder="Tìm theo email, tên hoặc mã tài khoản…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Tìm kiếm thành viên"
        />
        <span>{filtered.length} / {members.length} tài khoản</span>
      </div>
      {filtered.length === 0 ? (
        <p className="admin-notice">Không tìm thấy thành viên phù hợp.</p>
      ) : (
        <div className="member-list">
          {filtered.map((member) => (
            <article className="member-card" key={member.id}>
              <div className="member-main">
                <strong>{member.display_name || member.email || "Thành viên"}</strong>
                <span>{member.email || "Chưa có email"}</span>
                <small>{member.role.toUpperCase()} · {member.id.slice(0, 8)}…</small>
              </div>
              {String(member.role).toUpperCase() === "CTV" ? (
                <CreditAdjustForm member={member} />
              ) : (
                <div className="member-admin-credit">ADMIN · {member.credits ?? 0} Credits</div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
