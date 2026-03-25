"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CorreosRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/editor/${id}/config?tab=correos`);
  }, [id, router]);

  return null;
}
