export type Author = { login: string };

export type PullRequest = {
  number: number;
  author: Author;
  title: string;
  createdAt: string;
  mergedAt: string;
  timelineItems: {
    nodes: { __typename: string; createdAt: string }[];
  };
  latestReviews: {
    nodes: { author: Author; state: string }[];
  };
  reviews: {
    nodes: {
      author: Author;
      publishedAt: string;
      submittedAt: string;
      state: string;
    }[];
  };
};
