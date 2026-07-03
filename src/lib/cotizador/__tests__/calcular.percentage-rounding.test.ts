import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import type { CotizadorConfig } from "@/types";

describe("calcularCotizacion — percentage rounding regression", () => {
  it("a 70% cuota inicial split into 3 cuotas (fed through as tipo:\"fijo\", mirroring the " +
    "paymentRowsToFases pipeline) displays percentages that reconcile to 70, not 69", () => {
    const total = 300_000_000;

    // Mirrors payment-rows.ts's expansion of a single 70%/3-cuotas fase into three
    // individual rows (23.33 / 23.33 / 23.34), then paymentRowsToFases() converting
    // every row into a tipo:"fijo" FaseConfig with the money already resolved.
    const config: CotizadorConfig = {
      moneda: "COP",
      separacion_incluida_en_inicial: false,
      descuentos: [],
      notas_legales: null,
      fases: [
        { id: "c1", nombre: "Cuota 1", tipo: "fijo", valor: Math.round(total * (23.33 / 100)), cuotas: 1, frecuencia: "unica" },
        { id: "c2", nombre: "Cuota 2", tipo: "fijo", valor: Math.round(total * (23.33 / 100)), cuotas: 1, frecuencia: "unica" },
        { id: "c3", nombre: "Cuota 3", tipo: "fijo", valor: Math.round(total * (23.34 / 100)), cuotas: 1, frecuencia: "unica" },
        { id: "f4", nombre: "Saldo a la entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ],
    };

    const resultado = calcularCotizacion(total, config);

    // Money is untouched by the bug — the three cuotas + resto must still add up to the total.
    const montoSum = resultado.fases.reduce((s, f) => s + f.monto_total, 0);
    expect(montoSum).toBe(total);

    // The bug: each row's displayed % was Math.round independently, so 23.33/23.33/23.34
    // each rounded down to 23, showing 69% instead of 70% for the cuota inicial block.
    const initialPct =
      (resultado.fases[0].porcentaje ?? 0) +
      (resultado.fases[1].porcentaje ?? 0) +
      (resultado.fases[2].porcentaje ?? 0);
    expect(initialPct).toBe(70);

    // All displayed percentages together must reconcile to 100, never 99 or 101.
    const pctSum = resultado.fases.reduce((s, f) => s + (f.porcentaje ?? 0), 0);
    expect(pctSum).toBe(100);
  });
});
