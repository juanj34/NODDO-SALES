"use client";

import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { LeadForm } from "@/components/site/LeadForm";
import { Mail } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";

export default function ContactoPage() {
  const proyecto = useSiteProject();

  return (
    <SectionTransition className="h-screen flex items-center justify-center px-8 lg:px-16">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Mail size={20} className="text-[var(--site-primary)]" />
            <p className="text-xs tracking-[0.4em] text-[var(--site-primary)] uppercase">
              Contacto
            </p>
          </div>
          <h2 className="text-2xl font-light tracking-wider mb-2">
            ¿Te interesa {proyecto.nombre}?
          </h2>
          <p className="text-white/40 text-sm">
            Déjanos tus datos y un asesor se pondrá en contacto contigo.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <LeadForm
            proyectoId={proyecto.id}
            tipologias={proyecto.tipologias}
          />
        </motion.div>
      </div>
    </SectionTransition>
  );
}
