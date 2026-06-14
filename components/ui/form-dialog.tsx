"use client";
import * as React from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Reusable form modal for the mockup. Stateless: the submit/cancel buttons
 * close the dialog (no persistence in Phase 1). Pass form fields as children.
 */
export function FormDialog({
  trigger, title, description, children, submitLabel = "Save",
  cancelLabel = "Cancel", destructive = false, className,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children ? <div className="grid gap-4 py-1">{children}</div> : null}
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" size="sm">{cancelLabel}</Button></DialogClose>
          <DialogClose asChild>
            <Button size="sm" variant={destructive ? "destructive" : "default"}>{submitLabel}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Confirmation modal (approve / reject / delete) — no form fields. */
export function ConfirmDialog({
  trigger, title, description, body, confirmLabel = "Confirm", destructive = false,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {body ? <div className="text-sm text-muted-foreground">{body}</div> : null}
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost" size="sm">Cancel</Button></DialogClose>
          <DialogClose asChild>
            <Button size="sm" variant={destructive ? "destructive" : "default"}>{confirmLabel}</Button>
          </DialogClose>
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
