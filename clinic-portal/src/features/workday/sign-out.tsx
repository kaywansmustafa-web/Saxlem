"use client";

import { useState } from "react";
import type { Locale } from "@/i18n";
import { Icon } from "@/components/icons";

export function SignOutButtons({ locale, signOut, everywhere }: { locale: Locale; signOut: string; everywhere: string }) {
  const [busy, setBusy] = useState(false);
  const leave = async (all: boolean) => {
    setBusy(true);
    await fetch(all ? "/api/auth/logout-all" : "/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json", "x-saxlem-origin": "portal" },
      body: "{}",
    }).catch(() => undefined);
    window.location.replace(`/${locale}/login`);
  };
  return (
    <div className="ax-actions">
      <button className="ax-btn" disabled={busy} onClick={() => void leave(false)}>
        <Icon name="logout" size={18} />
        {signOut}
      </button>
      <button className="ax-btn ax-btn-danger" disabled={busy} onClick={() => void leave(true)}>
        <Icon name="shield" size={18} />
        {everywhere}
      </button>
    </div>
  );
}
