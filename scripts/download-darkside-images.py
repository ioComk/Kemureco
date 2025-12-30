#!/usr/bin/env python3
import argparse
import re
import urllib.request
from pathlib import Path


def fetch_html(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_items(page_html: str):
    pattern = re.compile(
        r'<img src="([^"]+)"[^>]*>\s*</span>\s*'
        r'<p class="itemName">\s*([^<]+)\s*</p>',
        re.S,
    )
    items = pattern.findall(page_html)
    results = []
    for img_url, raw in items:
        raw = raw.strip()
        raw = re.sub(r'\s*-\s*DARKSIDE.*$', '', raw, flags=re.I)
        name = raw.split('(')[0].strip()
        if not name:
            continue
        results.append((name, img_url))
    return results


def download(url: str, dest: Path, force: bool) -> bool:
    if dest.exists() and not force:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Download DARKSIDE images from ASLAJ.")
    parser.add_argument(
        "--url",
        default="https://www.aslaj.com/view/category/ct112",
    )
    parser.add_argument(
        "--output",
        default="/Users/iocomk/Squoosh/darkside/input",
    )
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    page_html = fetch_html(args.url)
    items = extract_items(page_html)
    if not items:
        print("No items found.")
        return 1

    output_dir = Path(args.output)
    manifest_lines = []

    seen = set()
    for name, img_url in items:
        if name in seen:
            continue
        seen.add(name)
        filename = f"{name}.jpg"
        dest = output_dir / filename
        downloaded = download(img_url, dest, args.force)
        manifest_lines.append(f"{name}\t{img_url}\t{dest.name}\t{int(downloaded)}")

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "manifest.tsv").write_text("\n".join(manifest_lines))
    print(f"Downloaded {len(seen)} images to {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
