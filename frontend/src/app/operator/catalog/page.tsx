"use client";

import { FormEvent, useState } from "react";
import { FeedbackMessage } from "../../../components/feedback-message";
import { createGame, updateGame } from "../../../lib/operator-catalog-client";
import { OperatorFormState, validateOperatorCatalogForm } from "../../../lib/operator-catalog-validation";

const INITIAL_STATE: OperatorFormState = {
  slug: "",
  title: "",
  description: "",
  technology: "unity-webgl",
  thumbnailUrl: "",
  tags: "",
};

export default function OperatorCatalogPage() {
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
      setSuccess("Game created successfully.");
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
      setError("Game ID is required.");
      return;
    }
    try {
      await updateGame(updateGameId.trim(), { status: updateStatus });
      setSuccess("Game status updated.");
      setUpdateGameId("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Operator Catalog Management</h1>

      <section className="rounded border p-4">
        <h2 className="mb-3 text-lg font-medium">Create game</h2>
        <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="rounded border px-3 py-2" placeholder="Slug" value={createForm.slug} onChange={(event) => setCreateForm((prev) => ({ ...prev, slug: event.target.value }))} />
          <input className="rounded border px-3 py-2" placeholder="Title" value={createForm.title} onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))} />
          <select className="rounded border px-3 py-2" value={createForm.technology} onChange={(event) => setCreateForm((prev) => ({ ...prev, technology: event.target.value as "unity-webgl" | "web-native" }))}>
            <option value="unity-webgl">Unity WebGL</option>
            <option value="web-native">Web Native</option>
          </select>
          <input className="rounded border px-3 py-2" placeholder="Thumbnail URL" value={createForm.thumbnailUrl} onChange={(event) => setCreateForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))} />
          <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Tags (comma separated)" value={createForm.tags} onChange={(event) => setCreateForm((prev) => ({ ...prev, tags: event.target.value }))} />
          <textarea className="rounded border px-3 py-2 md:col-span-2" rows={4} placeholder="Description" value={createForm.description} onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))} />
          <button type="submit" className="w-fit rounded bg-black px-4 py-2 text-white dark:bg-zinc-200 dark:text-black">Create</button>
        </form>
      </section>

      <section className="rounded border p-4">
        <h2 className="mb-3 text-lg font-medium">Update game status</h2>
        <form onSubmit={onUpdateStatus} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input className="rounded border px-3 py-2" placeholder="Game ID" value={updateGameId} onChange={(event) => setUpdateGameId(event.target.value)} />
          <select className="rounded border px-3 py-2" value={updateStatus} onChange={(event) => setUpdateStatus(event.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <button type="submit" className="w-fit rounded bg-black px-4 py-2 text-white dark:bg-zinc-200 dark:text-black">Update</button>
        </form>
      </section>

      {error ? <FeedbackMessage variant="error" message={error} /> : null}
      {success ? <FeedbackMessage variant="success" message={success} /> : null}
    </main>
  );
}
