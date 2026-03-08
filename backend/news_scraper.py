import feedparser
import json
import hashlib
import re
import random
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from bs4 import BeautifulSoup
import requests

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}
from apscheduler.schedulers.blocking import BlockingScheduler

REFRESH_SECONDS = 1800

OUTPUT_FILE  = Path(__file__).parent.parent / "frontend" / "public" / "news.json"
NEWS_PER_RUN = 10
MAX_PER_FEED = 20

RSS_FEEDS = [
    {"name": "CNBC",          "url": "https://www.cnbc.com/id/100003114/device/rss/rss.html"},
    {"name": "Reuters",       "url": "https://www.reuters.com/markets/rss"},
    {"name": "Yahoo Finance", "url": "https://finance.yahoo.com/news/rssindex"},
    {"name": "Finshots",      "url": "https://finshots.in/feed"},
]

FINANCE_KEYWORDS = [
    "stock", "market", "shares", "invest", "fed", "inflation",
    "earnings", "ipo", "bond", "nasdaq", "dow", "s&p",
]

#  HELPERS

def is_financial(title: str) -> bool:
    t = title.lower()
    return any(kw in t for kw in FINANCE_KEYWORDS)


def parse_published(entry) -> datetime | None:
    for field in ("published", "updated", "created"):
        val = entry.get(field, "")
        if not val:
            continue
        try:
            dt = parsedate_to_datetime(val)
            return dt.astimezone(timezone.utc)
        except Exception:
            pass
        try:
            dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
            return dt.astimezone(timezone.utc)
        except Exception:
            pass
    return None


def is_within_24h(dt: datetime | None) -> bool:
    if dt is None:
        return True
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)
    return dt >= cutoff


def summarise(text: str, max_chars: int = 280) -> str:
    text = " ".join(text.split())
    sentences = re.split(r'(?<=[.!?])\s+', text)
    collected = ""
    for sent in sentences:
        candidate = (collected + " " + sent).strip() if collected else sent
        if len(candidate) > max_chars:
            break
        collected = candidate
        if collected.count(".") + collected.count("!") + collected.count("?") >= 2:
            break
    if len(collected) < 40:
        collected = text[:max_chars].rsplit(" ", 1)[0].rstrip(".,;:") + "."
    return collected.strip()


def news_id(title: str) -> str:
    return hashlib.md5(title.lower().strip().encode()).hexdigest()[:10]


def get_body(entry, url: str) -> str:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "aside", "figure", "header"]):
                tag.decompose()
            paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
            full_text = " ".join(p for p in paragraphs if len(p) > 40)
            if len(full_text) > 80:
                return summarise(full_text, max_chars=280)
    except Exception:
        pass

    raw = entry.get("summary", "") or entry.get("description", "")
    clean = BeautifulSoup(raw, "html.parser").get_text(separator=" ")
    return summarise(" ".join(clean.split()), max_chars=280)


#  SCRAPE

def scrape_financial_news() -> list[dict]:
    by_source: dict[str, list[dict]] = {f["name"]: [] for f in RSS_FEEDS}
    seen_ids: set[str] = set()

    for feed_info in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_info["url"])
        except Exception as e:
            print(f"  [WARN] {feed_info['name']}: {e}")
            continue

        for entry in feed.entries[:MAX_PER_FEED]:
            title = entry.get("title", "").strip()
            if not title or not is_financial(title):
                continue

            pub_dt = parse_published(entry)
            if not is_within_24h(pub_dt):
                continue

            uid = news_id(title)
            if uid in seen_ids:
                continue
            seen_ids.add(uid)

            url = entry.get("link", "#")
            body = get_body(entry, url)
            if not body or len(body) < 30:
                continue

            published_iso = pub_dt.isoformat() if pub_dt else datetime.now(timezone.utc).isoformat()

            by_source[feed_info["name"]].append({
                "id":        uid,
                "title":     title,
                "body":      body,
                "source":    feed_info["name"],
                "url":       url,
                "published": published_iso,
            })

        random.shuffle(by_source[feed_info["name"]])

    final: list[dict] = []
    source_queues = [q for q in by_source.values() if q]
    random.shuffle(source_queues)

    while len(final) < NEWS_PER_RUN and source_queues:
        still_has_items = []
        for queue in source_queues:
            if len(final) >= NEWS_PER_RUN:
                break
            if queue:
                final.append(queue.pop(0))
                if queue:
                    still_has_items.append(queue)
        source_queues = still_has_items

    final.sort(key=lambda x: x.get("published", ""), reverse=True)
    return final


#  SAVE + LOG

def update_news():
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Updating financial news…")

    final = scrape_financial_news()

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps({
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "count":      len(final),
        "news":       final,
    }, indent=2, ensure_ascii=False))

    print(f"{len(final)} stories saved")

#  SCHEDULER

if __name__ == "__main__":
    print("Financial News Scraper Started…")
    print(f"Refreshing every {REFRESH_SECONDS}s ({REFRESH_SECONDS // 60} minutes)\n")

    update_news()

    scheduler = BlockingScheduler()
    scheduler.add_job(update_news, "interval", seconds=REFRESH_SECONDS)
    scheduler.start()