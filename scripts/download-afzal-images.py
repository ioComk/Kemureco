#!/usr/bin/env python3
import argparse
import json
import urllib.request
from html import unescape
from pathlib import Path
from urllib.parse import urlparse


def fetch_products(page: int):
    url = f"https://shop.cloud-jp.net/collections/afzal/products.json?page={page}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.load(resp).get("products", [])


def extract_name(title: str) -> str:
    if not title:
        return ""
    part = title.split("（", 1)[0]
    part = part.split(" - ", 1)[0]
    part = part.split(" – ", 1)[0]
    return unescape(part).strip()


def normalize_image_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("//"):
        url = "https:" + url
    return url


def extract_items():
    items = []
    for page in (1, 2):
        for product in fetch_products(page):
            name = extract_name(product.get("title", ""))
            if not name:
                continue
            images = product.get("images") or []
            img_url = images[0].get("src") if images else ""
            img_url = normalize_image_url(img_url)
            if not img_url:
                continue
            items.append((name, img_url))
    seen = set()
    unique = []
    for name, img_url in items:
        if name in seen:
            continue
        seen.add(name)
        unique.append((name, img_url))
    return unique


def download(url: str, dest: Path, force: bool) -> bool:
    if dest.exists() and not force:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        dest.write_bytes(resp.read())
    return True


def filename_from_url(url: str, name: str) -> str:
    path = urlparse(url).path
    ext = Path(path).suffix or ".png"
    return f"{name}{ext}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Download Afzal images from CLOUD SHOP.")
    parser.add_argument(
        "--output",
        default="/Users/iocomk/Squoosh/afzal/input",
    )
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    items = extract_items()
    if not items:
        print("No items found.")
        return 1

    output_dir = Path(args.output)
    manifest_lines = []

    for name, img_url in items:
        filename = filename_from_url(img_url, name)
        dest = output_dir / filename
        downloaded = download(img_url, dest, args.force)
        manifest_lines.append(f"{name}\t{img_url}\t{dest.name}\t{int(downloaded)}")

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "manifest.tsv").write_text("\n".join(manifest_lines))
    print(f"Downloaded {len(items)} images to {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
