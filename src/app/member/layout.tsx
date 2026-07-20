import { ReactNode } from "react";
import { MemberRouteShell } from "@/components/layout/MemberRouteShell";

export default function MemberLayout({ children }: { children: ReactNode }) {
  return <MemberRouteShell>{children}</MemberRouteShell>;
}
