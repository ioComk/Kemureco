"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingRecordButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button asChild size="lg" className="rounded-full shadow-lg gap-2">
        <Link href="/sessions/new">
          <PlusCircle size={20} weight="bold" />
          記録する
        </Link>
      </Button>
    </div>
  );
}

export default FloatingRecordButton;
