"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { submitPaper, type SubmitState } from "@/app/submit/actions";

const MAX_UPLOAD_MB = 10;
const MAX_ABSTRACT = 5000;
const MIN_ABSTRACT = 100;
// The counter appears once the author is close enough to the ceiling for it to
// matter; a live count from character one is noise.
const COUNTER_FROM = Math.floor(MAX_ABSTRACT * 0.8);

function SubmitButton({ blocked }: { blocked: boolean }) {
  // useFormStatus must be read from a child of the <form>, not the component that
  // renders it — that is why this is split out rather than inlined below.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || blocked}
      className="press-ink cursor-pointer rounded bg-accent px-4 py-2.5 text-sm font-medium text-surface hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Uploading…" : "Submit for review"}
    </button>
  );
}

export function SubmitForm() {
  const [state, formAction] = useActionState<SubmitState, FormData>(submitPaper, {});
  const [fileError, setFileError] = useState<string | null>(null);
  const [abstractLength, setAbstractLength] = useState(0);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const dirty = useRef(false);

  // A server-side error renders above the fields; the author who just pressed
  // the button at the bottom of a long form must be brought to it.
  useEffect(() => {
    if (state.error) {
      errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [state]);

  // Leave-guard: a full abstract is real work. Only tab close and refresh are
  // guarded — the post-submit redirect is a client-side navigation and never
  // triggers beforeunload, so a successful submission is not nagged.
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
      // Catching this here saves the author a full doomed upload; the server
      // enforces the same limit authoritatively.
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
      className="mt-10 border-t border-rule pt-10"
    >
      {state.error && (
        // role=alert announces the failure to assistive tech the moment it
        // renders; the effect above brings it on screen for everyone else.
        <p
          ref={errorRef}
          role="alert"
          className="mb-8 rounded border border-state-bad/40 px-4 py-3 text-sm text-state-bad"
        >
          {state.error} Your text is safe below; please re-attach the PDF
          before submitting again.
        </p>
      )}

      <div className="space-y-8">
        <label className="block">
          <span className="text-sm font-medium text-ink">Title</span>
          <input
            name="title"
            required
            maxLength={300}
            defaultValue={state.values?.title}
            className="mt-2 w-full rounded border border-field bg-surface px-3 py-2 text-ink outline-none transition-colors focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Authors</span>
          <span id="authors-hint" className="mt-1 block text-xs text-muted-fg">
            Separated by commas. Co-authors do not need accounts to be credited.
          </span>
          <input
            name="authorLine"
            required
            maxLength={300}
            placeholder="A. Karimova, R. Patel"
            defaultValue={state.values?.authorLine}
            aria-describedby="authors-hint"
            className="mt-2 w-full rounded border border-field bg-surface px-3 py-2 text-ink outline-none transition-colors placeholder:text-muted-fg focus:border-accent"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Abstract</span>
          <span id="abstract-hint" className="mt-1 block text-xs text-muted-fg">
            Public and indexed by search engines. The PDF is not, which makes
            the abstract the only part of your paper that search can find, so
            write it to stand alone. At least {MIN_ABSTRACT} characters.
          </span>
          <textarea
            name="abstract"
            required
            rows={10}
            minLength={MIN_ABSTRACT}
            maxLength={MAX_ABSTRACT}
            defaultValue={state.values?.abstract}
            aria-describedby="abstract-hint"
            onChange={(event) => setAbstractLength(event.currentTarget.value.length)}
            className="mt-2 w-full rounded border border-field bg-surface px-3 py-2 leading-relaxed text-ink outline-none transition-colors focus:border-accent"
          />
          {abstractLength >= COUNTER_FROM && (
            // The textarea clips silently at maxLength (a long paste just
            // truncates); the counter makes the ceiling visible before it bites.
            <span className="mt-1.5 block text-right text-xs text-muted-fg">
              {abstractLength.toLocaleString("en-GB")} /{" "}
              {MAX_ABSTRACT.toLocaleString("en-GB")}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">Paper (PDF)</span>
          <span id="file-hint" className="mt-1 block text-xs text-muted-fg">
            Up to {MAX_UPLOAD_MB} MB. Readers must sign in to download it.
          </span>
          {/* accept= filters the picker for convenience only; the server checks
              the actual leading bytes, since this attribute is trivially bypassed. */}
          <input
            type="file"
            name="file"
            required
            accept="application/pdf,.pdf"
            onChange={checkFile}
            aria-describedby={fileError ? "file-error" : "file-hint"}
            aria-invalid={fileError ? true : undefined}
            className="mt-2 block w-full text-sm text-muted-fg file:mr-4 file:cursor-pointer file:rounded file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent"
          />
          {fileError && (
            <span
              id="file-error"
              role="alert"
              className="mt-2 block text-sm text-state-bad"
            >
              {fileError}
            </span>
          )}
        </label>
      </div>

      <div className="mt-10">
        {/* The one rights sentence, at the commit point. Kept to a factual
            confirmation; anything grander is the editors' call, not the
            form's. */}
        <p className="mb-3 max-w-md text-xs leading-relaxed text-muted-fg">
          By submitting you confirm the work is yours to publish here.
        </p>
        <SubmitButton blocked={fileError !== null} />
        <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-fg">
          An editor reads every submission, and you will be emailed when a
          decision is made. You can follow its progress under{" "}
          <Link
            href="/submissions"
            className="text-accent transition-colors hover:text-accent-dark"
          >
            My submissions
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
