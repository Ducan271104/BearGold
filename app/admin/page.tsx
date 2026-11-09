import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberManager from "./member-manager";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  credits: number;
  created_at: string;
};

type Activity = {
  id: number;
  actor_id: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type SupplierVerification = {
  supplier_name: string | null;
  authorization_status: "pending" | "verified" | "rejected";
  order_activation_enabled: boolean;
  verified_at: string | null;
  updated_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

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

  const [profilesResult, activityResult, supplierResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, display_name, role, credits, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("activity_logs")
      .select("id, actor_id, action, target, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("supplier_verification")
      .select("supplier_name, authorization_status, order_activation_enabled, verified_at, updated_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const members = (profilesResult.data ?? []) as Profile[];
  const activities = (activityResult.data ?? []) as Activity[];
  const supplier = supplierResult.data as SupplierVerification | null;
  const emailById = new Map(members.map((member) => [member.id, member.email || "Không rõ"]));

  return (
    <main className="admin-page">
      <header className="topbar">
        <div>
          <div className="eyebrow">BEARGOLD · ADMIN ONLY</div>
          <h1>Khu vực quản trị</h1>
          <p className="sub">Xin chào {user.email}. Dữ liệu được tải trực tiếp từ Supabase.</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="pill" type="submit">Đăng xuất</button>
        </form>
      </header>

      <section className="admin-summary">
        <div>
          <span className="pill">⚙ ADMIN ACCESS</span>
          <h2>Trung tâm quản lý BearGold</h2>
          <p>Quyền quản trị được xác minh ở máy chủ. Credits chỉ được điều chỉnh qua thao tác Admin có ghi nhật ký.</p>
        </div>
        <Link href="/" className="pill">← Tổng quan</Link>
      </section>

      <section className="admin-stats">
        <article className="card">
          <div className="metric-label">Tổng tài khoản tải được</div>
          <div className="metric">{members.length}</div>
        </article>
        <article className="card">
          <div className="metric-label">Quản trị viên</div>
          <div className="metric">{members.filter((item) => item.role === "admin").length}</div>
        </article>
        <article className="card">
          <div className="metric-label">Cộng tác viên</div>
          <div className="metric">{members.filter((item) => item.role === "ctv").length}</div>
        </article>
        <article className="card">
          <div className="metric-label">Nhật ký gần đây</div>
          <div className="metric">{activities.length}</div>
        </article>
      </section>

      <section className="admin-section">
        <div className="section-head">
          <h2>Trạng thái nhà cung cấp</h2>
          <span>Chỉ đọc · không tự kích hoạt đơn hàng</span>
        </div>
        {supplierResult.error ? (
          <p className="admin-notice">Chưa đọc được trạng thái nhà cung cấp. Kiểm tra migration 004 và quyền đọc bảng supplier_verification.</p>
        ) : !supplier ? (
          <p className="admin-notice">Chưa có bản ghi xác minh nhà cung cấp. Hệ thống tiếp tục giữ chức năng đặt hàng ở trạng thái tắt.</p>
        ) : (
          <div className="supplier-gate-card">
            <div className="supplier-gate-head">
              <span className={`supplier-status supplier-status-${supplier.authorization_status}`}>
                {supplier.authorization_status === "verified" ? "Đã xác minh" : supplier.authorization_status === "rejected" ? "Không được xác minh" : "Đang chờ xác minh"}
              </span>
              <span className={supplier.order_activation_enabled ? "supplier-activation supplier-activation-on" : "supplier-activation"}>
                Đặt hàng: {supplier.order_activation_enabled ? "Đang bật" : "Đang tắt"}
              </span>
            </div>
            <h3>{supplier.supplier_name || "Chưa khai báo nhà cung cấp"}</h3>
            <p>
              {supplier.authorization_status === "verified"
                ? "Trạng thái xác minh đã được ghi nhận. Chỉ bật xử lý đơn hàng khi quyền phân phối và quy trình vận hành đã được kiểm tra đầy đủ."
                : supplier.authorization_status === "rejected"
                  ? "Nguồn cung chưa được chấp thuận. Không nhận thanh toán hoặc kích hoạt dịch vụ."
                  : "Nguồn cung và quyền phân phối chưa được xác minh. BearGold chỉ hiển thị danh mục tham khảo và tiếp nhận yêu cầu tư vấn."}
            </p>
            <small>Cập nhật lần cuối: {formatDate(supplier.updated_at)}</small>
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-head">
          <h2>Thành viên</h2>
          <span>Tối đa 100 tài khoản mới nhất</span>
        </div>
        {profilesResult.error ? (
          <p className="admin-notice">Không tải được danh sách thành viên: {profilesResult.error.message}</p>
        ) : (
          <MemberManager members={members} />
        )}
      </section>

      <section className="admin-section">
        <div className="section-head">
          <h2>Nhật ký hoạt động</h2>
          <span>30 bản ghi mới nhất</span>
        </div>
        {activityResult.error ? (
          <p className="admin-notice">Không tải được nhật ký: {activityResult.error.message}</p>
        ) : activities.length === 0 ? (
          <p className="admin-notice">Chưa có nhật ký hoạt động. Nhật ký sẽ xuất hiện khi các chức năng ghi log được kết nối.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>THAO TÁC</th><th>NGƯỜI THỰC HIỆN</th><th>ĐỐI TƯỢNG</th><th>THỜI GIAN</th></tr></thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.action}</td>
                    <td>{activity.actor_id ? (emailById.get(activity.actor_id) || activity.actor_id.slice(0, 8)) : "Hệ thống"}</td>
                    <td>{activity.target || "—"}</td>
                    <td>{formatDate(activity.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="footer">BEARGOLD © 2026 · PRIVATE MANAGEMENT DASHBOARD</p>
    </main>
  );
}
