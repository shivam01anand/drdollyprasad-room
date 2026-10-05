import fs from "node:fs";
import path from "node:path";
import Studio from "@/components/Studio";
import Works, { Contact } from "@/components/Works";

type Dims = Record<string, { w: number; h: number }>;

/** image sizes come from the manifest, so every image reserves its box */
function readDims(): Dims {
  const file = path.join(process.cwd(), "public/art/manifest.json");
  const { works } = JSON.parse(fs.readFileSync(file, "utf8")) as { works: { id: string; w: number; h: number }[] };
  return Object.fromEntries(works.map((w) => [w.id, { w: w.w, h: w.h }]));
}

export default function Page() {
  const dims = readDims();
  return (
    <>
      <Studio dims={dims} />
      <Works dims={dims} />
      <Contact />
    </>
  );
}
