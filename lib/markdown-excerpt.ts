import type { Nodes, Paragraph } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toString } from "mdast-util-to-string";

const minParagraphChars = 40;

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

// Plain-text brief of a Markdown document for result cards: the first prose paragraphs,
// skipping headings, the table of contents and image captions.
export function markdownExcerpt(markdown: string, maxChars = 280): string {
  const tree = fromMarkdown(markdown);
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

  const text = parts.length > 0 ? parts.join(" ") : collapse(toString(tree, { includeHtml: false }));
  return truncate(text, maxChars);
}
