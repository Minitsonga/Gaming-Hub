export type DecisionOverlayEvent = {
  type: "DECISION_OVERLAY";
  payload: {
    title: string;
    description: string;
    choices: string[];
  };
};

export function isDecisionOverlayEvent(value: unknown): value is DecisionOverlayEvent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { type?: string; payload?: { choices?: unknown } };
  return candidate.type === "DECISION_OVERLAY" && Array.isArray(candidate.payload?.choices);
}
