import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const packageId = typeof input.packageId === "string" ? input.packageId : "";
  const username = typeof input.username === "string" ? input.username.trim() : "";
  const contactMethod = input.contactMethod === "email" ? "email" : input.contactMethod === "phone" ? "phone" : "";
  const contact = typeof input.contact === "string" ? input.contact.trim() : "";
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 300) : "";

  if (!/^[a-zA-Z0-9_-]{2,20}$/.test(packageId)
      || !/^[A-Za-z0-9._-]{2,80}$/.test(username)
      || !contactMethod
      || contact.length < 5 || contact.length > 120) {
    return NextResponse.json({ error: "Vui lòng kiểm tra username, gói dịch vụ và thông tin liên hệ." }, { status: 400 });
  }

  const supabase = await createClient();
  const trackingToken = randomBytes(24).toString("hex");
  const { data, error } = await supabase.rpc("create_public_order_request", {
    p_tracking_token: trackingToken,
    p_package_id: packageId,
    p_locket_username: username,
    p_contact_method: contactMethod,
    p_contact_value: contact,
    p_customer_note: note,
  });

  if (error || !Array.isArray(data) || !data[0]?.order_code) {
    const message = error?.message.includes("PACKAGE_UNAVAILABLE")
      ? "Gói này hiện không khả dụng."
      : error?.message.includes("INVALID_CONTACT")
        ? "Thông tin liên hệ chưa đúng định dạng."
        : "Chưa thể gửi yêu cầu. Vui lòng thử lại sau.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({
    orderCode: data[0].order_code,
    trackingUrl: `/track/${trackingToken}`,
  }, { status: 201 });
}
