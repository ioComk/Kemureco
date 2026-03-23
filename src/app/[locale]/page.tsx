import { HomeDashboard } from "@/components/home/home-dashboard";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  return (
    <div className="space-y-8">
      <HomeDashboard />
    </div>
  );
}
