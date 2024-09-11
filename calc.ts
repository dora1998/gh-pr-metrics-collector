import { PullRequest } from "./types.ts";
import * as csv from "https://deno.land/std@0.224.0/csv/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";

const unixtime = (date: string) => Math.floor(new Date(date).getTime() / 1000);

// ---

const jsonPath = Deno.args[0];

const raw = await Deno.readTextFile(jsonPath);
const prs: PullRequest[] = JSON.parse(raw);

const result = prs.map((pr) => {
  const {
    number,
    author: { login: author },
    createdAt,
    timelineItems,
    reviews,
    mergedAt,
    title,
  } = pr;
  const openedAt = timelineItems.nodes[0]?.createdAt ?? createdAt;

  const approvers = Array.from(
    new Set(
      reviews.nodes
        .filter((r) => r.state === "APPROVED")
        .map((r) => r.author.login)
    )
  );
  const firstReviews = approvers
    .map((r) => reviews.nodes.find((rev) => rev.author.login === r)!)
    .toSorted((a, b) => unixtime(a.submittedAt) - unixtime(b.submittedAt));

  const openToFirstReview =
    firstReviews[0] != null
      ? unixtime(firstReviews[0].submittedAt) - unixtime(openedAt)
      : null;

  const openToSecondReview =
    firstReviews[1] != null
      ? unixtime(firstReviews[1].submittedAt) - unixtime(openedAt)
      : null;

  const openToMerge = unixtime(mergedAt) - unixtime(openedAt);

  return {
    number,
    author,
    openedAt,
    mergedAt,
    title,
    openToFirstReview: openToFirstReview ?? "",
    openToSecondReview: openToSecondReview ?? "",
    openToMerge,
  };
});

await Deno.writeTextFile(
  `result/${path.basename(jsonPath, ".json")}.csv`,
  csv.stringify(result, {
    columns: [
      "number",
      "author",
      "openedAt",
      "mergedAt",
      "title",
      "openToFirstReview",
      "openToSecondReview",
      "openToMerge",
    ],
  })
);
