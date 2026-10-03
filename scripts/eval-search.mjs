// Evaluates semantic search quality against the running app.
// Each case is a query a user might type and the document it should find.
//
// Usage: npm run eval:search             (app on http://localhost:3001)
//        BASE_URL=http://host:port npm run eval:search

const baseUrl = process.env.BASE_URL ?? "http://localhost:3001";
const limit = 10;

// `expect` is a substring of the expected document title.
// `kind` marks whether the query echoes the title or only the body's topic.
const cases = [
  { query: "bezdomność", expect: "Szlakiem ludzi bezdomnych", kind: "title" },
  { query: "prysznic dla osób bezdomnych", expect: "Szlakiem ludzi bezdomnych", kind: "title" },
  { query: "mobilny punkt higieniczny", expect: "Szlakiem ludzi bezdomnych", kind: "title" },
  { query: "przyczepa z łazienką dla gminy", expect: "Szlakiem ludzi bezdomnych", kind: "body" },
  { query: "kąpiel i czysta bielizna dla potrzebujących", expect: "Szlakiem ludzi bezdomnych", kind: "body" },
  { query: "otyłość", expect: "Stop Otyłości", kind: "title" },
  { query: "jak schudnąć", expect: "Stop Otyłości", kind: "body" },
  { query: "dieta i redukcja masy ciała", expect: "Stop Otyłości", kind: "body" },
  { query: "dietetyk i rehabilitant w domu pacjenta", expect: "Stop Otyłości", kind: "body" },
  { query: "uniknięcie umieszczenia w DPS osoby z nadwagą", expect: "Stop Otyłości", kind: "body" },
  { query: "niepełnosprawność", expect: "Niepełnosprawność", kind: "title" },
  { query: "praca dla osób z niepełnosprawnością", expect: "Niepełnosprawność", kind: "title" },
  { query: "terapia z udziałem zwierząt", expect: "Niepełnosprawność", kind: "body" },
  { query: "alpakoterapia i dogoterapia", expect: "Niepełnosprawność", kind: "body" },
  { query: "przygotowanie młodzieży do rynku pracy", expect: "Niepełnosprawność", kind: "body" },
];

async function search(query) {
  const url = `${baseUrl}/api/documents/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
  return (await response.json()).results;
}

const pct = (value) => `${(value * 100).toFixed(0)}%`;
const fmt = (value) => (value === undefined ? "  -  " : value.toFixed(3));

const rows = [];
for (const testCase of cases) {
  const results = await search(testCase.query);
  const index = results.findIndex((hit) => hit.title?.includes(testCase.expect));
  const expected = results[index];
  const bestOther = results.find((hit, i) => i !== index);
  rows.push({
    ...testCase,
    count: results.length,
    rank: index === -1 ? null : index + 1,
    similarity: expected?.similarity,
    margin: expected && bestOther ? expected.similarity - bestOther.similarity : undefined,
    top: results[0]?.title ?? "(no results)",
  });
}

console.log(`Search eval against ${baseUrl} (${cases.length} queries)\n`);
console.log("rank  sim    margin  kind   query  →  top hit");
for (const row of rows) {
  const mark = row.rank === 1 ? "✓" : "✗";
  console.log(
    `${mark} ${String(row.rank ?? "-").padEnd(3)} ${fmt(row.similarity)}  ${fmt(row.margin).padStart(6)}  ` +
      `${row.kind.padEnd(5)}  ${row.query}  →  ${row.top}`,
  );
}

function summarize(label, subset) {
  if (subset.length === 0) return;
  const hit1 = subset.filter((row) => row.rank === 1).length / subset.length;
  const hit3 = subset.filter((row) => row.rank !== null && row.rank <= 3).length / subset.length;
  const mrr = subset.reduce((sum, row) => sum + (row.rank ? 1 / row.rank : 0), 0) / subset.length;
  const sims = subset.filter((row) => row.similarity !== undefined).map((row) => row.similarity);
  const meanSim = sims.length ? sims.reduce((a, b) => a + b, 0) / sims.length : 0;
  console.log(
    `${label.padEnd(6)} hit@1 ${pct(hit1).padStart(4)}   hit@3 ${pct(hit3).padStart(4)}   ` +
      `MRR ${mrr.toFixed(2)}   mean similarity ${meanSim.toFixed(3)}`,
  );
  return meanSim;
}

console.log("");
const meanSim = summarize("all", rows);
summarize("title", rows.filter((row) => row.kind === "title"));
summarize("body", rows.filter((row) => row.kind === "body"));

const empty = rows.filter((row) => row.count === 0);
if (empty.length > 0) {
  console.error(`\n✗ ${empty.length} queries returned no results: documents have no embeddings or the DB is empty.`);
  process.exitCode = 1;
} else if (meanSim < 0.2) {
  console.warn(
    "\n! Similarities are near zero: the app is probably using mock embeddings. " +
      "Set OPENAI_API_KEY in .env and recreate the web container for real results.",
  );
}
