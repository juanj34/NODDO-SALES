"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface ContactContextValue {
  isContactOpen: boolean;
  contactPlan: string;
  contactSource: string;
  openContact: (plan?: string, source?: string) => void;
  closeContact: () => void;
}

const ContactContext = createContext<ContactContextValue | null>(null);

export function ContactProvider({ children }: { children: ReactNode }) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactPlan, setContactPlan] = useState("");
  const [contactSource, setContactSource] = useState("");

  const openContact = useCallback((plan?: string, source?: string) => {
    setContactPlan(plan || "");
    setContactSource(source || "");
    setIsContactOpen(true);
  }, []);

  const closeContact = useCallback(() => setIsContactOpen(false), []);

  return (
    <ContactContext.Provider
      value={{ isContactOpen, contactPlan, contactSource, openContact, closeContact }}
    >
      {children}
    </ContactContext.Provider>
  );
}

export function useContact(): ContactContextValue {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContact must be used within ContactProvider");
  return ctx;
}
