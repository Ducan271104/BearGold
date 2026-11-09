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

  const [profilesResult, activityResult] = await Promise.all([
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
  ]);

  const members = (profilesResult.data ?? []) as Profile[];
  const activities = (activityResult.data ?? []) as Activity[];
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
