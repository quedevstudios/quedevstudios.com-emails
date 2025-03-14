import { readdir, readFile, writeFile, exists, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { load } from "cheerio";

import maizzleConfig from "../maizzle.config.js";

// TYPES

type EmailTypes =
  | {
      [key: string]: string;
    }
  | undefined;

interface Email {
  template: string;
  subject: string;
  html: string;
  base64?: string;
  types?: EmailTypes;
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

    // Scan for variables inside {} and map them to key, and rest as string
    const matches = html.match(/{([a-zA-Z0-9_]+)}/g) || [];
    const types: EmailTypes = matches.reduce((acc, match) => {
      const variable = match.slice(1, -1);

      // @ts-expect-error - We know this is a string
      acc[variable] = "string";

      return acc;
    }, {} as EmailTypes);

    return { template, subject, html, types };
  } catch (error) {
    console.error(`Error reading ${email}:`, error);
    return null;
  }
};

const htmlToBase64 = (html: string): string => {
  console.log(`Converting HTML to base64...`);

  return Buffer.from(html).toString("base64");
};

const toPascalCase = (str: string): string => {
  return str
    .replace(/[-_]+/g, " ") // Replace hyphens/underscores with spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before uppercase letters (camelCase handling)
    .split(" ") // Split into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(""); // Join words into PascalCase
};

const createTypeEmailOptions = (emails: Email[]): string => {
  console.log(`Creating EmailOptions type...`);

  return `export type EmailOptions = ${emails
    .map((email) => `"${email.template}"`)
    .join(" | ")}`;
};

const createTypeEmails = (emails: Email[]): string => {
  console.log(`Creating email types...`);

  return emails
    .map((email) => {
      if (!email.types || Object.keys(email.types).length === 0) {
        return "";
      }

      let type = `export type ${toPascalCase(email.template)} = {
    ${Object.entries(email.types)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n")}
    };`;

      // remove any , found anywhere
      type = type.replace(/,/g, "");

      return type;
    })
    .join("\n");
};

const createEmailTemplateObject = (emails: Email[]): string => {
  console.log(`Creating email templates object...`);

  return `export const templates: Record<EmailOptions, { subject: string; base64: string }> = {
  ${emails
    .map(
      (email) =>
        `  "${email.template}": { subject: "${email.subject}", base64: \`${email.base64}\` }`
    )
    .join(",\n")}
  };`;
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

    const { template, subject, html, types } = info;
    const base64Html = htmlToBase64(html);

    emails.push({
      template,
      subject,
      html,
      base64: base64Html,
      types,
    });
  }

  // EXPORT

  if (!(await exists(DIST_DIR))) {
    await mkdir(DIST_DIR, { recursive: true });
  }

  const typeEmailOptions = createTypeEmailOptions(emails);
  const typeEmails = createTypeEmails(emails);
  const templates = createEmailTemplateObject(emails);

  await writeFile(
    join(DIST_DIR, "emails.ts"),
    `${typeEmailOptions}\n\n${typeEmails}\n\n${templates}`
  );
};

await main();
