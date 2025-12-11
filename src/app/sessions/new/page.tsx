import { SessionForm } from "@/components/sessions/session-form";

export const runtime = "edge";
export const revalidate = 0;

export default function NewSessionPage() {
  return (
    <div className="space-y-6">
      <SessionForm />
    </div>
  );
}
