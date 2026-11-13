// Editorial publications that ship with the code.
//
// Run with:  npm run db:publications   (Render runs it on every start, after
// `prisma migrate deploy`; see render.yaml)
//
// Papers that the editors prepare themselves (commissioned essays, pieces sent
// in by email) live in content/publications/: one PDF each, listed in
// publications.json. This script copies any listed paper that is not yet in the
// database onto the upload disk and inserts it as PUBLISHED.
//
// Insert-only, keyed by slug: a paper already in the database is never touched
// again, so an editor's later changes on the site (or a deliberate deletion
// followed by a slug change here) are not overwritten on the next restart. To
// change a shipped paper's text, edit it on the site, not here.
//
// Plain better-sqlite3 for the same reason as seed-demo.mjs: the Prisma 7
// client is TypeScript and a .mjs script cannot import it without a build step.

import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

try {
  process.loadEnvFile();
} catch {
  // No .env: use the environment as it is (Render, the VPS).
}

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "var/uploads";
const DB_PATH = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(/^file:/, "");
const CONTENT_DIR = path.join(import.meta.dirname, "..", "content", "publications");

// The account shipped papers are filed under. Papers need a submitter; this one
// has no email, so nobody can ever sign in as it.
const EDITORIAL_USER = { id: "car-editorial", name: "Central Asian Review" };

const entries = JSON.parse(readFileSync(path.join(CONTENT_DIR, "publications.json"), "utf8"));
const db = new Database(DB_PATH);
mkdirSync(UPLOAD_DIR, { recursive: true });

db.prepare(
  `INSERT OR IGNORE INTO User (id, name, email, role, createdAt) VALUES (?, ?, NULL, 'READER', ?)`,
).run(EDITORIAL_USER.id, EDITORIAL_USER.name, new Date().toISOString());

const exists = db.prepare(`SELECT 1 FROM Paper WHERE slug = ?`);
const insert = db.prepare(
  `INSERT INTO Paper (id, slug, title, abstract, authorLine, status, storedName,
     originalName, fileSize, coverImage, submitterId, createdAt, updatedAt,
     submittedAt, publishedAt)
   VALUES (@id, @slug, @title, @abstract, @authorLine, 'PUBLISHED', @storedName,
     @originalName, @fileSize, @coverImage, @submitterId, @at, @at, @at, @at)`,
);

let added = 0;
for (const entry of entries) {
  if (exists.get(entry.slug)) continue;

  const source = path.join(CONTENT_DIR, entry.pdf);
  const storedName = `${randomUUID()}.pdf`;
  copyFileSync(source, path.join(UPLOAD_DIR, storedName));

  // ISO text, the same DateTime format seed-demo.mjs writes.
  const at = new Date(entry.publishedAt).toISOString();
  insert.run({
    id: `pub-${entry.slug}`,
    slug: entry.slug,
    title: entry.title,
    abstract: entry.abstract,
    authorLine: entry.authorLine,
    storedName,
    originalName: entry.pdf,
    fileSize: statSync(source).size,
    coverImage: entry.coverImage ?? null,
    submitterId: EDITORIAL_USER.id,
    at,
  });
  added += 1;
  console.log(`publications: added ${entry.slug}`);
}

console.log(`publications: ${added} added, ${entries.length - added} already present`);
db.close();
