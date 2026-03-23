import { SessionsDashboard } from "@/components/sessions/sessions-dashboard";

export const runtime = "edge";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <SessionsDashboard />
    </div>
  );
}
