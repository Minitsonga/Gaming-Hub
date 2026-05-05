"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2">
          {choices.map((choice) => (
            <Button
              key={choice}
              type="button"
              variant="outline"
              className="h-auto justify-start py-2 text-left"
              onClick={() => onSelect(choice)}
            >
              {choice}
            </Button>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
