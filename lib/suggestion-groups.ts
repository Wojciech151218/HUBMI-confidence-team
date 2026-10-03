import { getDataSource } from "@/lib/data-source";
import type { SuggestionGroup } from "@/app/components/SuggestionBubbles";

const maxLabels = 9;
const maxGroups = 3;
const maxGroupSize = 4;

type CategoryCount = { id: number; name: string; count: number };
type PairCount = { a: number; b: number; count: number };

// Most-used categories, clustered by how often they tag the same documents.
export async function getSuggestionGroups(): Promise<SuggestionGroup[]> {
  const ds = await getDataSource();

  const top: CategoryCount[] = (
    await ds.query(
      `SELECT c.id, c.name, COUNT(dc.document_id)::int AS count
         FROM categories c
         JOIN document_categories dc ON dc.category_id = c.id
        GROUP BY c.id, c.name
        ORDER BY count DESC, c.name
        LIMIT $1`,
      [maxLabels],
    )
  ).map((row: CategoryCount) => ({ ...row, id: Number(row.id) }));
  if (top.length === 0) return [];

  const pairs: PairCount[] = await ds.query(
    `SELECT a.category_id AS a, b.category_id AS b, COUNT(*)::int AS count
       FROM document_categories a
       JOIN document_categories b
         ON a.document_id = b.document_id AND a.category_id < b.category_id
      WHERE a.category_id = ANY($1) AND b.category_id = ANY($1)
      GROUP BY a.category_id, b.category_id`,
    [top.map((category) => category.id)],
  );
  const affinity = new Map<string, number>();
  for (const pair of pairs) {
    affinity.set(`${pair.a}:${pair.b}`, pair.count);
    affinity.set(`${pair.b}:${pair.a}`, pair.count);
  }

  // Greedy: join the group this category co-occurs with most, otherwise start a new one.
  const groups: CategoryCount[][] = [];
  for (const category of top) {
    let best: CategoryCount[] | null = null;
    let bestScore = 0;
    for (const group of groups) {
      if (group.length >= maxGroupSize) continue;
      const score = group.reduce(
        (sum, member) => sum + (affinity.get(`${member.id}:${category.id}`) ?? 0),
        0,
      );
      if (score > bestScore) {
        best = group;
        bestScore = score;
      }
    }
    if (!best && groups.length < maxGroups) {
      groups.push([category]);
    } else {
      const target = best ?? groups.reduce((min, group) => (group.length < min.length ? group : min));
      if (target.length < maxGroupSize) target.push(category);
    }
  }

  return groups.map((group) => ({
    topic: group[0].name,
    labels: group.map((category) => category.name),
  }));
}
