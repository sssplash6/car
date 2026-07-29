import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { getBlock } from "@/lib/content";
import { SubmitForm } from "@/app/submit/_components/SubmitForm";
import { PageShell } from "@/app/_components/PageShell";

export const metadata: Metadata = {
  title: "Submit a paper",
  robots: { index: false, follow: false },
};

export default async function SubmitPage() {
  // proxy.ts already redirects signed-out visitors, but that is an optimistic
  // cookie check. This is the check that actually holds.
  await requireUser();

  const intro = await getBlock("submit.intro");

  return (
    <PageShell>
      <h1 className="font-serif text-4xl text-ink">{intro.title}</h1>
      <p className="prose-plain mt-3 leading-relaxed text-ink-soft">
        {intro.body}
      </p>
      <SubmitForm />
    </PageShell>
  );
}
