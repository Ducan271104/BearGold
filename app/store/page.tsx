import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const fallbackPackages = [
  { id: "7d", name: "Locket Gold · 7 ngày", duration_label: "7 ngày", credits_price: 5, description: "Gói trải nghiệm ngắn hạn." },
  { id: "30d", name: "Locket Gold · 30 ngày", duration_label: "30 ngày", credits_price: 15, description: "Gói sử dụng theo tháng." },
  { id: "365d", name: "Locket Gold · 365 ngày", duration_label: "365 ngày", credits_price: 100, description: "Gói sử dụng theo năm." },
  { id: "lifetime", name: "Locket Gold · Vĩnh viễn", duration_label: "Vĩnh viễn", credits_price: 200, description: "Chỉ cung cấp khi có xác nhận quyền phân phối và thời hạn." },
];

const features = [
  ["◷", "Video dài hơn", "Thông tin giới hạn video cần được xác nhận theo phiên bản ứng dụng."],
  ["▧", "Chọn ảnh từ thư viện", "Khả năng đăng nội dung từ thư viện tùy thuộc tính năng chính thức."],
  ["◉", "Thông tin lượt xem", "Chỉ hiển thị dữ liệu mà ứng dụng và tài khoản được phép truy cập."],
  ["♧", "Quản lý bạn bè", "Không cam kết bỏ giới hạn hoặc thay đổi giới hạn của nền tảng."],
  ["✎", "Caption & giao diện", "Tùy chọn hiển thị phụ thuộc phiên bản ứng dụng."],
  ["✧", "Bộ lọc & PhotoBooth", "Tính năng cần được nhà cung cấp xác nhận trước khi giới thiệu là quyền lợi."],
];

const steps = [
  ["01", "Chọn gói", "Xem thời hạn, điều kiện và Credits cần thiết."],
  ["02", "Xác nhận đơn", "Chỉ thanh toán khi cửa hàng công bố nhà cung cấp, quyền phân phối và điều khoản rõ ràng."],
  ["03", "Nhận hỗ trợ", "Lưu mã đơn và liên hệ BearGold qua kênh hỗ trợ chính thức."],
];

const faqs = [
  ["Có cần mật khẩu Locket không?", "Không gửi mật khẩu, mã OTP hoặc thông tin đăng nhập cho bên thứ ba. BearGold không yêu cầu các thông tin này trên trang cửa hàng."],
  ["Dịch vụ đã mở bán chưa?", "Chưa. Danh mục hiện chỉ để tham khảo; giao dịch chỉ được mở sau khi xác minh nguồn cung và quyền phân phối."],
  ["Có cần cài hồ sơ DNS hoặc chứng chỉ không?", "BearGold không hướng dẫn cài hồ sơ, chứng chỉ hoặc cấu hình không rõ nguồn gốc để mở khóa tính năng của ứng dụng."],
  ["Làm sao tra cứu đơn hàng?", "Khi hệ thống đơn hàng được kết nối và xác minh, bạn có thể tra cứu bằng mã đơn. Hiện tính năng này chưa được bật."],
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
  // Orders stay disabled until a real, authorized order-processing flow is implemented.

  return (
    <main className="admin-page store-page">
      <header className="store-nav">
        <Link href="/" className="store-brand"><span>🐻</span> BEAR<strong>GOLD</strong></Link>
        <div className="store-nav-actions">
          <span className="store-credit">✦ {profile?.credits ?? 0} Credits</span>
          <Link href="/" className="pill">Dashboard ↗</Link>
        </div>
      </header>

      <section className="store-hero">
        <div className="store-hero-copy">
          <span className="store-kicker">BEARGOLD · LOCKET STORE</span>
          <h1>Trải nghiệm Locket<br /><em>theo cách của bạn.</em></h1>
          <p>Khám phá danh mục dịch vụ, xem điều kiện từng gói và theo dõi thông tin cung cấp minh bạch ngay tại BearGold.</p>
          <div className="store-hero-actions">
            <a className="store-primary-link" href="#packages">Khám phá các gói <span>→</span></a>
            <span className="store-trust">● Không yêu cầu mật khẩu hoặc OTP</span>
          </div>
        </div>
        <div className="store-hero-art" aria-hidden="true">
          <div className="store-orbit orbit-one"></div><div className="store-orbit orbit-two"></div>
          <div className="store-phone"><div className="store-phone-top"></div><div className="store-photo">✦</div><div className="store-phone-line"></div><div className="store-phone-line short"></div><div className="store-phone-pill">BEAR GOLD</div></div>
          <div className="store-float store-float-top">✧ GOLD EXPERIENCE</div><div className="store-float store-float-bottom">🐻 BEARGOLD</div>
        </div>
      </section>

      <section className="store-assurance">
        <div><b>01</b><span><strong>Minh bạch điều kiện</strong><small>Hiển thị trạng thái nguồn cung</small></span></div>
        <div><b>02</b><span><strong>Bảo vệ tài khoản</strong><small>Không thu thập mật khẩu, OTP</small></span></div>
        <div><b>03</b><span><strong>Hỗ trợ rõ ràng</strong><small>Không hứa hẹn kích hoạt giả</small></span></div>
      </section>

      <section className="store-section" id="packages">
        <div className="store-section-heading"><div><span className="store-kicker">CHỌN GÓI PHÙ HỢP</span><h2>Các gói dịch vụ</h2><p>Credits và mô tả được lấy từ danh mục BearGold.</p></div><span className="store-section-note">CẬP NHẬT THEO CẤU HÌNH</span></div>
        <div className="store-catalogue">
          {packages.map((item, index) => (
            <article className={index === packages.length - 1 ? "store-product featured" : "store-product"} key={item.id}>
              <div className="store-product-top"><span>{item.duration_label}</span><span className="store-product-tag">{supplierVerified ? "Đã xác minh nguồn cung" : "Đang xác minh"}</span></div>
              <h3>{item.name}</h3><p>{item.description}</p>
              <div className="store-product-price">{item.credits_price}<small> Credits</small></div>
              <button className="store-order-button" type="button" disabled>Chưa tích hợp đặt hàng</button>
              <small className="store-product-foot">Không trừ Credits khi giao dịch chưa được mở.</small>
            </article>
          ))}
        </div>
        <div className="store-gate" role="status"><span>ⓘ</span><div><strong>{supplierVerified ? "Nguồn cung đã xác minh · Đặt hàng chưa tích hợp" : "Cửa hàng đang trong giai đoạn xác minh"}</strong><p>{supplierVerified ? "Nguồn cung đã được đánh dấu xác minh, nhưng BearGold chưa tích hợp quy trình đặt hàng hoặc thanh toán. Không có giao dịch nào được thực hiện tại thời điểm này." : "Danh mục đang hiển thị để tham khảo. BearGold chưa nhận thanh toán, chưa trừ Credits và chưa cam kết thời hạn hay quyền lợi Gold. Giao dịch chỉ được xem xét sau khi Admin xác minh bằng chứng ủy quyền và điều kiện cung cấp."}</p></div></div>
      </section>

      <section className="store-section">
        <div className="store-section-heading"><div><span className="store-kicker">TÍNH NĂNG THAM KHẢO</span><h2>Khám phá các tiện ích</h2><p>Các quyền lợi cụ thể cần được xác nhận theo phiên bản và điều khoản của nhà cung cấp.</p></div></div>
        <div className="store-feature-grid">{features.map(([icon, title, description]) => <article className="store-feature" key={title}><span>{icon}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="store-section">
        <div className="store-section-heading"><div><span className="store-kicker">QUY TRÌNH RÕ RÀNG</span><h2>3 bước sử dụng cửa hàng</h2></div></div>
        <div className="store-steps">{steps.map(([number, title, description]) => <article key={number}><b>{number}</b><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="store-section store-faq-section">
        <div className="store-section-heading"><div><span className="store-kicker">HỖ TRỢ</span><h2>Câu hỏi thường gặp</h2></div></div>
        <div className="store-faq">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>＋</span></summary><p>{answer}</p></details>)}</div>
      </section>

      <footer className="store-footer"><Link href="/" className="store-brand"><span>🐻</span> BEAR<strong>GOLD</strong></Link><p>© 2026 BearGold · Dịch vụ độc lập, không liên kết chính thức với Locket.</p><p>Chỉ sử dụng dịch vụ có nguồn cung và quyền phân phối được xác minh.</p></footer>
    </main>
  );
}
