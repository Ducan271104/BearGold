import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const fallbackPackages = [
  { id: "7d", name: "Locket Gold · 7 ngày", duration_label: "7 ngày", credits_price: 5, description: "Gói trải nghiệm ngắn hạn." },
  { id: "30d", name: "Locket Gold · 30 ngày", duration_label: "30 ngày", credits_price: 15, description: "Gói sử dụng theo tháng." },
  { id: "365d", name: "Locket Gold · 365 ngày", duration_label: "365 ngày", credits_price: 100, description: "Gói sử dụng theo năm." },
  { id: "lifetime", name: "Locket Gold · Vĩnh viễn", duration_label: "Vĩnh viễn", credits_price: 200, description: "Chỉ cung cấp nếu nhà cung cấp xác nhận rõ quyền phân phối và thời hạn." },
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

  const { data: catalogue } = await supabase
    .from("service_packages")
    .select("id, name, duration_label, credits_price, description")
    .eq("active", true)
    .order("credits_price", { ascending: true });

  const { data: supplierGate } = await supabase
    .from("supplier_verification")
    .select("authorization_status, order_activation_enabled")
    .eq("id", 1)
    .maybeSingle();

  const packages = catalogue?.length ? catalogue : fallbackPackages;
  const supplierVerified = supplierGate?.authorization_status === "verified";
  const orderingEnabled = supplierVerified && supplierGate?.order_activation_enabled === true;

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
        <span className="pill">{String(profile?.role ?? "").toUpperCase() === "ADMIN" ? "ADMIN" : "CỘNG TÁC VIÊN"}</span>
      </section>

      <section className="store-notice" role="status">
        <strong>{supplierVerified ? "Nguồn cung đã được xác minh; cửa hàng vẫn đang khóa giao dịch" : "Đang xác minh nguồn cung và quyền phân phối"}</strong>
        <p>Các gói bên dưới hiện chỉ là danh mục và bảng giá dự kiến. BearGold chưa mở đặt hàng, chưa trừ Credits và chưa cam kết cung cấp dịch vụ. Chỉ kích hoạt sau khi Admin kiểm tra bằng chứng ủy quyền, xác nhận điều kiện từng gói và bật quy trình xử lý an toàn.</p>
      </section>

      <div className="section-head">
        <h2>Các gói Locket Gold</h2>
        <span>Giá do Admin cấu hình · Credits</span>
      </div>
      <section className="store-grid">
        {packages.map((item) => (
          <article className="store-card" key={item.id}>
            <div className="store-card-top">
              <span className="store-duration">{item.duration_label}</span>
              <span className="store-lock" aria-label="Chưa mở bán">Đang xác minh</span>
            </div>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <div className="store-price">{item.credits_price} <span>Credits</span></div>
            <button className="store-disabled" type="button" disabled>Chưa mở đặt hàng</button>
          </article>
        ))}
      </section>

      <section className="admin-section">
        <div className="section-head"><h2>Trạng thái cửa hàng</h2><span>Không phát sinh giao dịch</span></div>
        <div className="store-status-list">
          <div><span>Hiển thị danh mục</span><strong>Đã bật</strong></div>
          <div><span>Đặt hàng</span><strong>{orderingEnabled ? "Đã được xác minh" : "Chưa kích hoạt"}</strong></div>
          <div><span>Trừ Credits</span><strong>Chưa kích hoạt</strong></div>
          <div><span>Xác minh nhà cung cấp</span><strong>{supplierVerified ? "Đã xác minh" : "Đang chờ"}</strong></div>
        </div>
      </section>
      <p className="footer">BEARGOLD © 2026 · LOCKET GOLD CATALOG</p>
    </main>
  );
}
