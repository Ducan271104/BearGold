import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderManager from "./order-manager";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "ctv"].includes(profile.role)) redirect("/");

  const { data, error: ordersError } = await supabase
    .from("order_requests")
    .select("id, order_code, package_name, duration_label, locket_username, contact_method, contact_value, customer_note, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main className="admin-page">
      <header className="topbar">
        <div><div className="eyebrow">BEARGOLD · STAFF ORDERS</div><h1>Quản lý yêu cầu</h1><p className="sub">Các yêu cầu khách hàng gửi không cần tài khoản.</p></div>
        <Link href="/" className="pill">← Tổng quan</Link>
      </header>
      <section className="admin-summary">
        <div><span className="pill">{profile.role.toUpperCase()} ACCESS</span><h2>Danh sách yêu cầu khách hàng</h2><p>Chỉ tài khoản CTV và Admin đã đăng nhập mới xem và cập nhật được.</p></div>
        <Link href="/store" className="pill">Mở cửa hàng công khai →</Link>
      </section>
      {ordersError ? <p className="admin-notice">Không tải được yêu cầu. Hãy kiểm tra migration 005 và quyền truy cập Supabase.</p> : <OrderManager orders={data ?? []} />}
      <p className="footer">BEARGOLD © 2026 · STAFF ORDER MANAGEMENT</p>
    </main>
  );
}
