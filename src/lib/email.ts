import "server-only";

import { prisma } from "@/lib/prisma";
import { SITE_NAME, siteUrl } from "@/lib/site";

// Decision and submission emails, sent through Resend's HTTP API.
//
// Deliberately no SDK — calc/server/verify.js talks to the same API with plain
// fetch and that has been reliable, so this keeps the dependency count at zero
// and the failure modes identical across the workspace.
//
// Every attempt is recorded in EmailLog, including the dev-mode skip. Without
// that, a delivery failure would only ever appear in server logs nobody reads,
// since callers treat sending as best-effort.

const RESEND_API_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10_000; // Resend is usually <1s; this only catches hangs
const MAX_LOGGED_ERROR = 1000; // provider errors can be long HTML pages

type SendResult = { status: "SENT" | "FAILED" | "SKIPPED"; error?: string };

/**
 * Send one email and record the attempt.
 *
 * Never throws: a mail failure must not roll back the decision that triggered it.
 * The return value is for callers that want to react; most ignore it and rely on
 * the EmailLog row plus the in-app notification.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  paperId?: string;
}): Promise<SendResult> {
  const result = await deliver(opts.to, opts.subject, opts.html);

  try {
    await prisma.emailLog.create({
      data: {
        recipient: opts.to,
        subject: opts.subject,
        status: result.status,
        error: result.error?.slice(0, MAX_LOGGED_ERROR),
        paperId: opts.paperId,
      },
    });
  } catch (err) {
    // Logging the log failure is all we can do — still must not throw.
    console.error("[email] could not write EmailLog:", err);
  }

  return result;
}

async function deliver(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY) {
    // Dev fallback: no mail account configured. Log so the flow stays fully
    // testable locally, and record it as SKIPPED rather than SENT so the admin
    // email log does not claim a delivery that never happened.
    console.log(`[email] (dev — RESEND_API_KEY unset) to ${to}: ${subject}`);
    return { status: "SKIPPED" };
  }

  // The resend.dev fallback exists for local testing only. In production an
  // unset MAIL_FROM must fail loudly into the email log rather than quietly
  // sending a scholarly review's decisions from onboarding@resend.dev.
  const from = process.env.MAIL_FROM || `${SITE_NAME} <onboarding@resend.dev>`;
  if (!process.env.MAIL_FROM && process.env.NODE_ENV === "production") {
    return {
      status: "FAILED",
      error: "MAIL_FROM is unset; refusing the resend.dev fallback in production.",
    };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { status: "FAILED", error: `Resend ${res.status}: ${body}` };
    }
    return { status: "SENT" };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Email service timed out"
        : err instanceof Error
          ? err.message
          : String(err);
    return { status: "FAILED", error: message };
  } finally {
    clearTimeout(timer);
  }
}

/** Tell an author their paper was published or returned for revision. */
export async function notifyDecision(opts: {
  to: string | null;
  paperId: string;
  title: string;
  published: boolean;
  slug: string;
  reviewNote?: string | null;
}): Promise<void> {
  if (!opts.to) return; // Google always gives us an email, but the column is nullable

  const subject = opts.published
    ? `Your paper "${opts.title}" is published`
    : `Your paper "${opts.title}" needs revision`;

  const body = opts.published
    ? `<p>Your paper <strong>${escapeHtml(opts.title)}</strong> is now published.</p>
       <p><a href="${siteUrl()}/p/${opts.slug}">Read it here</a></p>`
    : `<p>Your paper <strong>${escapeHtml(opts.title)}</strong> was reviewed and needs revision before publication.</p>
       ${opts.reviewNote ? `<p><strong>Note from the editor:</strong> ${escapeHtml(opts.reviewNote)}</p>` : ""}
       <p>When you have revised it, submit the new version and it will rejoin the queue.</p>
       <p><a href="${siteUrl()}/submissions">View your submissions</a></p>`;

  await sendEmail({
    to: opts.to,
    subject,
    html: wrap(body),
    paperId: opts.paperId,
  });
}

/** Tell the editors a paper is waiting. One email per admin. */
export async function notifyEditorsOfSubmission(opts: {
  to: string[];
  paperId: string;
  title: string;
  authorLine: string;
}): Promise<void> {
  const subject = `New submission: ${opts.title}`;
  const html = wrap(
    `<p>A new paper is waiting for review.</p>
     <p><strong>${escapeHtml(opts.title)}</strong><br/>${escapeHtml(opts.authorLine)}</p>
     <p><a href="${siteUrl()}/admin/queue">Open the review queue</a></p>`,
  );

  // Sequential rather than Promise.all: this runs inside a user-facing submit
  // action, and a handful of editors is not worth the concurrency. Each send
  // logs itself and cannot throw.
  for (const to of opts.to) {
    await sendEmail({ to, subject, html, paperId: opts.paperId });
  }
}

function wrap(body: string): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1c1917;">
    <p style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6b6560;margin:0 0 20px;">${SITE_NAME}</p>
    ${body}
  </div>`;
}

// Titles and reviewer notes are author-supplied and land in an HTML email, so
// they must be escaped. Small hand-rolled escape rather than a dependency —
// these are the only five characters that matter in this context.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
