import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "サインイン | Kemureco",
  description: "Kemureco へのサインインページ"
};

export default function AuthPage() {
  return (
    <div className="py-10">
      <AuthScreen />
    </div>
  );
}
