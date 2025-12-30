#!/usr/bin/env python3
import argparse
import re
import urllib.request
from html import unescape
from pathlib import Path

BASE_URL = "https://www.adalyatobacco.com"

def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_items(page_html: str):
    card_pattern = re.compile(r'<a class="col-lg-3[\s\S]*?</a>', re.S)
    back_pattern = re.compile(r'<img class="back" src="([^"]+)"', re.S)
    name_pattern = re.compile(r'<h5 class="font-size-20[^>]*>([^<]+)</h5>')

    cards = card_pattern.findall(page_html)
    items = []
    for card in cards:
        name_m = name_pattern.search(card)
        back_m = back_pattern.search(card)
        if not name_m or not back_m:
            continue
        name = unescape(name_m.group(1).strip())
        back = back_m.group(1).strip()
        if not back.startswith("http"):
            back = f"{BASE_URL}{back}"
        items.append((name, back))
    return items


def safe_filename(name: str) -> str:
    return re.sub(r'[\\/:*?"<>|]', "-", name).strip()


def download(url: str, dest: Path, force: bool) -> bool:
    if dest.exists() and not force:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Download Adalya back images.")
    parser.add_argument("--url", default="https://www.adalyatobacco.com/tr/adalya")
    parser.add_argument("--output", default="/Users/iocomk/Squoosh/adalya/input")
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

    for name, url in items:
        if name in seen:
            continue
        seen.add(name)
        filename = f"{safe_filename(name)}.jpg"
        dest = output_dir / filename
        downloaded = download(url, dest, args.force)
        manifest_lines.append(f"{name}\t{url}\t{dest.name}\t{int(downloaded)}")

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "manifest.tsv").write_text("\n".join(manifest_lines))
    print(f"Downloaded {len(seen)} images to {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
