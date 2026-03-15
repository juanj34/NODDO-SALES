"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useTranslation } from "@/i18n";
import { useEditorProject } from "@/hooks/useEditorProject";
import {
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  cardClass,
} from "@/components/dashboard/editor-styles";
import { PageHeader } from "@/components/dashboard/base/PageHeader";
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Shield,
  Info,
} from "lucide-react";
import { useToast } from "@/components/dashboard/Toast";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import tooltips from "@/i18n/locales/es/tooltips";

export default function DominioPage() {
  const { project, refresh, projectId } = useEditorProject();
  const { t } = useTranslation("editor");
  const toast = useToast();

  const [subdomain, setSubdomain] = useState(
    project.subdomain || project.slug
  );
  const [customDomain, setCustomDomain] = useState(
    project.custom_domain || ""
  );
  const [savingSubdomain, setSavingSubdomain] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "noddo.io";
  const isLocalhost = rootDomain.includes("localhost");
  const protocol = isLocalhost ? "http" : "https";
  const siteUrl = `${protocol}://${subdomain}.${rootDomain}`;

  const handleSaveSubdomain = async () => {
    setSavingSubdomain(true);
    try {
      const res = await fetch("/api/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          subdomain,
        }),
      });

      if (res.ok) {
        toast.success(t("dominio.toast.subdomainUpdated"));
        await refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || t("dominio.toast.subdomainError"));
      }
    } catch {
      toast.error(t("dominio.toast.connectionError"));
    }
    setSavingSubdomain(false);
  };

  const handleSaveCustomDomain = async () => {
    setSavingDomain(true);
    try {
      const res = await fetch("/api/domains", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyecto_id: projectId,
          custom_domain: customDomain || null,
        }),
      });

      if (res.ok) {
        toast.success(
          customDomain
            ? t("dominio.toast.domainSaved")
            : t("dominio.toast.domainRemoved")
        );
        await refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || t("dominio.toast.domainError"));
      }
    } catch {
      toast.error(t("dominio.toast.connectionError"));
    }
    setSavingDomain(false);
  };

  const handleVerifyDomain = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proyecto_id: projectId }),
      });

      const data = await res.json();
      if (data.verified) {
        toast.success(t("dominio.toast.domainVerified"));
        await refresh();
      } else {
        toast.info(data.message || t("dominio.toast.domainNotVerified"));
      }
    } catch {
      toast.error(t("dominio.toast.verifyError"));
    }
    setVerifying(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const subdomainChanged = subdomain !== (project.subdomain || project.slug);
  const customDomainChanged = customDomain !== (project.custom_domain || "");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <PageHeader
        icon={Globe}
        title={t("dominio.title")}
        description={t("dominio.description")}
      />

      {/* Subdomain section */}
      <div className={cardClass + " space-y-4"}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium tracking-wider text-[var(--text-primary)]">{t("dominio.subdomain.title")}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-medium">
            {t("dominio.subdomain.free")}
          </span>
        </div>

        <p className="text-xs text-[var(--text-tertiary)]">
          {t("dominio.subdomain.description")}
        </p>

        <div>
          <label className={labelClass}>{t("dominio.subdomain.label")}</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={subdomain}
                onChange={(e) =>
                  setSubdomain(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                  )
                }
                className={inputClass}
                placeholder={t("dominio.subdomain.placeholder")}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                .{rootDomain.split(":")[0]}
              </span>
            </div>
            {subdomainChanged && (
              <button
                onClick={handleSaveSubdomain}
                disabled={savingSubdomain || !subdomain}
                className={btnPrimary}
              >
                {savingSubdomain ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {t("dominio.subdomain.save")}
              </button>
            )}
          </div>
        </div>

        {/* Preview URL */}
        <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-[0.625rem] border border-[var(--border-subtle)]">
          <Globe size={14} className="text-[var(--site-primary)] flex-shrink-0" />
          <span className="text-sm text-[var(--text-secondary)] flex-1 truncate">
            {siteUrl}
          </span>
          <button
            onClick={() => copyToClipboard(siteUrl, "url")}
            className="text-[var(--text-muted)] hover:text-white transition-colors"
            title={t("dominio.subdomain.copyUrl")}
          >
            {copied === "url" ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-muted)] hover:text-white transition-colors"
            title={t("dominio.subdomain.openSite")}
          >
            <ExternalLink size={14} />
          </a>
        </div>

        {project.estado !== "publicado" && (
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-[0.625rem]">
            <AlertCircle
              size={14}
              className="text-amber-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-amber-400/80">
              {t("dominio.subdomain.stateWarning", { state: project.estado })}
            </p>
          </div>
        )}
      </div>

      {/* Custom domain section */}
      <div className={cardClass + " space-y-4"}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium tracking-wider text-[var(--text-primary)]">
            {t("dominio.custom.title")}
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)] font-medium">
            {t("dominio.custom.premium")}
          </span>
        </div>

        <p className="text-xs text-[var(--text-tertiary)]">
          {t("dominio.custom.description")}
        </p>

        <div>
          <label className={labelClass}>{t("dominio.custom.label")}</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
              className={inputClass}
              placeholder={t("dominio.custom.placeholder")}
            />
            {customDomainChanged && (
              <button
                onClick={handleSaveCustomDomain}
                disabled={savingDomain}
                className={btnPrimary}
              >
                {savingDomain ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {t("dominio.subdomain.save")}
              </button>
            )}
          </div>
        </div>

        {/* DNS Instructions */}
        {project.custom_domain && (
          <>
            {/* Verification status */}
            <div
              className={`flex items-center gap-2 p-3 rounded-[0.625rem] ${
                project.domain_verified
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              {project.domain_verified ? (
                <>
                  <Shield size={14} className="text-emerald-400" />
                  <span className="text-xs text-emerald-400">
                    {t("dominio.custom.verified")}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-amber-400" />
                  <span className="text-xs text-amber-400 flex-1">
                    {t("dominio.custom.pending")}
                  </span>
                  <button
                    onClick={handleVerifyDomain}
                    disabled={verifying}
                    className={btnSecondary}
                  >
                    {verifying ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    {t("dominio.custom.verify")}
                  </button>
                </>
              )}
            </div>

            {/* DNS records */}
            {!project.domain_verified && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-[var(--site-primary)]" />
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                    {t("dominio.custom.dnsInstruction")}
                    <InfoTooltip
                      content={tooltips.dominio.dnsRecords.long}
                      variant="dashboard"
                      placement="auto"
                    />
                  </span>
                </div>

                <div className="space-y-2">
                  {/* A Record */}
                  <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-[0.625rem] border border-[var(--border-subtle)]">
                    <div className="flex-1">
                      <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">
                        {t("dominio.custom.typeA")}
                      </p>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {t("dominio.custom.host")}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] ml-1">
                            @
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {t("dominio.custom.value")}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] ml-1">
                            76.76.21.21
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard("76.76.21.21", "a-record")
                      }
                      className="text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      {copied === "a-record" ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  {/* CNAME Record */}
                  <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-[0.625rem] border border-[var(--border-subtle)]">
                    <div className="flex-1">
                      <p className="font-ui text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">
                        {t("dominio.custom.typeCNAME")}
                      </p>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {t("dominio.custom.host")}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] ml-1">
                            www
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {t("dominio.custom.value")}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] ml-1">
                            cname.vercel-dns.com
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          "cname.vercel-dns.com",
                          "cname-record"
                        )
                      }
                      className="text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      {copied === "cname-record" ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
        <Info size={14} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-muted)] leading-relaxed space-y-1">
          <p>
            {t("dominio.info.subdomain")}
          </p>
          <p>
            {t("dominio.info.custom")}
          </p>
        </div>
      </div>
    </div>
  );
}
