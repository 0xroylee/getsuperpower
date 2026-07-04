import { LandingPage } from "../components/landing-page";

const githubRepositoryApiUrl = "https://api.github.com/repos/0xroylee/getsuperpower";
const githubStarsFallbackLabel = "Stars";

interface GitHubRepositoryMetadata {
  stargazers_count?: unknown;
}

export function formatGithubStarsLabel(stars: number): string {
  if (stars >= 1000) {
    const compact = new Intl.NumberFormat("en", {
      maximumFractionDigits: 1,
      notation: "compact",
    }).format(stars);

    return `${compact.toLowerCase()} stars`;
  }

  return `${stars.toLocaleString("en")} stars`;
}

async function fetchGithubStarsLabel(): Promise<string> {
  try {
    const response = await fetch(githubRepositoryApiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return githubStarsFallbackLabel;

    const metadata = (await response.json()) as GitHubRepositoryMetadata;
    if (typeof metadata.stargazers_count !== "number") return githubStarsFallbackLabel;

    return formatGithubStarsLabel(metadata.stargazers_count);
  } catch {
    return githubStarsFallbackLabel;
  }
}

export default async function Page() {
  const githubStarsLabel = await fetchGithubStarsLabel();

  return <LandingPage githubStarsLabel={githubStarsLabel} />;
}
