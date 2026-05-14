import { AllocationSection } from "@/components/allocation-dashboard";
import { DashboardsShell } from "@/components/dashboards-shell";
import { FunnelSection } from "@/components/funnel-dashboard";

export default function NovosDashboardsPage() {
  return (
    <DashboardsShell>
      <AllocationSection />
      <FunnelSection />
    </DashboardsShell>
  );
}
