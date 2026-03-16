import { z } from "zod";

/**
 * Schemas de validación para formularios críticos de NODDO
 * Previene datos inválidos en la base de datos
 *
 * NOTE: Use .nullish() (= .nullable().optional()) for fields that can be
 * null from the DB or from `value || null` coercion in forms.
 */

// ═══════════════════════════════════════════════════════════
// PROYECTO SCHEMAS
// ═══════════════════════════════════════════════════════════

export const proyectoGeneralSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre debe tener máximo 100 caracteres"),

  slug: z
    .string()
    .min(1, "El slug es obligatorio")
    .max(50, "El slug debe tener máximo 50 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo puede contener letras minúsculas, números y guiones"
    ),

  descripcion: z.string().max(500, "La descripción debe tener máximo 500 caracteres").nullish(),

  whatsapp_numero: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Formato de WhatsApp inválido. Debe ser E.164 (ej: +573001234567)"
    )
    .nullish()
    .or(z.literal("")),
});

export const proyectoUbicacionSchema = z.object({
  ubicacion_lat: z
    .number()
    .min(-90, "Latitud debe estar entre -90 y 90")
    .max(90, "Latitud debe estar entre -90 y 90")
    .nullish(),

  ubicacion_lng: z
    .number()
    .min(-180, "Longitud debe estar entre -180 y 180")
    .max(180, "Longitud debe estar entre -180 y 180")
    .nullish(),

  ubicacion_direccion: z.string().max(200).nullish(),
});

// ═══════════════════════════════════════════════════════════
// TIPOLOGÍA SCHEMAS
// ═══════════════════════════════════════════════════════════

export const tipologiaSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre debe tener máximo 50 caracteres"),

  area_m2: z
    .number()
    .positive("El área debe ser positiva")
    .max(10000, "El área parece demasiado grande")
    .multipleOf(0.01, "El área puede tener máximo 2 decimales")
    .nullish(),

  habitaciones: z
    .number()
    .int("Las habitaciones deben ser un número entero")
    .min(0, "No puede tener habitaciones negativas")
    .max(20, "Máximo 20 habitaciones")
    .nullish(),

  banos: z
    .number()
    .int("Los baños deben ser un número entero")
    .min(0, "No puede tener baños negativos")
    .max(20, "Máximo 20 baños")
    .nullish(),

  parqueaderos: z
    .number()
    .int("Los garajes deben ser un número entero")
    .min(0, "No puede tener garajes negativos")
    .max(10, "Máximo 10 garajes")
    .nullish(),

  precio_desde: z
    .number()
    .positive("El precio debe ser positivo")
    .max(999999999999, "El precio es demasiado alto")
    .nullish(),
});

// ═══════════════════════════════════════════════════════════
// POI SCHEMAS (Puntos de Interés)
// ═══════════════════════════════════════════════════════════

export const poiSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(100),

  lat: z
    .number()
    .min(-90, "Latitud inválida")
    .max(90, "Latitud inválida"),

  lng: z
    .number()
    .min(-180, "Longitud inválida")
    .max(180, "Longitud inválida"),

  categoria: z.enum([
    "comercio",
    "educacion",
    "salud",
    "transporte",
    "entretenimiento",
    "servicios",
  ]),

  distancia_km: z
    .number()
    .positive("La distancia debe ser positiva")
    .max(1000, "Distancia máxima 1000 km")
    .nullish(),

  tiempo_minutos: z
    .number()
    .int("El tiempo debe ser un número entero")
    .positive("El tiempo debe ser positivo")
    .max(600, "Tiempo máximo 600 minutos")
    .nullish(),
});

// ═══════════════════════════════════════════════════════════
// LEAD SCHEMAS
// ═══════════════════════════════════════════════════════════

export const leadFormSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),

  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email demasiado largo"),

  telefono: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Teléfono inválido. Usar formato internacional (ej: +573001234567)"
    )
    .nullish()
    .or(z.literal("")),

  mensaje: z
    .string()
    .max(1000, "El mensaje debe tener máximo 1000 caracteres")
    .nullish(),

  tipologia_interes: z.string().uuid("ID de tipología inválido").nullish(),

  presupuesto: z
    .number()
    .positive("El presupuesto debe ser positivo")
    .nullish(),
});

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Valida y retorna errores formateados
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}

/**
 * Hook para validar forms en tiempo real
 */
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (data: unknown) => validateSchema(schema, data),
    validateField: (fieldName: string, value: unknown) => {
      try {
        // Valida solo un campo
        const shapeSchema = schema as unknown as { shape?: Record<string, { parse: (value: unknown) => unknown }> };
        const fieldSchema = shapeSchema.shape?.[fieldName];
        if (!fieldSchema) return { valid: true };

        fieldSchema.parse(value);
        return { valid: true, error: null };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { valid: false, error: error.issues[0]?.message };
        }
        return { valid: false, error: "Error de validación" };
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════
// TYPES EXPORTADOS
// ═══════════════════════════════════════════════════════════

export type ProyectoGeneralInput = z.infer<typeof proyectoGeneralSchema>;
export type ProyectoUbicacionInput = z.infer<typeof proyectoUbicacionSchema>;
export type TipologiaInput = z.infer<typeof tipologiaSchema>;
export type POIInput = z.infer<typeof poiSchema>;
export type LeadFormInput = z.infer<typeof leadFormSchema>;
