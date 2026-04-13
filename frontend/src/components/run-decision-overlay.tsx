"use client";

type RunDecisionOverlayProps = {
  title: string;
  description: string;
  choices: string[];
  onSelect: (choice: string) => void;
  onClose: () => void;
};

export function RunDecisionOverlay({ title, description, choices, onSelect, onClose }: RunDecisionOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Run decision overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-xl rounded-lg bg-white p-5 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className="rounded border px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => onSelect(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
        <button type="button" className="mt-4 rounded border px-3 py-1" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
