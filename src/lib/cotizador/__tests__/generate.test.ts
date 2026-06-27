import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderCotizacionPdf,
  uploadCotizacionPdf,
  getCotizacionSignedUrl,
  cotizacionPdfPath,
} from "@/lib/cotizador/generate";

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.COTIZADOR_RENDER_URL = "https://noddo-render.up.railway.app";
  process.env.RENDER_SHARED_SECRET = "test-secret";
});

describe("cotizacionPdfPath", () => {
  it("builds {proyecto_id}/{cotizacion_id}.pdf", () => {
    expect(cotizacionPdfPath("proj-1", "cot-9")).toBe("proj-1/cot-9.pdf");
  });
});

describe("renderCotizacionPdf", () => {
  it("POSTs HTML to the worker with the shared-secret header and returns the PDF buffer", async () => {
    const pdfBytes = new Uint8Array(200).fill(0x25); // >100 bytes, %-filled
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(pdfBytes, { status: 200, headers: { "Content-Type": "application/pdf" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const buf = await renderCotizacionPdf("<!DOCTYPE html><html></html>");
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://noddo-render.up.railway.app/render");
    expect((init as RequestInit).method).toBe("POST");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["x-render-token"]).toBe("test-secret");
  });

  it("throws on a non-200 worker response (fail-loud at this layer)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("boom", { status: 500 })));
    await expect(renderCotizacionPdf("<html></html>")).rejects.toThrow(/render worker/i);
  });
});

describe("uploadCotizacionPdf", () => {
  it("uploads to the private bucket and returns the object PATH (not a URL)", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upload });
    const supabase = { storage: { from } } as never;

    const path = await uploadCotizacionPdf(supabase, "proj-1", "cot-9", Buffer.from("%PDF"));
    expect(from).toHaveBeenCalledWith("cotizaciones");
    expect(upload).toHaveBeenCalledWith(
      "proj-1/cot-9.pdf",
      expect.any(Buffer),
      expect.objectContaining({ contentType: "application/pdf", upsert: true }),
    );
    expect(path).toBe("proj-1/cot-9.pdf"); // PATH, not a public URL
  });

  it("throws when the upload errors", async () => {
    const upload = vi.fn().mockResolvedValue({ error: { message: "denied" } });
    const supabase = { storage: { from: () => ({ upload }) } } as never;
    await expect(
      uploadCotizacionPdf(supabase, "p", "c", Buffer.from("x")),
    ).rejects.toThrow(/denied/);
  });
});

describe("getCotizacionSignedUrl", () => {
  it("mints a short-lived signed URL for the stored path", async () => {
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: "https://signed/url?token=abc" }, error: null });
    const supabase = { storage: { from: () => ({ createSignedUrl }) } } as never;

    const url = await getCotizacionSignedUrl(supabase, "proj-1/cot-9.pdf");
    expect(createSignedUrl).toHaveBeenCalledWith("proj-1/cot-9.pdf", expect.any(Number));
    expect(url).toBe("https://signed/url?token=abc");
  });

  it("returns null on a signing error (caller decides UX)", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: null, error: { message: "x" } });
    const supabase = { storage: { from: () => ({ createSignedUrl }) } } as never;
    expect(await getCotizacionSignedUrl(supabase, "p/c.pdf")).toBeNull();
  });
});
