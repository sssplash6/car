import "server-only";

// Decision emails, sent through Resend's HTTP API.
//
// Deliberately no SDK — calc/server/verify.js talks to the same API with plain
// fetch and that has been reliable, so this keeps the dependency count at zero
// and the failure modes identical across the workspace.

const RESEND_API_URL = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10_000; // Resend is usually <1s; this only catches hangs

/**
 * Send one email. Resolves silently when RESEND_API_KEY is unset.
 *
 * Callers must treat email as best-effort: a review decision is already
 * persisted by the time we get here, so a mail failure must never roll back the
 * decision or surface as an error to the admin. See notifyDecision.
 */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Dev fallback: no mail account configured. Log so the flow stays fully
    // testable locally. Never reached in production, where the key is set.
    console.log(`[email] (dev — RESEND_API_KEY unset) to ${to}: ${subject}`);
    return;
  }

  const from = process.env.MAIL_FROM || "Freshman Academy <onboarding@resend.dev>";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Email service timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

/**
 * Tell an author their paper was published or returned for revision.
 *
 * Swallows send failures after logging them: the review decision is already
 * committed, and throwing here would show the admin a failed action for a
 * decision that actually succeeded. The author can always see the status on
 * /submissions, which is why email is best-effort rather than load-bearing.
 */
export async function notifyDecision(opts: {
  to: string | null;
  title: string;
  published: boolean;
  slug: string;
  reviewNote?: string | null;
  siteUrl: string;
}): Promise<void> {
  if (!opts.to) return; // Google always gives us an email, but the column is nullable

  const subject = opts.published
    ? `Your paper "${opts.title}" is published`
    : `Your paper "${opts.title}" needs revision`;

  const body = opts.published
    ? `<p>Your paper <strong>${escapeHtml(opts.title)}</strong> is now published.</p>
       <p><a href="${opts.siteUrl}/p/${opts.slug}">Read it here</a></p>`
    : `<p>Your paper <strong>${escapeHtml(opts.title)}</strong> was reviewed and needs revision before publication.</p>
       ${opts.reviewNote ? `<p><strong>Reviewer note:</strong> ${escapeHtml(opts.reviewNote)}</p>` : ""}
       <p><a href="${opts.siteUrl}/submissions">View your submissions</a></p>`;

  try {
    await sendEmail(
      opts.to,
      subject,
      `<div style="font-family:Georgia,'Times New Roman',serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0f1f3a;">
         <p style="font-size:15px;color:#3b4a63;margin:0 0 16px;">Freshman Academy</p>
         ${body}
       </div>`,
    );
  } catch (err) {
    console.error("[email] decision notification failed:", err);
  }
}

// The title and reviewer note are author-supplied and land in an HTML email, so
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
