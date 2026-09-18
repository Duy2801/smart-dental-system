"use client";

import type { ReactNode } from "react";
import { RoleLayout } from "@/src/components/layout/role-layout";
import { ROUTES } from "@/src/constants/routes";
import { SupportSocketProvider, useSupportSocketContext } from "./SupportSocketProvider";

type NavItem = { label: string; href: string };

function InnerShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const { pendingCount } = useSupportSocketContext();

  return (
    <RoleLayout
      title={title}
      items={items}
      badges={{ [ROUTES.RECEPTIONIST.SUPPORT_INBOX]: pendingCount }}
    >
      {children}
    </RoleLayout>
  );
}

/**
 * Wraps the receptionist layout with the app-wide support-chat socket
 * connection so "online for auto-assign" reflects the whole session, and
 * shows a live pending-conversations badge on the sidebar nav item.
 */
export function ReceptionistShell({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: ReactNode;
}) {
  return (
    <SupportSocketProvider>
      <InnerShell title={title} items={items}>
        {children}
      </InnerShell>
    </SupportSocketProvider>
  );
}
