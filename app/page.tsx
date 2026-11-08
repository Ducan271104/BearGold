const metrics = [
  { icon: "✦", label: "Tổng Credits", value: "—", note: "Chưa kết nối dữ liệu" },
  { icon: "◉", label: "Hồ sơ quản lý", value: "—", note: "Dữ liệu sẽ hiển thị sau khi kết nối" },
  { icon: "↗", label: "Thao tác hôm nay", value: "—", note: "Đang chờ cấu hình nhật ký" },
  { icon: "⌁", label: "Trạng thái hệ thống", value: "Khởi tạo", note: "Bản nền BearGold" }
];

export default function Home() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">🐻</div><span>BEAR<em>GOLD</em></span></div>
        <div>
          <div className="nav-label">MENU CHÍNH</div>
          <nav className="nav">
            <a className="active" href="/">◫　Tổng quan</a>
            <a href="/login">⇥　Đăng nhập</a>
            <a href="#profiles">▤　Quản lý hồ sơ</a>
            <a href="#history">◷　Lịch sử thao tác</a>
            <a href="#settings">⚙　Cài đặt</a>
          </nav>
        </div>
        <div className="side-bottom"><span className="pill">BẢN KHỞI TẠO</span><p>BearGold đang được thiết lập. Các dữ liệu thật sẽ chỉ xuất hiện sau khi cấu hình máy chủ và đăng nhập.</p></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">BEARGOLD CONTROL CENTER</div><h1>Tổng quan</h1><p className="sub">Chào mừng đến với bảng điều khiển BearGold.</p></div>
          <a className="profile" href="/login"><span className="avatar">👤</span><span>Tài khoản　↗</span></a>
        </header>
        <section className="welcome">
          <div><span className="pill">🐻　WELCOME TO BEARGOLD</span><h2>Mọi thứ trong tầm kiểm soát.</h2><p>Nền tảng quản lý riêng — bảo mật, rõ ràng và dễ sử dụng.</p></div>
          <div className="bear" aria-hidden="true">🐻‍❄️</div>
        </section>
        <section className="grid" aria-label="Chỉ số tổng quan">
          {metrics.map((item) => <article className="card" key={item.label}><div className="metric-icon">{item.icon}</div><div className="metric-label">{item.label}</div><div className="metric">{item.value}</div><div className="metric-note">{item.note}</div></article>)}
        </section>
        <div className="section-head"><h2>Truy cập nhanh</h2><span>Chức năng sẽ được bật theo từng giai đoạn</span></div>
        <section className="actions">
          <article className="action"><span className="metric-icon">⇥</span><strong>Tài khoản & đăng nhập</strong><p>Thiết lập xác thực và phiên đăng nhập an toàn.</p><a className="pill" href="/login">Mở trang đăng nhập →</a></article>
          <article className="action" id="profiles"><span className="metric-icon">▤</span><strong>Quản lý hồ sơ</strong><p>Khu vực dành cho các thao tác được cấp quyền.</p><span className="pill">Sắp ra mắt</span></article>
          <article className="action" id="history"><span className="metric-icon">◷</span><strong>Lịch sử hoạt động</strong><p>Theo dõi thao tác sau khi backend và database sẵn sàng.</p><span className="pill">Sắp ra mắt</span></article>
        </section>
        <div className="section-head"><h2>Hoạt động gần đây</h2><span>Chưa có dữ liệu</span></div>
        <div className="table-wrap"><table><thead><tr><th>HOẠT ĐỘNG</th><th>NGƯỜI THỰC HIỆN</th><th>THỜI GIAN</th><th>TRẠNG THÁI</th></tr></thead><tbody><tr><td>Khởi tạo giao diện BearGold</td><td>Hệ thống</td><td>Vừa tạo</td><td className="status">● Sẵn sàng cấu hình</td></tr></tbody></table></div>
        <div className="footer">BEARGOLD © 2026 · PRIVATE MANAGEMENT DASHBOARD</div>
      </main>
    </div>
  );
}