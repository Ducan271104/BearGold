export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <section className="card w-full" style={{ maxWidth: 440 }}>
        <a href="/" className="brand" style={{ padding: 0 }}>
          <span className="brand-mark">🐻</span><span>BEAR<em>GOLD</em></span>
        </a>
        <div className="eyebrow" style={{ marginTop: 32 }}>MEMBER ACCESS</div>
        <h1 style={{ fontSize: 28 }}>Đăng nhập BearGold</h1>
        <p className="sub">Trang xác thực sẽ được kết nối Supabase ở bước tiếp theo.</p>
        <div style={{ marginTop: 24, padding: 16, borderRadius: 14, background: "#0b0f16", border: "1px solid var(--line)" }}>
          <strong style={{ fontSize: 13 }}>Chưa bật đăng nhập</strong>
          <p className="sub" style={{ lineHeight: 1.7, marginTop: 8 }}>Để bảo vệ tài khoản, biểu mẫu đăng nhập chỉ được kích hoạt sau khi cấu hình Supabase Auth và biến môi trường trên máy chủ.</p>
        </div>
        <a href="/" className="pill" style={{ marginTop: 20 }}>← Quay lại tổng quan</a>
      </section>
    </main>
  );
}