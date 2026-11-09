import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivationsClient from "./activations-client";

export const dynamic = "force-dynamic";

export default async function ActivationsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!["ADMIN", "CTV"].includes(String(profile?.role ?? "").toUpperCase())) {
    redirect("/");
  }

  return <ActivationsClient />;
}
