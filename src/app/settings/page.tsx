import { getSettings } from "@/lib/db";
import { getActiveTranches, getLastSessionDate } from "@/lib/db/queries";
import { DisclaimerBanner } from "@/components/Disclaimer";
import { SettingsForm } from "@/components/SettingsForm";
import { SessionStamp } from "@/components/SessionStamp";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settings = getSettings();
  const sessionDate = getLastSessionDate();
  const tranches = getActiveTranches().map((t) => ({
    isin: t.isin,
    tranche_code: t.tranche_code,
  }));

  return (
    <div className="pt-8">
      <h1 className="font-display text-4xl tracking-tight mb-2">Settings</h1>
      <p className="muted mb-4 max-w-2xl">
        All rates and CAGR scenarios are explicit user inputs. Defaults are
        starting points, not recommendations.
      </p>
      <SessionStamp sessionDate={sessionDate} />
      <div className="mt-4">
        <DisclaimerBanner />
      </div>
      <SettingsForm settings={settings} tranches={tranches} />
    </div>
  );
}
