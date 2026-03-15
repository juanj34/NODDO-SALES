"use client";

import { PageHeader } from "@/components/dashboard/base/PageHeader";
import {
  Settings,
  ImageIcon,
  MapPin,
  Building2,
  Video,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

/**
 * TEST PAGE - Component Visual Validation
 *
 * Esta página NO está en producción. Se usa para validar visualmente
 * que los componentes nuevos se ven EXACTOS al código original.
 *
 * Para comparar:
 * 1. Abrir localhost:3000/test-components (esta página)
 * 2. Abrir localhost:3000/editor/[project-id]/config (original)
 * 3. Tomar screenshots lado a lado
 * 4. Comparar pixel-perfect en Photoshop/Figma
 *
 * Si hay 1px de diferencia → ajustar componente hasta perfecto
 */

export default function TestComponentsPage() {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      {/* Page Title */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-heading font-light text-white mb-2">
          🧪 Component Testing Lab
        </h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          Visual validation page - NOT in production
        </p>
      </div>

      {/* Section: PageHeader Component */}
      <div className="space-y-8">
        <div className="border-t border-[var(--border-subtle)] pt-8">
          <h2 className="text-xl font-heading font-light text-white mb-1">
            PageHeader Component
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Compare estos ejemplos con las páginas originales del editor
          </p>

          {/* Test Case 1: Config Page (Original Reference) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-12 p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-4">
              Test 1: Config Page Pattern
            </div>
            <PageHeader
              icon={Settings}
              title="Configuración"
              description="Personaliza los ajustes generales de tu proyecto"
            />
            <div className="mt-4 text-xs text-green-400">
              ✓ Compare con: /editor/[id]/config
            </div>
          </motion.div>

          {/* Test Case 2: Galería Page */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto mb-12 p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-4">
              Test 2: Galería Page Pattern
            </div>
            <PageHeader
              icon={ImageIcon}
              title="Galería"
              description="Administra las imágenes de tu proyecto"
            />
            <div className="mt-4 text-xs text-green-400">
              ✓ Compare con: /editor/[id]/galeria
            </div>
          </motion.div>

          {/* Test Case 3: Ubicación Page */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto mb-12 p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-4">
              Test 3: Ubicación Page Pattern
            </div>
            <PageHeader
              icon={MapPin}
              title="Ubicación"
              description="Define la ubicación y puntos de interés"
            />
            <div className="mt-4 text-xs text-green-400">
              ✓ Compare con: /editor/[id]/ubicacion
            </div>
          </motion.div>

          {/* Test Case 4: With Actions (Optional Prop) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto mb-12 p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-4">
              Test 4: With Optional Actions
            </div>
            <PageHeader
              icon={Building2}
              title="General"
              description="Información básica del proyecto"
              actions={
                <button className="px-4 py-2 bg-[var(--site-primary)] text-[#141414] rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all">
                  Acción
                </button>
              }
            />
            <div className="mt-4 text-xs text-amber-400">
              ⚠ Test con prop opcional `actions`
            </div>
          </motion.div>

          {/* Test Case 5: No Description */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto mb-12 p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-4">
              Test 5: Without Description (Optional)
            </div>
            <PageHeader
              icon={Video}
              title="Videos"
            />
            <div className="mt-4 text-xs text-amber-400">
              ⚠ Test sin descripción (prop opcional)
            </div>
          </motion.div>

          {/* Test Case 6: Multiple Icons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-4xl mx-auto p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-4">
              Test 6: Different Icons
            </div>
            <div className="space-y-4">
              <PageHeader
                icon={FileText}
                title="Brochure"
                description="Documento descargable del proyecto"
              />
            </div>
            <div className="mt-4 text-xs text-green-400">
              ✓ Varios iconos para validar consistencia
            </div>
          </motion.div>
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="mt-12 p-6 rounded-xl bg-[var(--surface-2)] border border-[var(--border-default)]">
        <h3 className="text-lg font-heading font-light text-white mb-4">
          📋 Validation Checklist
        </h3>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          <div className="flex items-start gap-2">
            <span className="text-[var(--site-primary)]">□</span>
            <span>Icon circle: 40x40px, rounded-xl, surface-2 bg, border-subtle</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--site-primary)]">□</span>
            <span>Icon size: 18px, gold color (var(--site-primary))</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--site-primary)]">□</span>
            <span>Title: pageTitle class (font-heading, text-2xl, font-light)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--site-primary)]">□</span>
            <span>Description: pageDescription class (text-sm, text-tertiary)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--site-primary)]">□</span>
            <span>Spacing: gap-3 between icon and text</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--site-primary)]">□</span>
            <span>Responsive: works on mobile, tablet, desktop</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[var(--site-primary)]">□</span>
            <span>Pixel-perfect: screenshot comparison with original = 0px difference</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">
          ⚠️ Next Steps
        </h3>
        <ol className="space-y-2 text-sm text-[var(--text-secondary)] list-decimal list-inside">
          <li>Open this page and config page side-by-side</li>
          <li>Take screenshots of both</li>
          <li>Compare in Photoshop/Figma (overlay mode)</li>
          <li>If pixel-perfect → proceed to feature flag implementation</li>
          <li>If any difference → adjust PageHeader component until perfect</li>
        </ol>
      </div>
    </div>
  );
}
