"""
Noku Studio — Sync the material copy in noku-materials.js from Shopify.

Source of truth is the Shopify "wood" and "option" metaobjects. The Materials
page renders the local copy instantly, then swaps in live Shopify data; this
keeps that local copy close so the swap is invisible.

  wood:    list, order, name, scientific name, image and description
  options: image and description, matched to existing leather/fabric/cane ids
           (names and subtitles stay local; Shopify names read "Leather - Cognac")

Run after editing materials in Shopify Admin, then commit noku-materials.js.
"""
import os, re, json, sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
JS_PATH = os.path.join(WORKSPACE, "noku-materials.js")

SHOP = "6b5390-f8.myshopify.com"
API_VERSION = "2024-04"
TOKEN = "7b62ad5d7d665bebe383ff2d3c36c0b0"
IMAGE_WIDTH = 800  # Shopify CDN resizes (and converts HEIC to JPEG)

QUERY = """
{
  woods: metaobjects(type: "wood", first: 50) { edges { node { fields { key value reference { ... on MediaImage { image { url } } } } } } }
  options: metaobjects(type: "option", first: 50) { edges { node { fields { key value reference { ... on MediaImage { image { url } } } } } } }
}
"""


def match_id(name):
    """Same mapping as matchId() in noku-materials.js."""
    norm = name.lower().strip()
    norm = re.sub(r"^fabric\s*-\s*", "", norm)
    norm = re.sub(r"^leather\s*-\s*", "", norm)
    norm = re.sub(r"[^a-z0-9-]", "", norm)
    for key, mid in (("cognac", "vagabond-cognac"), ("honey", "glory-honey"),
                     ("chestnut", "montana-chestnut"), ("brick", "emperor-brick"),
                     ("olive", "eternity-olive"), ("whiteash", "white-ash"),
                     ("reclaimedteak", "reclaimed-teak"), ("rubiklinen", "rubik-linen"),
                     ("wovencane", "woven-cane")):
        if key in norm:
            return mid
    return norm


def fetch():
    req = urllib.request.Request(
        f"https://{SHOP}/api/{API_VERSION}/graphql.json",
        data=json.dumps({"query": QUERY}).encode(),
        headers={"Content-Type": "application/json",
                 "X-Shopify-Storefront-Access-Token": TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    if data.get("errors"):
        sys.exit(f"Shopify error: {data['errors']}")

    def rows(edges):
        out = []
        for e in edges:
            f = {x["key"]: x for x in e["node"]["fields"]}
            name = (f.get("name") or {}).get("value")
            if not name:
                continue
            ref = (f.get("image") or {}).get("reference") or {}
            img = (ref.get("image") or {}).get("url")
            out.append({
                "id": match_id(name),
                "name": name.strip(),
                "subtitle": ((f.get("scientific_name") or {}).get("value") or "").strip(),
                "desc": ((f.get("description") or {}).get("value") or "").strip(),
                "preview": f"{img}{'&' if '?' in img else '?'}width={IMAGE_WIDTH}" if img else "",
            })
        return out

    return rows(data["data"]["woods"]["edges"]), rows(data["data"]["options"]["edges"])


def js(s):
    return json.dumps(s, ensure_ascii=False)


def main():
    woods, options = fetch()
    src = open(JS_PATH, encoding="utf-8").read()

    # Keep each wood's local swatch class (CSS fallback) when the id already exists.
    old_cls = dict(re.findall(r'\{ id: "([^"]+)",[^\n]*?cls: "([^"]*)"', src))
    wood_lines = []
    for w in woods:
        fields = [f'id: {js(w["id"])}', f'name: {js(w["name"])}', f'subtitle: {js(w["subtitle"])}',
                  f'cls: {js(old_cls.get(w["id"], ""))}', f'preview: {js(w["preview"])}', f'desc: {js(w["desc"])}']
        wood_lines.append("      { " + ", ".join(fields) + " }")
    src, n = re.subn(r"(    wood: \[\n).*?(\n    \],)", lambda m: m.group(1) + ",\n".join(wood_lines) + m.group(2),
                     src, count=1, flags=re.S)
    if not n:
        sys.exit("Could not find the wood list in noku-materials.js")
    print(f"wood: {len(woods)} entries -> " + ", ".join(w["name"] for w in woods))

    for o in options:
        pattern = re.compile(r'(\{ id: "' + re.escape(o["id"]) + r'",[^\n]*)')
        m = pattern.search(src)
        if not m:
            print(f"  skipped (no local entry): {o['name']}")
            continue
        line = m.group(1)
        new = line
        if o["preview"]:
            new = re.sub(r'preview: "(?:[^"\\]|\\.)*"', lambda _: f'preview: {js(o["preview"])}', new)
        if o["desc"]:
            new = re.sub(r'desc: "(?:[^"\\]|\\.)*"', lambda _: f'desc: {js(o["desc"])}', new)
        src = src.replace(line, new)
    print(f"options: {len(options)} checked")

    open(JS_PATH, "w", encoding="utf-8", newline="\n").write(src)
    print("Updated noku-materials.js")


if __name__ == "__main__":
    main()
