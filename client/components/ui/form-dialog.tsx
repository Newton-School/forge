"use client";
import * as React from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Reusable form modal. Pass form fields (with `name`) as children. When `onSubmit`
 * is provided, the submit button runs it with the form's FormData, shows a busy
 * state + inline error, and closes only on success. Without `onSubmit` it just
 * closes (presentational).
 */
export function FormDialog({
  trigger, title, description, children, submitLabel = "Save",
  cancelLabel = "Cancel", destructive = false, className, onSubmit,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  className?: string;
  onSubmit?: (data: FormData) => Promise<void> | void;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!onSubmit) return setOpen(false);
    setBusy(true);
    setError(null);
    try {
      await onSubmit(new FormData(e.currentTarget));
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={handle}>
          {children ? <div className="grid gap-4 py-1">{children}</div> : null}
          {error ? (
            <p className="mt-3 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}
          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>{cancelLabel}</Button>
            <Button type="submit" size="sm" variant={destructive ? "destructive" : "default"} disabled={busy}>
              {busy ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confirmation modal (approve / reject / delete) — no form fields. When `onConfirm`
 * is provided it runs on confirm with a busy state + inline error and closes only on
 * success; without it the dialog just closes (presentational).
 */
export function ConfirmDialog({
  trigger, title, description, body, confirmLabel = "Confirm", destructive = false, onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm?: () => Promise<void> | void;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function confirm() {
    if (!onConfirm) return setOpen(false);
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {body ? <div className="text-sm text-muted-foreground">{body}</div> : null}
        {error ? (
          <p className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" variant={destructive ? "destructive" : "default"} disabled={busy} onClick={confirm}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Labeled field wrapper for consistent spacing inside FormDialog. */
export function Field({
  label, htmlFor, children, hint, className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
