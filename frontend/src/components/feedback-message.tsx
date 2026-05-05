"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type FeedbackVariant = "success" | "error" | "info";

const ICONS: Record<FeedbackVariant, ReactNode> = {
  success: <CheckCircle2 className="text-primary" aria-hidden />,
  error: <AlertCircle className="text-destructive" aria-hidden />,
  info: <Info className="text-muted-foreground" aria-hidden />,
};

const TITLES: Record<FeedbackVariant, string> = {
  success: "Success",
  error: "Error",
  info: "Info",
};

export function FeedbackMessage({
  message,
  variant,
}: {
  message: string;
  variant: FeedbackVariant;
}) {
  return (
    <Alert
      variant={variant === "error" ? "destructive" : "default"}
      className={cn(
        variant === "success" &&
          "border-primary/40 bg-primary/5 text-foreground [&_[data-slot=alert-description]]:text-muted-foreground",
        variant === "info" && "border-border bg-muted/40"
      )}
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {ICONS[variant]}
      <AlertTitle>{TITLES[variant]}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
