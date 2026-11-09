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

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">🐻</div><span>BEAR<em>GOLD</em></span></div>
        <div>
          <div className="nav-label">MENU CHÍNH</div>
          <nav className="nav">
            <Link className="active" href="/">◫　Tổng quan</Link>
            {isAdmin && <Link href="/admin">⚙　Quản trị Admin</Link>}
            <Link href="/store">✦　Locket Gold Store</Link>
            <Link href="/profile">▤　Hồ sơ của tôi</Link>
            <a href="#history">◷　Lịch sử thao tác</a>
          </nav>
        </div>
        <div className="side-bottom">
          <span className="pill">{isAdmin ? "ADMIN" : "CỘNG TÁC VIÊN"}</span>
          <p>Tài khoản đã đăng nhập. Quyền truy cập được kiểm tra từ Supabase.</p>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">BEARGOLD CONTROL CENTER</div><h1>Tổng quan</h1><p className="sub">Xin chào, {displayName}.</p></div>
          <form action="/auth/signout" method="post">
            <button className="pill" type="submit">Đăng xuất</button>
          </form>
        </header>
        <section className="welcome">
          <div><span className="pill">🐻　WELCOME TO BEARGOLD</span><h2>Mọi thứ trong tầm kiểm soát.</h2><p>{isAdmin ? "Bạn đang truy cập bằng quyền quản trị." : "Bạn đang truy cập khu vực cộng tác viên."}</p></div>
          <div className="bear" aria-hidden="true">🐻‍❄️</div>
        </section>
        <section className="grid" aria-label="Chỉ số tổng quan">
          <article className="card"><div className="metric-icon">✦</div><div className="metric-label">Tổng Credits</div><div className="metric">{profile?.credits ?? 0}</div><div className="metric-note">Số dư trong hồ sơ của bạn</div></article>
          <article className="card"><div className="metric-icon">◉</div><div className="metric-label">Email tài khoản</div><div className="metric" style={{ fontSize: 14, overflowWrap: "anywhere" }}>{profile?.email || user.email}</div><div className="metric-note">Tài khoản đã xác thực</div></article>
          <article className="card"><div className="metric-icon">⌁</div><div className="metric-label">Vai trò</div><div className="metric">{isAdmin ? "Admin" : "CTV"}</div><div className="metric-note">Lấy từ Supabase</div></article>
          <article className="card"><div className="metric-icon">◷</div><div className="metric-label">Trạng thái</div><div className="metric">Hoạt động</div><div className="metric-note">Đang đăng nhập</div></article>
        </section>
        <div className="section-head"><h2>Truy cập nhanh</h2><span>Quyền truy cập theo vai trò</span></div>
        <section className="actions">
          <article className="action"><span className="metric-icon">✦</span><strong>Locket Gold Store</strong><p>Xem các gói 7 ngày, 30 ngày, 365 ngày và vĩnh viễn.</p><Link className="pill" href="/store">Mở cửa hàng →</Link></article>
          <article className="action" id="profiles"><span className="metric-icon">▤</span><strong>Hồ sơ của tôi</strong><p>Xem thông tin tài khoản, vai trò và Credits.</p><Link className="pill" href="/profile">Mở hồ sơ →</Link></article>
          {isAdmin && <article className="action"><span className="metric-icon">⚙</span><strong>Khu vực quản trị</strong><p>Khu vực chỉ dành cho tài khoản có role admin.</p><Link className="pill" href="/admin">Mở quản trị →</Link></article>}
          <article className="action" id="history"><span className="metric-icon">◷</span><strong>Lịch sử hoạt động</strong><p>Theo dõi thao tác sau khi hoàn thiện nhật ký.</p><span className="pill">Sắp ra mắt</span></article>
        </section>
        <div className="section-head"><h2>Hoạt động gần đây</h2><span>Chưa có dữ liệu</span></div>
        <div className="table-wrap"><table><thead><tr><th>HOẠT ĐỘNG</th><th>NGƯỜI THỰC HIỆN</th><th>THỜI GIAN</th><th>TRẠNG THÁI</th></tr></thead><tbody><tr><td>Đăng nhập BearGold</td><td>{displayName}</td><td>Phiên hiện tại</td><td className="status">● Đã xác thực</td></tr></tbody></table></div>
        <div className="footer">BEARGOLD © 2026 · PRIVATE MANAGEMENT DASHBOARD</div>
      </main>
    </div>
  );
}