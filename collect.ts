import "jsr:@std/dotenv/load";
import { Octokit } from "https://esm.sh/octokit@4.0.2?dts";
import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { PullRequest } from "./types.ts";

const REPO = Deno.env.get("REPO")!;
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!;

const { start, end } = parseArgs(Deno.args);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

const query = `repo:${REPO} is:pr merged:${start}..${end}`;

const data = await octokit.graphql.paginate<{
  search: {
    edges: {
      node: PullRequest;
    }[];
  };
}>(
  `
query allPullRequests($q: String!, $num: Int = 10, $cursor: String) {
  search(
    type: ISSUE
    query: $q
    first: $num
    after: $cursor
  ) {
    edges {
      node {
        ... on PullRequest {
          number
          author {
            login
          }
          title
          createdAt
          mergedAt
          timelineItems(itemTypes:READY_FOR_REVIEW_EVENT, first:1) {
            nodes {
							... on ReadyForReviewEvent {
                __typename
                createdAt
              }
            }
          }
          latestReviews(first:5) {
            nodes {
              author {login}
              state
            }
          }
          reviews(first:20) {
            nodes {
              author {login}
              publishedAt
              submittedAt
              state
            }
          }
        }
      } 
    }

    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`,
  {
    q: query,
  }
);

await Deno.writeTextFile(
  `raw/pr_${start}_${end}.json`,
  JSON.stringify(
    data.search.edges.map((edge) => edge.node),
    null,
    2
  )
);

Deno.exit();
