import glob
import re
import json

files = glob.glob("*.html")
print(f"{'Dosya':28} | {'Title':7} | {'Desc':4} | {'Canonical':32} | {'OG':2} | {'TW':2} | {'Geo':3} | {'Schema':6}")
print("-" * 95)
for f in sorted(files):
    if f == "admin.html":
        continue
    with open(f, "r", encoding="utf-8") as fp:
        c = fp.read()
    title_m = re.search(r"<title>(.*?)</title>", c, re.IGNORECASE | re.DOTALL)
    title = title_m.group(1).strip() if title_m else "NO TITLE"
    desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', c, re.IGNORECASE)
    desc = "YES" if desc_m else "NO"
    canon_m = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', c, re.IGNORECASE)
    canon = canon_m.group(1).strip() if canon_m else "NO"
    schema_blocks = re.findall(r'<script type=["\']application/ld\+json["\']>(.*?)</script>', c, re.DOTALL)
    for idx, sb in enumerate(schema_blocks):
        try:
            json.loads(sb.strip())
        except Exception as e:
            print(f"  [ERROR] {f} schema #{idx}: {e}")
    og_cnt = len(re.findall(r'<meta\s+property=["\']og:', c))
    tw_cnt = len(re.findall(r'<meta\s+name=["\']twitter:', c))
    geo_cnt = len(re.findall(r'<meta\s+name=["\']geo\.', c))
    print(f"{f:28} | {len(title):2d} ch  | {desc:4s} | {canon[:32]:32} | {og_cnt:2d} | {tw_cnt:2d} | {geo_cnt:3d} | {len(schema_blocks):2d}")

