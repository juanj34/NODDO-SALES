"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { CURRENCY_CONFIG, type Currency } from "@/lib/currency";
import { NodDoDropdown } from "@/components/ui/NodDoDropdown";
import { TrendingUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLanguage } from "@/i18n";

export function CurrencySelector() {
  const { displayCurrency, setDisplayCurrency, lastUpdated, loading } = useCurrency();
  const { locale } = useLanguage();

  const options = Object.entries(CURRENCY_CONFIG).map(([code, config]) => ({
    value: code,
    label: `${config.symbol} ${code}`,
  }));

  return (
    <div className="flex flex-col gap-1.5">
      <NodDoDropdown
        variant="site"
        size="sm"
        value={displayCurrency}
        onChange={(val) => setDisplayCurrency(val as Currency)}
        options={options}
      />

      {lastUpdated && !loading && (
        <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] px-2">
          <Clock size={9} />
          <span>
            Updated{" "}
            {formatDistanceToNow(new Date(lastUpdated), {
              addSuffix: true,
              locale: locale === "es" ? es : enUS,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
