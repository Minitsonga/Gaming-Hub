"use client";

import { FormEvent, useState } from "react";
import { useAppPreferences } from "../../../components/app-preferences";
import { FeedbackMessage } from "../../../components/feedback-message";
import { createGame, updateGame } from "../../../lib/operator-catalog-client";
import { OperatorFormState, validateOperatorCatalogForm } from "../../../lib/operator-catalog-validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
);

const INITIAL_STATE: OperatorFormState = {
  slug: "",
  title: "",
  description: "",
  technology: "unity-webgl",
  thumbnailUrl: "",
  tags: "",
};

export default function OperatorCatalogPage() {
  const { t } = useAppPreferences();
  const [createForm, setCreateForm] = useState<OperatorFormState>(INITIAL_STATE);
  const [updateGameId, setUpdateGameId] = useState("");
  const [updateStatus, setUpdateStatus] = useState("draft");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const errors = validateOperatorCatalogForm(createForm);
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }

    try {
      await createGame({
        slug: createForm.slug.trim(),
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        technology: createForm.technology,
        thumbnailUrl: createForm.thumbnailUrl.trim(),
        tags: createForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setSuccess(t("Game created successfully.", "Jeu cree avec succes."));
      setCreateForm(INITIAL_STATE);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onUpdateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!updateGameId.trim()) {
      setError(t("Game ID is required.", "L'identifiant du jeu est requis."));
      return;
    }
    try {
      await updateGame(updateGameId.trim(), { status: updateStatus });
      setSuccess(t("Game status updated.", "Statut du jeu mis a jour."));
      setUpdateGameId("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("Operator Catalog Management", "Gestion du catalogue operateur")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("Create game", "Creer un jeu")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="slug">{t("Slug", "Slug")}</Label>
              <Input id="slug" placeholder={t("Slug", "Slug")} value={createForm.slug} onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="title">{t("Title", "Titre")}</Label>
              <Input id="title" placeholder={t("Title", "Titre")} value={createForm.title} onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="technology">{t("Technology", "Technologie")}</Label>
              <select
                id="technology"
                className={selectClass}
                value={createForm.technology}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, technology: event.target.value as "unity-webgl" | "web-native" }))
                }
              >
                <option value="unity-webgl">Unity WebGL</option>
                <option value="web-native">Web Native</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="thumbnail">{t("Thumbnail URL", "URL de miniature")}</Label>
              <Input id="thumbnail" placeholder={t("Thumbnail URL", "URL de miniature")} value={createForm.thumbnailUrl} onChange={(event) => setCreateForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))} />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="tags">{t("Tags", "Tags")}</Label>
              <Input id="tags" placeholder={t("Tags (comma separated)", "Tags (separes par des virgules)")} value={createForm.tags} onChange={(event) => setCreateForm((prev) => ({ ...prev, tags: event.target.value }))} />
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="description">{t("Description", "Description")}</Label>
              <textarea
                id="description"
                className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                rows={4}
                placeholder={t("Description", "Description")}
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <Button type="submit" className="w-fit">
              {t("Create", "Creer")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("Update game status", "Mettre a jour le statut du jeu")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUpdateStatus} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid w-full gap-1.5 sm:max-w-xs">
              <Label htmlFor="game-id">{t("Game ID", "ID du jeu")}</Label>
              <Input id="game-id" placeholder={t("Game ID", "ID du jeu")} value={updateGameId} onChange={(event) => setUpdateGameId(event.target.value)} />
            </div>
            <div className="grid w-full gap-1.5 sm:max-w-xs">
              <Label htmlFor="status">{t("Status", "Statut")}</Label>
              <select id="status" className={selectClass} value={updateStatus} onChange={(event) => setUpdateStatus(event.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <Button type="submit" className="w-fit">
              {t("Update", "Mettre a jour")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <FeedbackMessage variant="error" message={error} /> : null}
      {success ? <FeedbackMessage variant="success" message={success} /> : null}
    </main>
  );
}
