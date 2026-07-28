import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { SubmitForm } from "@/app/submit/_components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit a paper",
  robots: { index: false, follow: false },
};

export default async function SubmitPage() {
  // proxy.ts already redirects signed-out visitors, but that is an optimistic
  // cookie check. This is the check that actually holds.
  await requireUser();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">Submit a paper</h1>
      <p className="mt-3 text-muted-fg">
        Anyone with an account may submit. An editor reviews every submission
        before it appears on the site.
      </p>
      <SubmitForm />
    </div>
  );
}
