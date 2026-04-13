export type OperatorFormState = {
  slug: string;
  title: string;
  description: string;
  technology: "unity-webgl" | "web-native";
  thumbnailUrl: string;
  tags: string;
};

export function validateOperatorCatalogForm(form: OperatorFormState): string[] {
  const errors: string[] = [];
  if (!form.slug.trim()) errors.push("Slug is required.");
  if (!/^[a-z0-9-]+$/.test(form.slug.trim())) errors.push("Slug must contain lowercase letters, numbers, or hyphens.");
  if (form.title.trim().length < 2) errors.push("Title is required.");
  if (form.description.trim().length < 10) errors.push("Description must contain at least 10 characters.");
  if (!form.thumbnailUrl.trim()) errors.push("Thumbnail URL is required.");
  return errors;
}
