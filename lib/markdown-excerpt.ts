import type { Blockquote, Nodes, Paragraph, Root, Table } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { toString } from "mdast-util-to-string";
import { gfm } from "micromark-extension-gfm";

export type DocumentFact = { label: string; value: string };

export type DocumentPreview = {
  summary: string;
  facts: DocumentFact[];
};

const minParagraphChars = 40;
// Lead-in labels like "**W skrócie:**" repeat on every document, so the card drops them.
const leadLabel = /^(w skrócie|streszczenie|opis|podsumowanie)\s*:\s*/i;
// Bookkeeping rows say little about the innovation itself; cards show them last.
const minorFacts = new Set(["nr projektu", "licencja", "data dokumentu", "promocja"]);

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

// Inline HTML (Pandoc image tags and the like) is markup, not text.
function paragraphText(paragraph: Paragraph): string {
  return collapse(
    paragraph.children
      .filter((child) => child.type !== "html")
      .map((child) => toString(child))
      .join(""),
  );
}

// Table-of-contents entries and figure lines are mostly links or images, not prose.
function isProse(paragraph: Paragraph, text: string): boolean {
  if (text.length < minParagraphChars) return false;
  const linkedChars = paragraph.children
    .filter((child) => child.type === "link" || child.type === "image")
    .reduce((sum, child) => sum + toString(child).length, 0);
  return linkedChars / text.length < 0.5;
}

function blockquoteText(quote: Blockquote): string {
  return collapse(
    quote.children
      .filter((child): child is Paragraph => child.type === "paragraph")
      .map(paragraphText)
      .join(" "),
  );
}

// A leading "> **W skrócie:** …" blockquote is the author's own summary.
function leadSummary(tree: Root): string | null {
  const quote = tree.children.find((node): node is Blockquote => node.type === "blockquote");
  if (!quote) return null;
  const text = blockquoteText(quote);
  return leadLabel.test(text) ? text.replace(leadLabel, "") : null;
}

function proseSummary(tree: Root, maxChars: number): string {
  const parts: string[] = [];
  let length = 0;

  const visit = (node: Nodes) => {
    if (length >= maxChars) return;
    if (node.type === "paragraph") {
      const text = paragraphText(node);
      if (isProse(node, text)) {
        parts.push(text);
        length += text.length + 1;
      }
      return;
    }
    if (node.type === "root" || node.type === "blockquote" || node.type === "list" || node.type === "listItem") {
      node.children.forEach((child) => visit(child as Nodes));
    }
  };
  visit(tree);

  return parts.length > 0 ? parts.join(" ") : collapse(toString(tree, { includeHtml: false }));
}

// Key/value rows from the first two-column table (the "Pole | Wartość" metadata block).
function factsTable(tree: Root): DocumentFact[] {
  const table = tree.children.find(
    (node): node is Table => node.type === "table" && node.children[0]?.children.length === 2,
  );
  if (!table) return [];
  return table.children
    .slice(1)
    .map((row) => {
      const [label, value] = row.children.map((cell) => collapse(toString(cell)));
      return { label, value };
    })
    .filter((fact) => fact.label && fact.value)
    .sort((a, b) => Number(minorFacts.has(a.label.toLowerCase())) - Number(minorFacts.has(b.label.toLowerCase())));
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase("pl-PL") + text.slice(1);
}

// Card preview of a Markdown document: a short plain-text summary plus its metadata facts.
export function markdownPreview(markdown: string, maxChars = 220): DocumentPreview {
  const tree = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  return {
    summary: capitalize(truncate(leadSummary(tree) ?? proseSummary(tree, maxChars), maxChars)),
    facts: factsTable(tree),
  };
}
