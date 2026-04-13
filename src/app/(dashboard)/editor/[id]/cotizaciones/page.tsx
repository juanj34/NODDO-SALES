"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CotizacionesRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/editor/${id}/cotizador`);
  }, [id, router]);

  return null;
}
