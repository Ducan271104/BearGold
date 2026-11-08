import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/");

  return (
    <main className="min-h-screen p-5" style={{ maxWidth: 960, margin: "0 auto" }}>
      <header className="topbar">
        <div>
          <div className="eyebrow">BEARGOLD · ADMIN ONLY</div>
          <h1>Khu vực quản trị</h1>
          <p className="sub">Trang này chỉ hiển thị với tài khoản có role admin.</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="pill" type="submit">Đăng xuất</button>
        </form>
      </header>
      <section className="welcome">
        <div>
          <span className="pill">⚙　ADMIN ACCESS</span>
          <h2>Quyền quản trị đã được xác thực.</h2>
          <p>Kiểm tra quyền được thực hiện ở máy chủ, không dựa vào giao diện trình duyệt.</p>
        </div>
        <div className="bear" aria-hidden="true">🐻</div>
      </section>
      <section className="actions">
        <article className="action">
          <strong>Quản lý thành viên</strong>
          <p>Chức năng xem và quản lý hồ sơ sẽ được triển khai ở bước tiếp theo.</p>
          <span className="pill">Đang hoàn thiện</span>
        </article>
        <article className="action">
          <strong>Nhật ký hoạt động</strong>
          <p>Chức năng tra cứu lịch sử thao tác sẽ được triển khai tiếp.</p>
          <span className="pill">Đang hoàn thiện</span>
        </article>
      </section>
      <p style={{ marginTop: 24 }}><Link href="/" className="pill">← Quay lại tổng quan</Link></p>
    </main>
  );
}