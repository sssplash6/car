"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { submitPaper, type SubmitState } from "@/app/submit/actions";
import { COPY } from "@/lib/content";
import { PendingButton } from "@/app/_components/PendingButton";
import { Notice } from "@/app/_components/ui/Feedback";
import { Field, Input, Textarea } from "@/app/_components/ui/Field";
import { FileDrop } from "@/app/_components/ui/FileDrop";

const MAX_UPLOAD_MB = 10;
const MAX_ABSTRACT = 5000;
const MIN_ABSTRACT = 100;
// The counter appears once the author is close enough to the ceiling for it to
// matter; a live count from character one is noise.
const COUNTER_FROM = Math.floor(MAX_ABSTRACT * 0.8);

export function SubmitForm({ art }: { art?: ReactNode }) {
  const [state, formAction] = useActionState<SubmitState, FormData>(submitPaper, {});
  const [fileError, setFileError] = useState<string | null>(null);
  const [abstractLength, setAbstractLength] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const copy = COPY.submit;

  // A server-side error renders above the fields; the author who just pressed
  // the button at the bottom of a long form must be brought to it.
  useEffect(() => {
    if (state.error) errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state]);

  // Leave-guard: a full abstract is real work. Only tab close and refresh are
  // guarded; the post-submit redirect is a client navigation and never
  // triggers beforeunload.
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (dirty.current) event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function checkFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file && file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      // Saves the author a doomed upload; the server enforces the same limit.
      setFileError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_UPLOAD_MB} MB.`,
      );
    } else {
      setFileError(null);
    }
  }

  return (
    <form
      action={formAction}
      onInput={() => {
        dirty.current = true;
      }}
      className="card-bordered card-overlay"
    >
      {state.error && (
        <div ref={errorRef} className="mb-8">
          <Notice tone="bad">
            {state.error} Your text is safe below; please re-attach the PDF before submitting
            again.
          </Notice>
        </div>
      )}

      <Field id="paper-title" label="Title">
        <Input name="title" required maxLength={300} defaultValue={state.values?.title} />
      </Field>

      <Field
        id="paper-authors"
        label="Authors"
        hint="As they should be cited, separated by commas. Co-authors need no account."
      >
        <Input
          name="authorLine"
          required
          maxLength={300}
          placeholder="S. Ito, K. Mamatov"
          defaultValue={state.values?.authorLine}
        />
      </Field>

      <Field
        id="paper-abstract"
        label="Abstract"
        hint={`Public and read by search engines, so it should state the question, the method and the finding. At least ${MIN_ABSTRACT} characters.`}
      >
        <Textarea
          name="abstract"
          required
          rows={10}
          minLength={MIN_ABSTRACT}
          maxLength={MAX_ABSTRACT}
          defaultValue={state.values?.abstract}
          onChange={(event) => setAbstractLength(event.currentTarget.value.length)}
        />
      </Field>
      {abstractLength >= COUNTER_FROM && (
        // The textarea clips silently at maxLength; the counter makes the
        // ceiling visible before it bites.
        <span className="counter" aria-live="polite">
          {abstractLength.toLocaleString("en-GB")} / {MAX_ABSTRACT.toLocaleString("en-GB")}
        </span>
      )}

      <Field id="paper-file" label="Paper (PDF)" error={fileError}>
        {/* accept= filters the picker only; the server checks the file's
            actual leading bytes. */}
        <FileDrop
          name="file"
          required
          accept="application/pdf,.pdf"
          hint={copy.fileHint}
          art={art}
          onChange={checkFile}
        />
      </Field>

      <div className="mt-10 border-t border-rule pt-8">
        <p className="t-ui-sm mb-4 text-ink-3">
          By submitting you confirm the work is yours to publish here.
        </p>
        <PendingButton size="lg" pendingLabel={copy.pending} disabled={fileError !== null}>
          {copy.action}
        </PendingButton>
        <p className="t-ui-sm mt-4 text-ink-3">
          Follow its progress under{" "}
          <Link href="/submissions" className="prose-link">
            My submissions
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
