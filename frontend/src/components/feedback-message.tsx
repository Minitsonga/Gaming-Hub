"use client";

type FeedbackVariant = "success" | "error" | "info";

const STYLE_BY_VARIANT: Record<FeedbackVariant, string> = {
  success: "border-green-600 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100",
  error: "border-red-600 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100",
  info: "border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
};

const PREFIX_BY_VARIANT: Record<FeedbackVariant, string> = {
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
    <p
      className={`mt-4 rounded border px-3 py-2 text-sm ${STYLE_BY_VARIANT[variant]}`}
      role={variant === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <strong>{PREFIX_BY_VARIANT[variant]}:</strong> {message}
    </p>
  );
}
