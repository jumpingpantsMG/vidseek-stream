import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/api-docs")({
  head: () => ({
    meta: [
      { title: "API Documentation — TubeSearch" },
      {
        name: "description",
        content:
          "Public JSON API for searching YouTube videos and shorts: endpoints, parameters, response schema and examples.",
      },
      { property: "og:title", content: "API Documentation — TubeSearch" },
      {
        property: "og:description",
        content: "Search YouTube videos and shorts from a simple public JSON endpoint.",
      },
    ],
  }),
  component: ApiDocs,
});

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function ApiDocs() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">TubeSearch API</h1>
        <p className="mt-3 text-muted-foreground">
          A free, key-less JSON API for searching YouTube videos and shorts. All responses are
          JSON and cached for 5 minutes.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Base URL</h2>
          <Code>{`https://<your-domain>/api/public`}</Code>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">GET /api/public/search</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Searches YouTube and returns matching videos.
          </p>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Query parameters
          </h3>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">q</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">Required. Search terms (max 200 chars).</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">type</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">
                    Optional. <code>shorts</code> or <code>videos</code>. Defaults to both.
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">limit</td>
                  <td className="px-4 py-2">number</td>
                  <td className="px-4 py-2">Optional. 1–60, defaults to 30.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Example request
          </h3>
          <Code>{`curl "https://<your-domain>/api/public/search?q=lofi%20beats&type=shorts&limit=5"`}</Code>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Example response
          </h3>
          <Code>{`{
  "query": "lofi beats",
  "count": 1,
  "results": [
    {
      "id": "jfKfPfyJRdk",
      "title": "lofi hip hop radio",
      "channel": "Lofi Girl",
      "thumbnail": "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
      "duration": "0:58",
      "views": "1.2M views",
      "published": "2 weeks ago",
      "isShort": true
    }
  ]
}`}</Code>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Errors
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-mono text-xs text-foreground">400</span> — missing{" "}
              <code>q</code> parameter.
            </li>
            <li>
              <span className="font-mono text-xs text-foreground">502</span> — YouTube could not
              be reached or parsed.
            </li>
          </ul>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            JavaScript example
          </h3>
          <Code>{`const res = await fetch("/api/public/search?q=react+tutorial");
const { results } = await res.json();
console.log(results[0].title);`}</Code>
        </section>

        <p className="mt-12 text-xs text-muted-foreground">
          No API key is required. Please be considerate with request volume — results are scraped
          from YouTube's public search page.
        </p>
      </main>
    </AppShell>
  );
}
