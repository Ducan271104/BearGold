import "server-only";

const API_BASE = "https://uplocket.io.vn";

export type ProviderResult = {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
};

export async function uplocketRequest(
  path: string,
  init: RequestInit = {},
): Promise<ProviderResult> {
  const apiKey = process.env.UPLOCKET_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      data: { success: false, error: "Máy chủ chưa cấu hình kết nối nhà cung cấp." },
    };
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

    const raw = await response.text();
    let data: Record<string, unknown>;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      data = parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : { success: false, error: "Nhà cung cấp trả về dữ liệu không hợp lệ." };
    } catch {
      data = { success: false, error: "Nhà cung cấp trả về dữ liệu không phải JSON." };
    }

    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 502,
      data: { success: false, error: "Không thể kết nối nhà cung cấp. Vui lòng thử lại sau." },
    };
  }
}
