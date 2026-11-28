"""
Alt text for the 41 paintings, assembled from the knowledge base (elevate round, 26 Nov 2026).

Each alt is: the title, then the checked visual record of that painting from dolly-engine
kb/paintings.json (description.checked, the notes made while looking at the photograph), then the
medium. Nothing is written here: the script only strips the checker's working notes ("(crop)",
"Small original (254px, upscaled):", "Approved in sample round; reconfirmed", "Claims kept coarse.")
and joins the three parts. No new fact, no reading of the picture.

    python3 scripts/alt/make.py [path to dolly-engine]     -> lib/alt-text.json
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
KB = os.path.join(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "..", "dolly-engine"), "kb", "paintings.json")

out = {}
for p in json.load(open(KB, encoding="utf-8"))["paintings"]:
    wid = re.sub(r"^\d+-|\.(jpg|png)$", "", p["image_file"])
    seen = p["description"]["checked"].strip()
    seen = re.sub(r"\s*\((?:full-res )?crop\)", "", seen)
    seen = re.sub(r"^Small original \([^)]*\):\s*", "", seen)
    seen = re.sub(r"^Approved in sample round; reconfirmed\s*", "", seen)
    seen = re.sub(r"\s*Claims kept coarse\.$", "", seen)
    seen = seen.rstrip(". ")
    seen = seen[0].lower() + seen[1:]
    out[wid] = f'{p["title"]["value"]}: {seen}. {p["medium"]["value"]}.'

json.dump(out, open(os.path.join(ROOT, "lib", "alt-text.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "alt texts")
