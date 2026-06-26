import { describe, it, expect, vi, beforeEach } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

// cached-queries imports server-queries at module load, which constructs a real
// Supabase client (needs env vars). The revalidate helpers never touch it, so stub
// the module to keep this test hermetic and focused on the revalidateTag contract.
vi.mock("../server-queries", () => ({ getProyectoBySlug: vi.fn() }));

beforeEach(() => {
  revalidateTag.mockClear();
  vi.resetModules();
});

describe("cache revalidation helpers", () => {
  it("revalidateProyecto invalidates proyecto-<slug> with the chosen profile", async () => {
    const { revalidateProyecto } = await import("../cached-queries");
    await revalidateProyecto("torre-norte");
    // Branch A default. For Branch B, replace { expire: 0 } with "max".
    expect(revalidateTag).toHaveBeenCalledWith("proyecto-torre-norte", {
      expire: 0,
    });
  });

  it("revalidateAllProyectos invalidates the proyectos tag with the chosen profile", async () => {
    const { revalidateAllProyectos } = await import("../cached-queries");
    await revalidateAllProyectos();
    expect(revalidateTag).toHaveBeenCalledWith("proyectos", { expire: 0 });
  });
});
