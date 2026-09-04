import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

interface Result {
  title: string;
  price: string;
  location: string;
  imageUrl: string | undefined;
  link: string;
}

const cleanText = (value: string | undefined) =>
  (value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeUrl = (value: string | undefined) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `https://www.tori.fi${value}`;
  return `https://www.tori.fi/${value}`;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://www.tori.fi/recommerce/forsale/search?q=${encodeURIComponent(
        query.trim()
      )}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Tori responded with ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const seen = new Set<string>();
    const results: Result[] = [];

    $("article.sf-search-ad").each((_, el) => {
      const article = $(el);

      const nameEl = article.find("h2").first();
      const title = cleanText(nameEl.text());

      let price = "";
      const priceDiv = article.find(".font-bold.whitespace-nowrap").first();
      if (priceDiv.length) {
        const span = priceDiv.find("span").first();
        price = cleanText(span.text());
      }

      if (!price) {
        article.find("span").each((__, spanEl) => {
          const text = cleanText($(spanEl).text());
          if (!price && /\d/.test(text) && text.includes("€")) {
            price = text;
          }
        });
      }

      let location = cleanText(
        article.find(".text-xs.s-text-subtle span, .location, [data-testid='location']").first().text()
      );
      if (!location) {
        article.find("span").each((__, spanEl) => {
          const text = cleanText($(spanEl).text());
          if (!location && /[A-Za-zÅÄÖåäö]/.test(text) && !/[0-9€]/.test(text)) {
            location = text;
          }
        });
      }

      const imageUrl =
        article.find("img").first().attr("src") ||
        article.find("img").first().attr("data-src") ||
        undefined;

      const href = article.find("a.sf-search-ad-link").first().attr("href");
      const link = normalizeUrl(href || article.find("h2 a").first().attr("href"));

      if (!title || !link) return;

      const key = `${title}-${price}-${link}`;
      if (seen.has(key)) return;
      seen.add(key);

      results.push({
        title,
        price,
        location,
        imageUrl,
        link,
      });
    });

    console.log("Löydettiin", results.length, "tulosta");
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Haku epäonnistui:", error);
    return NextResponse.json({ error: "Haku epäonnistui" }, { status: 500 });
  }
}
