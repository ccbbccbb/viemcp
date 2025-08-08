import * as viemChains from "viem/chains";
import fs from "node:fs/promises";
import path from "node:path";

type ChainLike = { id: number; name: string; network?: string; slug?: string };

async function generateChains() {
  const uniq = new Map<number, ChainLike>();

  for (const v of Object.values(viemChains) as any[]) {
    if (!v || typeof v !== "object") continue;
    if (!("id" in v) || !("name" in v)) continue;
    const id = v.id as number;
    const name = v.name as string;
    const slug = v.slug ?? v.network ?? name.toLowerCase().replace(/\s+/g, "-");
    uniq.set(id, { id, name, slug });
  }

  const out = [...uniq.values()].sort((a, b) => a.id - b.id);

  await fs.mkdir(path.join(process.cwd(), "public"), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "public/chains.json"), JSON.stringify(out, null, 2));

  console.log(`wrote ${out.length} chains to public/chains.json`);
}

generateChains().catch(console.error);
