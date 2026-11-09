import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const labels: Record<string, string> = {
  pending_review: "Đã nhận yêu cầu · Chờ kiểm tra",
  contacted: "Đã liên hệ khách hàng",
  cancelled: "Yêu cầu đã đóng",
  completed: "Đã hoàn tất",
};

export default async function TrackOrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) {
    return <main className="admin-page"><h1>Không tìm thấy yêu cầu</h1><p className="admin-notice">Mã theo dõi không hợp lệ.</p><Link className="pill" href="/store">← Về cửa hàng</Link></main>;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_order_status", { p_tracking_token: token });
  const order = Array.isArray(data) ? data[0] : null;

  return (
    <main className="admin-page store-page">
      <header className="topbar">
        <div><div className="eyebrow">BEARGOLD · ORDER TRACKING</div><h1>Tra cứu yêu cầu</h1><p className="sub">Trang theo dõi riêng tư của bạn.</p></div>
        <Link href="/store" className="pill">← Cửa hàng</Link>
      </header>
      {error || !order ? (
        <p className="admin-notice">Không tìm thấy yêu cầu. Hãy mở đúng đường dẫn theo dõi đã được cấp khi gửi biểu mẫu.</p>
      ) : (
        <section className="track-card">
          <span className="store-label">MÃ YÊU CẦU</span>
          <div className="track-code">{order.order_code}</div>
          <div className="store-status-list">
            <div><span>Gói quan tâm</span><strong>{order.package_name}</strong></div>
            <div><span>Thời hạn</span><strong>{order.duration_label}</strong></div>
            <div><span>Trạng thái</span><strong>{labels[order.status] || "Đang cập nhật"}</strong></div>
            <div><span>Ghi nhận lúc</span><strong>{new Date(order.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</strong></div>
          </div>
          <p className="order-disclaimer">Đây là yêu cầu tư vấn, chưa xác nhận thanh toán hoặc kích hoạt dịch vụ. Giữ riêng đường dẫn này vì ai có đường dẫn đều có thể xem trạng thái yêu cầu.</p>
        </section>
      )}
      <p className="footer">BEARGOLD © 2026 · PRIVATE REQUEST TRACKING</p>
    </main>
  );
}
