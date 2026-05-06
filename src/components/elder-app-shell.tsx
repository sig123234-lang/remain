"use client";

import { ElderBottomNav } from "@/components/elder-bottom-nav";
import { ElderHeader } from "@/components/elder-header";

type ElderAppShellProps = {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  hideBottomNav?: boolean;
};

export function ElderAppShell({
  children,
  rightSlot,
  hideBottomNav = false,
}: ElderAppShellProps) {
  return (
    <main className="app-shell flex min-h-screen">
      <div className="remain-mobile-shell">
        <ElderHeader rightSlot={rightSlot} />
        <section className="remain-page">{children}</section>
        {!hideBottomNav ? <ElderBottomNav /> : null}
      </div>
    </main>
  );
}
