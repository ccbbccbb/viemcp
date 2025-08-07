import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

type GithubTreeEntry = { path: string; mode: string; type: "blob" | "tree"; sha: string; url: string };

function getGithubHeaders(): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "viemcp-mcp-server",
  };
}

async function fetchViemDocsTree(): Promise<string[]> {
  const branch = process.env["VIEM_DOCS_BRANCH"] || "main";
  const apiUrl = `https://api.github.com/repos/wevm/viem/git/trees/${branch}?recursive=1`;
  const res = await fetch(apiUrl, { headers: getGithubHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub tree fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { tree: GithubTreeEntry[] };
  const base = "site/pages/docs/";
  return data.tree
    .filter((e) => e.type === "blob" && e.path.startsWith(base) && e.path.endsWith(".mdx"))
    .map((e) => e.path.slice(base.length));
}

function registerGithubDocResource(server: McpServer, relativePath: string) {
  const uri = `viem://docs/github/${relativePath}`;
  const name = `viem-doc-${relativePath.replace(/\//g, "-")}`;
  server.registerResource(
    name,
    uri,
    {
      title: `Viem Docs (GitHub): ${relativePath}`,
      description: `Live content from wevm/viem/site/pages/docs/${relativePath}`,
      mimeType: "text/markdown",
    },
    async (url) => {
      try {
        const branch = process.env["VIEM_DOCS_BRANCH"] || "main";
        const rawUrl = `https://raw.githubusercontent.com/wevm/viem/${branch}/site/pages/docs/${relativePath}`;
        const res = await fetch(rawUrl, { headers: { "User-Agent": "viemcp-mcp-server" } });
        if (!res.ok) {
          throw new Error(`GitHub raw fetch failed: ${res.status} ${res.statusText}`);
        }
        const text = await res.text();
        return { contents: [{ uri: url.href, mimeType: "text/markdown", text }] };
      } catch (error) {
        return {
          contents: [
            {
              uri: url.href,
              mimeType: "text/plain",
              text: `Error loading GitHub doc: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

export async function setupGithubDocsResources(server: McpServer) {
  try {
    const mdxPaths = await fetchViemDocsTree();
    const branch = process.env["VIEM_DOCS_BRANCH"] || "main";
    const indexTextLines = [
      `Viem GitHub docs (branch: ${branch})`,
      "",
      "Discovered MDX files:",
      ...mdxPaths.map((p) => `- viem://docs/github/${p}`),
    ];
    server.registerResource(
      "viem-docs-github-index",
      "viem://docs/github-index",
      {
        title: "Viem Docs (GitHub) Index",
        description: "List of all Viem GitHub docs registered as resources",
        mimeType: "text/markdown",
      },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: indexTextLines.join("\n") }] })
    );
    mdxPaths.forEach((p) => registerGithubDocResource(server, p));
  } catch (error) {
    console.error("Failed to setup GitHub docs resources:", error instanceof Error ? error.message : String(error));
  }
}


