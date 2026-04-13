"use client";

type CatalogControlsProps = {
  search: string;
  status: string;
  sort: "title-asc" | "title-desc";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: "title-asc" | "title-desc") => void;
};

export function CatalogControls({
  search,
  status,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: CatalogControlsProps) {
  return (
    <section aria-label="Catalog controls" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm">Search</span>
        <input
          className="rounded border px-3 py-2"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title..."
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm">Status</span>
        <select className="rounded border px-3 py-2" value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm">Sort</span>
        <select
          className="rounded border px-3 py-2"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as "title-asc" | "title-desc")}
        >
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
      </label>
    </section>
  );
}
