"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/tracking";
import { useTranslation } from "@/i18n";

interface WhatsAppButtonProps {
  numero: string;
  mensaje?: string;
  proyectoId?: string;
}

export function WhatsAppButton({ numero, mensaje, proyectoId }: WhatsAppButtonProps) {
  const { t } = useTranslation("site");
  const finalMessage = mensaje || t("whatsapp.defaultMessage");
  const cleanNumber = numero.replace(/[^0-9]/g, "");
  const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(finalMessage)}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (proyectoId) trackEvent(proyectoId, "whatsapp_click");
      }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring" }}
    >
      <MessageCircle size={28} className="text-white" fill="white" />
    </motion.a>
  );
}
