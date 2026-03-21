"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { LeadFormMultiStep as LeadForm } from "@/components/site/LeadFormMultiStep";
import { Clock, ShieldCheck, UserCheck } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { useTranslation } from "@/i18n";

export default function ContactoPage() {
  const proyecto = useSiteProject();
  const { t } = useTranslation("site");
  const [selectedTipologia, setSelectedTipologia] = useState("");

  const valueProps = [
    {
      icon: Clock,
      title: t("contacto.valueProp1Title"),
      desc: t("contacto.valueProp1Desc"),
    },
    {
      icon: ShieldCheck,
      title: t("contacto.valueProp2Title"),
      desc: t("contacto.valueProp2Desc"),
    },
    {
      icon: UserCheck,
      title: t("contacto.valueProp3Title"),
      desc: t("contacto.valueProp3Desc"),
    },
  ];

  return (
    <SectionTransition className="relative min-h-screen flex items-center justify-center px-6 lg:px-16 py-20 overflow-hidden">
      {/* Blurred background image */}
      {proyecto.render_principal_url && (
        <div className="absolute inset-0 z-0">
          <Image src={proyecto.render_principal_url} alt="undefined" fill className="w-full h-full object-cover blur-sm scale-105" />
          <div className="absolute inset-0 bg-[var(--site-bg)]/85" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left panel — Value proposition */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col gap-8"
        >
          {/* Section label + heading */}
          <div>
            <p className="text-[10px] tracking-[0.4em] text-[var(--site-primary)] uppercase font-ui mb-4">
              {t("contacto.sectionLabel")}
            </p>
            <h2 className="font-site-heading text-[clamp(32px,4vw,48px)] font-light leading-[1.15] tracking-wider text-white mb-3">
              {t("contacto.heading", { name: proyecto.nombre })}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
              {t("contacto.description")}
            </p>
          </div>

          {/* Value propositions */}
          <div className="flex flex-col gap-5">
            {valueProps.map((vp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[rgba(var(--site-primary-rgb),0.1)] border border-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center">
                  <vp.icon size={18} className="text-[var(--site-primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-0.5">
                    {vp.title}
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                    {vp.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tipología chips (desktop) */}
          {proyecto.tipologias.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="hidden lg:block"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] font-ui mb-3">
                {t("tipologias.features")}
              </p>
              <div className="flex flex-wrap gap-2">
                {proyecto.tipologias.map((tip) => (
                  <button
                    key={tip.id}
                    onClick={() =>
                      setSelectedTipologia(
                        selectedTipologia === tip.nombre ? "" : tip.nombre
                      )
                    }
                    className={`text-xs font-ui tracking-wider px-3.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedTipologia === tip.nombre
                        ? "bg-[rgba(var(--site-primary-rgb),0.15)] border-[rgba(var(--site-primary-rgb),0.4)] text-[var(--site-primary)]"
                        : "bg-white/3 border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[rgba(var(--site-primary-rgb),0.25)] hover:text-[var(--site-primary)]"
                    }`}
                  >
                    {tip.nombre}
                    {tip.area_m2 ? ` · ${tip.area_m2} m²` : ""}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Right panel — Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <LeadForm
            proyectoId={proyecto.id}
            tipologias={proyecto.tipologias}
            preselectedTipologia={selectedTipologia}
            projectName={proyecto.nombre}
            variant="page"
            privacyPolicyUrl={proyecto.politica_privacidad_url}
          />
        </motion.div>
      </div>
    </SectionTransition>
  );
}
