export type WikiSummary = {
  title: string;
  extract: string;
  url: string;
};

export async function fetchWikiSummary(topic: string): Promise<WikiSummary> {
  // Wikipedia REST API (no key). Good fallback for “more info” without exposing secrets.
  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
  const res = await fetch(endpoint, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Wikipedia request failed (${res.status})`);
  }
  const data = (await res.json()) as any;

  return {
    title: data?.title ?? topic,
    extract: data?.extract ?? 'No summary available.',
    url: data?.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${topic}`
  };
}

