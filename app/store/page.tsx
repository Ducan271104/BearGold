import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OrderForm from "./order-form";

const fallbackPackages = [
  { id: "7d", name: "Locket Gold · 7 ngày", duration_label: "7 ngày", credits_price: 5, description: "Gói trải nghiệm ngắn hạn." },
  { id: "30d", name: "Locket Gold · 30 ngày", duration_label: "30 ngày", credits_price: 15, description: "Gói sử dụng theo tháng." },
  { id: "365d", name: "Locket Gold · 365 ngày", duration_label: "365 ngày", credits_price: 100, description: "Gói sử dụng theo năm." },
  { id: "lifetime", name: "Locket Gold · Vĩnh viễn", duration_label: "Vĩnh viễn", credits_price: 200, description: "Chỉ cung cấp khi đã xác minh rõ quyền phân phối và thời hạn." },
];

export default async function StorePage() {
  const supabase = await createClient();
  const { data: catalogue } = await supabase
    .from("service_packages")
    .select("id, name, duration_label, credits_price, description")
    .eq("active", true)
    .order("credits_price", { ascending: true });

  const packages = catalogue?.length ? catalogue : fallbackPackages;

  return (
    <main className="admin-page store-page">
      <header className="topbar">
        <div>
          <div className="eyebrow">BEARGOLD · PUBLIC STORE</div>
          <h1>Locket Gold Store</h1>
          <p className="sub">Gửi yêu cầu tư vấn nhanh, không cần tạo tài khoản.</p>
        </div>
        <Link href="/login" className="pill">Khu vực CTV / Admin →</Link>
      </header>

      <section className="store-notice" role="status">
        <strong>Đang tiếp nhận yêu cầu tư vấn</strong>
        <p>BearGold đang xác minh nguồn cung và quyền phân phối. Gửi yêu cầu không đồng nghĩa với việc đã mua hoặc được kích hoạt dịch vụ. Chưa thu tiền, chưa trừ Credits và chưa xử lý kích hoạt.</p>
      </section>

      <div className="section-head">
        <h2>Các gói tham khảo</h2>
        <span>Credits là mức tham khảo, không phải khoản thanh toán</span>
      </div>
      <section className="store-grid">
        {packages.map((item) => (
          <article className="store-card" key={item.id}>
            <div className="store-card-top"><span className="store-duration">{item.duration_label}</span><span className="store-lock">Đang xác minh</span></div>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <div className="store-price">{item.credits_price} <span>Credits dự kiến</span></div>
          </article>
        ))}
      </section>

      <section className="admin-section">
        <div className="section-head"><h2>Gửi yêu cầu</h2><span>Không cần tài khoản</span></div>
        <OrderForm packages={packages} />
      </section>

      <section className="admin-section">
        <div className="section-head"><h2>Quy trình</h2><span>Minh bạch từng bước</span></div>
        <div className="store-status-list">
          <div><span>1. Gửi username và liên hệ</span><strong>Khách hàng</strong></div>
          <div><span>2. Nhận mã theo dõi</span><strong>Tự động</strong></div>
          <div><span>3. Kiểm tra yêu cầu</span><strong>BearGold</strong></div>
          <div><span>4. Tư vấn khi nguồn cung được xác minh</span><strong>Chưa kích hoạt</strong></div>
        </div>
      </section>
      <p className="footer">BEARGOLD © 2026 · PUBLIC REQUEST PORTAL</p>
    </main>
  );
}
