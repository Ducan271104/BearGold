import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DnsManager from "./dns-manager";

export default async function DnsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ctv") redirect("/");
  return <main className="admin-page dns-page">
    <header className="topbar"><div><div className="eyebrow">BEARGOLD · CTV WORKSPACE</div><h1>Quản lý DNS</h1><p className="sub">Tra cứu Locket, tạo và quản lý hồ sơ kích hoạt của bạn.</p></div><Link href="/" className="pill">← Tổng quan</Link></header>
    <DnsManager />
    <p className="footer">BEARGOLD © 2026 · CTV DNS MANAGEMENT</p>
  </main>;
}
