import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, display_name, role, credits")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "ctv";
  const isAdmin = role === "admin";
  const displayName = profile?.display_name || user.email || "Thành viên";
  const credits = profile?.credits ?? 0;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="BearGold trang chủ">
          <span className="brand-mark">🐻</span><span>BEAR<em>GOLD</em></span>
        </Link>
        <div>
          <div className="nav-label">KHÔNG GIAN LÀM VIỆC</div>
          <nav className="nav" aria-label="Điều hướng chính">
            <Link className="active" href="/">◫　Tổng quan</Link>
            {isAdmin && <Link href="/admin">⚙　Quản trị Admin</Link>}
            <Link href="/store">✦　Danh mục dịch vụ</Link>
            <Link href="/orders">▣　Yêu cầu & đơn hàng</Link>
            <Link href="/profile">▤　Hồ sơ của tôi</Link>
          </nav>
        </div>
        <div className="side-bottom">
          <span className="pill">{isAdmin ? "ADMIN" : "CỘNG TÁC VIÊN"}</span>
          <p>Quyền truy cập và số dư được đọc từ hệ thống BearGold.</p>
        </div>
      </aside>

      <main className="main dashboard-main">
        <header className="topbar">
          <div>
            <div className="eyebrow">BEARGOLD · MEMBER CENTER</div>
            <h1>Tổng quan</h1>
            <p className="sub">Chào {displayName}, chúc bạn có một ngày làm việc hiệu quả.</p>
          </div>
          <div className="topbar-actions">
            <Link className="pill dashboard-store-link" href="/store">Khám phá dịch vụ <span aria-hidden="true">↗</span></Link>
            <form action="/auth/signout" method="post">
              <button className="pill dashboard-logout" type="submit">Đăng xuất</button>
            </form>
          </div>
        </header>

        <section className="welcome dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="hero-kicker">🐻　WELCOME BACK TO BEARGOLD</span>
            <h2>Một nơi, mọi hoạt động.</h2>
            <p>Theo dõi tài khoản, Credits và các yêu cầu của bạn trong cùng một không gian.</p>
            <div className="hero-actions">
              <Link className="hero-primary" href="/store">Xem danh mục dịch vụ <span aria-hidden="true">→</span></Link>
              <Link className="hero-secondary" href="/orders">Theo dõi yêu cầu</Link>
            </div>
          </div>
          <div className="hero-emblem" aria-hidden="true"><span>BG</span><b>✦</b></div>
        </section>

        <section className="dashboard-stats" aria-label="Thông tin tài khoản">
          <article className="card dashboard-stat-card">
            <div className="stat-topline"><span className="metric-label">SỐ DƯ CREDITS</span><span className="stat-symbol">✦</span></div>
            <div className="metric">{credits.toLocaleString("vi-VN")}</div>
            <div className="metric-note">Số dư hiện tại từ hồ sơ</div>
          </article>
          <article className="card dashboard-stat-card">
            <div className="stat-topline"><span className="metric-label">TÀI KHOẢN</span><span className="stat-symbol">◉</span></div>
            <div className="dashboard-email">{profile?.email || user.email}</div>
            <div className="metric-note">Email đăng nhập BearGold</div>
          </article>
          <article className="card dashboard-stat-card">
            <div className="stat-topline"><span className="metric-label">VAI TRÒ</span><span className="stat-symbol">♙</span></div>
            <div className="metric">{isAdmin ? "Admin" : "CTV"}</div>
            <div className="metric-note">Phân quyền từ Supabase</div>
          </article>
          <article className="card dashboard-stat-card">
            <div className="stat-topline"><span className="metric-label">PHIÊN LÀM VIỆC</span><span className="stat-symbol">✓</span></div>
            <div className="metric dashboard-active">Đang hoạt động</div>
            <div className="metric-note">Tài khoản đã xác thực</div>
          </article>
        </section>

        <div className="section-head dashboard-section-head">
          <div><h2>Lối tắt</h2><p>Truy cập nhanh các khu vực thường dùng</p></div>
          <span>BEARGOLD WORKSPACE</span>
        </div>
        <section className="actions dashboard-actions">
          <Link className="action dashboard-action" href="/store">
            <span className="dashboard-action-icon">✦</span>
            <span className="dashboard-action-tag">DỊCH VỤ</span>
            <strong>Danh mục dịch vụ</strong>
            <p>Xem thông tin các gói và trạng thái tiếp nhận yêu cầu.</p>
            <span className="dashboard-action-link">Mở danh mục <b>→</b></span>
          </Link>
          <Link className="action dashboard-action" href="/orders">
            <span className="dashboard-action-icon">▣</span>
            <span className="dashboard-action-tag">THEO DÕI</span>
            <strong>Yêu cầu & đơn hàng</strong>
            <p>Kiểm tra mã yêu cầu và cập nhật trạng thái xử lý.</p>
            <span className="dashboard-action-link">Xem yêu cầu <b>→</b></span>
          </Link>
          <Link className="action dashboard-action" href="/profile">
            <span className="dashboard-action-icon">♙</span>
            <span className="dashboard-action-tag">CÁ NHÂN</span>
            <strong>Hồ sơ của tôi</strong>
            <p>Xem thông tin tài khoản, vai trò và số dư Credits.</p>
            <span className="dashboard-action-link">Mở hồ sơ <b>→</b></span>
          </Link>
          {isAdmin && (
            <Link className="action dashboard-action" href="/admin">
              <span className="dashboard-action-icon">⚙</span>
              <span className="dashboard-action-tag">QUẢN TRỊ</span>
              <strong>Trung tâm Admin</strong>
              <p>Quản lý thành viên và các chức năng quản trị.</p>
              <span className="dashboard-action-link">Mở quản trị <b>→</b></span>
            </Link>
          )}
        </section>

        <section className="dashboard-security-note">
          <span className="security-note-icon">盾</span>
          <div><strong>Thông tin được bảo vệ</strong><p>Số dư và quyền truy cập được xác định phía máy chủ. BearGold không yêu cầu mật khẩu Locket hoặc Apple ID của bạn.</p></div>
        </section>

        <div className="footer">BEARGOLD © 2026 · MEMBER WORKSPACE</div>
      </main>
    </div>
  );
}
