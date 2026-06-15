"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/form-dialog";
import { submit } from "@/lib/api";

/** Marks every notification read → POST /notifications/read-all. Presentation-safe. */
export function MarkAllReadButton() {
  const router = useRouter();
  return (
    <ConfirmDialog
      trigger={<Button size="sm" variant="outline">Mark all read</Button>}
      title="Mark all as read?"
      confirmLabel="Mark all read"
      onConfirm={async () => {
        await submit("/notifications/read-all", "POST");
        router.refresh();
      }}
    />
  );
}
