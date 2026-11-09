import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const packages = [
  { id: "7d", name: "Locket Gold · 7 ngày", duration: "7 ngày", credits: 5, description: "Gói trải nghiệm ngắn hạn." },
  { id: "30d", name: "Locket Gold · 30 ngày", duration: "30 ngày", credits: 15, description: "Gói sử dụng theo tháng." },
  { id: "365d", name: "Locket Gold · 365 ngày", duration: "365 ngày", credits: 100, description: "Gói sử dụng theo năm." },
  { id: "lifetime", name: "Locket Gold · Vĩnh viễn", duration: "Vĩnh viễn", credits: 200, description: "Chỉ có thể cung cấp nếu nhà cung cấp xác nhận quyền phân phối và thời hạn." },
];

export default async function StorePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, credits")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="admin-page store-page">
      <header className="topbar">
        <div>
          <div className="eyebrow">BEARGOLD · CTV STORE</div>
          <h1>Locket Gold Store</h1>
          <p className="sub">Danh sách gói và mức Credits dự kiến dành cho thành viên.</p>
        </div>
        <Link href="/" className="pill">← Tổng quan</Link>
      </header>

      <section className="store-wallet">
        <div>
          <span className="store-label">SỐ DƯ CỦA BẠN</span>
          <div className="store-balance">{profile?.credits ?? 0} <span>Credits</span></div>
        </div>
        <span className="pill">{profile?.role === "admin" ? "ADMIN" : "CỘNG TÁC VIÊN"}</span>
      </section>

      <section className="store-notice" role="status">
        <strong>Đang xác minh nguồn cung và quyền phân phối</strong>
        <p>Các gói bên dưới hiện chỉ là danh mục và bảng giá dự kiến. BearGold chưa mở đặt hàng, chưa trừ Credits và chưa cam kết cung cấp dịch vụ. Chỉ kích hoạt sau khi xác minh nhà cung cấp được phép phân phối Locket Gold và điều kiện của từng gói.</p>
      </section>

      <div className="section-head">
        <h2>Các gói Locket Gold</h2>
        <span>Giá do Admin cấu hình · Credits</span>
      </div>
      <section className="store-grid">
        {packages.map((item) => (
          <article className="store-card" key={item.id}>
            <div className="store-card-top">
              <span className="store-duration">{item.duration}</span>
              <span className="store-lock" aria-label="Chưa mở bán">Đang xác minh</span>
            </div>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <div className="store-price">{item.credits} <span>Credits</span></div>
            <button className="store-disabled" type="button" disabled>Chưa mở đặt hàng</button>
          </article>
        ))}
      </section>

      <section className="admin-section">
        <div className="section-head"><h2>Trạng thái cửa hàng</h2><span>Không phát sinh giao dịch</span></div>
        <div className="store-status-list">
          <div><span>Hiển thị danh mục</span><strong>Đã bật</strong></div>
          <div><span>Đặt hàng</span><strong>Chưa kích hoạt</strong></div>
          <div><span>Trừ Credits</span><strong>Chưa kích hoạt</strong></div>
          <div><span>Xác minh nhà cung cấp</span><strong>Đang chờ</strong></div>
        </div>
      </section>
      <p className="footer">BEARGOLD © 2026 · LOCKET GOLD CATALOG</p>
    </main>
  );
}
