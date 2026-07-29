import type { Metadata } from "next";
import { BLOCK_LABELS, listBlocks } from "@/lib/content";
import { formatDate } from "@/lib/site";
import { resetBlock, saveBlock } from "@/app/admin/content/actions";

export const metadata: Metadata = {
  title: "Site copy",
  robots: { index: false, follow: false },
};

// Editable placeholder copy.
//
// Every block falls back to a hardcoded default in src/lib/content.ts, so the site
// is never blank and "still placeholder" is visible at a glance. Saving stores a
// row; resetting deletes it and restores the default.
export default async function AdminContentPage() {
  const blocks = await listBlocks();
  const remaining = blocks.filter((b) => b.isDefault).length;

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Site copy</h1>
      <p className="mt-3 max-w-2xl text-muted-fg">
        Edit the text on the homepage, About page, submit page and footer. Changes
        appear immediately, with no deploy needed.
      </p>
      <p className="mt-4 max-w-2xl rounded border border-rule bg-surface px-4 py-3 text-sm text-ink-soft">
        {remaining === 0
          ? "Every block has been given real copy."
          : `${remaining} of ${blocks.length} blocks are still showing placeholder text.`}{" "}
        Text is stored and rendered as plain text, so blank lines become paragraph
        breaks and HTML is not interpreted.
      </p>

      <div className="mt-10 space-y-12">
        {blocks.map((block) => (
          <section key={block.key} className="border-t border-rule pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-xl text-ink">
                {BLOCK_LABELS[block.key]}
              </h2>
              <span className="text-xs text-muted-fg">
                {block.isDefault ? (
                  <span className="text-state-warn">Placeholder</span>
                ) : (
                  <>
                    Edited
                    {block.updatedAt && ` · ${formatDate(block.updatedAt)}`}
                  </>
                )}
              </span>
            </div>

            <form action={saveBlock} className="mt-4">
              <input type="hidden" name="key" value={block.key} />

              <label className="block">
                <span className="text-sm font-medium text-ink">Heading</span>
                <input
                  name="title"
                  defaultValue={block.title}
                  maxLength={200}
                  className="mt-2 w-full rounded border border-rule bg-surface px-3 py-2 text-ink outline-none transition-colors focus:border-accent"
                />
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-medium text-ink">Text</span>
                <textarea
                  name="body"
                  defaultValue={block.body}
                  rows={6}
                  maxLength={8000}
                  className="mt-2 w-full rounded border border-rule bg-surface px-3 py-2 leading-relaxed text-ink outline-none transition-colors focus:border-accent"
                />
              </label>

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="submit"
                  className="cursor-pointer rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
                >
                  Save
                </button>
              </div>
            </form>

            {/* Separate form so resetting cannot accidentally submit edits from
                the form above. */}
            {!block.isDefault && (
              <form action={resetBlock} className="mt-3">
                <input type="hidden" name="key" value={block.key} />
                <button
                  type="submit"
                  className="cursor-pointer text-xs text-muted-fg underline transition-colors hover:text-state-bad"
                >
                  Reset to placeholder
                </button>
              </form>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
