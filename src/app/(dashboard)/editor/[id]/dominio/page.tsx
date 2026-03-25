"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DominioRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/editor/${id}/config?tab=dominio`);
  }, [id, router]);

  return null;
}
