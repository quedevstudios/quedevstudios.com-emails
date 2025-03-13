import { readdir, readFile, writeFile, exists, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { load } from "cheerio";

import maizzleConfig from "../maizzle.config.js";

// TYPES

interface Email {
  template: string;
  subject: string;
  html: string;
  base64?: string;
}

// GENERAL

const BUILD_DIR = maizzleConfig.build?.output?.path || "build";
const DIST_DIR = maizzleConfig.dist?.path || "dist";

// FUNCTIONS

const extractInfo = async (email: string): Promise<Email | null> => {
  try {
    console.log(`Extracting information from ${email}...`);

    const html = await readFile(join(BUILD_DIR, email), "utf8");

    const $ = load(html);
    const template = email.replace(".html", "");
    const subject = $("title").text().trim();

    if (!subject) {
      console.warn(`Warning: Subject not found in ${email}. Skipping...`);
      return null;
    }

    return { template, subject, html };
  } catch (error) {
    console.error(`Error reading ${email}:`, error);
    return null;
  }
};

const htmlToBase64 = (html: string): string => {
  console.log(`Converting HTML to base64...`);

  return Buffer.from(html).toString("base64");
};

const main = async () => {
  // MAIN

  const emails: Email[] = [];

  const files = await readdir(BUILD_DIR);
  const emailFiles = files.filter((file) => file.endsWith(".html"));

  if (emailFiles.length === 0) {
    console.warn("No email files found in the build directory.");
    return;
  }

  for (const email of emailFiles) {
    const info = await extractInfo(email);

    if (!info) {
      continue;
    }

    const { template, subject, html } = info;
    const base64Html = htmlToBase64(html);

    emails.push({
      template,
      subject,
      html,
      base64: base64Html,
    });
  }

  // EXPORT

  const types = `export type EmailOptions = ${emails
    .map((email) => `"${email.template}"`)
    .join(" | ")}`;

  const templates = `export const templates: Record<EmailOptions, { subject: string; base64: string }> = {
  ${emails
    .map(
      (email) =>
        `  "${email.template}": { subject: "${email.subject}", base64: \`${email.base64}\` }`
    )
    .join(",\n")}
  };`;

  if (!(await exists(DIST_DIR))) {
    await mkdir(DIST_DIR, { recursive: true });
  }

  await writeFile(join(DIST_DIR, "emails.ts"), `${types}\n\n${templates}`);
};

await main();
