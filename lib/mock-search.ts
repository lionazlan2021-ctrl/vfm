import type { ParsedSearchResult } from "./ai";

/**
 * Sample search results used when VFM_MOCK_SEARCH=1.
 *
 * This exists so the whole product — results, comparison table, save, track,
 * history, chat — can be exercised end to end without spending money on
 * Anthropic calls. The shape matches exactly what `searchProducts` returns from
 * a live call, so nothing downstream can tell the difference.
 *
 * The numbers below are invented for development. They are deliberately NOT
 * "cheapest wins": the recommendation points at listing 2, which costs more
 * than listing 3 but is new rather than refurbished — that's the value-for-money
 * judgment the real prompt is meant to make, and it keeps the UI honest about
 * rendering a recommendation that isn't just the lowest price.
 */
export function mockSearch(query: string, fromImage: boolean): ParsedSearchResult {
  const product = fromImage
    ? "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones (Black)"
    : query.trim() || "Unspecified product";

  return {
    productSummary: `${product} — sample data (VFM_MOCK_SEARCH is on, no live search was run)`,
    listing1: {
      store: "Amazon",
      price: "$328.00",
      originalPrice: "$399.99",
      condition: "New",
      shipping: "Free shipping",
      delivery: "2-3 business days",
      warranty: "1 year manufacturer",
      sellerRating: 4.7,
      valueScore: 8,
      buyUrl: "https://www.amazon.com/",
      emoji: "📦",
      pros: ["Lowest price among new units", "Fast Prime delivery"],
      cons: ["Sold by a third-party seller, so returns route through them"],
      aiReason:
        "Cheapest new unit found, but the third-party seller means returns are slower than buying direct — still the best price-to-trust balance here.",
    },
    listing2: {
      store: "Best Buy",
      price: "$349.99",
      originalPrice: "$399.99",
      condition: "New",
      shipping: "Free shipping",
      delivery: "1-2 business days",
      warranty: "1 year manufacturer + 15-day returns",
      sellerRating: 4.6,
      valueScore: 9,
      buyUrl: "https://www.bestbuy.com/",
      emoji: "🛒",
      pros: ["Sold and shipped direct, not a marketplace seller", "In-store returns"],
      cons: ["$22 more than the cheapest new listing"],
      aiReason:
        "Costs $22 more than Amazon but ships direct with in-store returns and faster delivery — worth the premium if you might return it.",
    },
    listing3: {
      store: "Walmart",
      price: "$289.00",
      originalPrice: null,
      condition: "Refurbished",
      shipping: "Free shipping",
      delivery: "3-5 business days",
      warranty: "90 days seller warranty",
      sellerRating: 4.2,
      valueScore: 6,
      buyUrl: "https://www.walmart.com/",
      emoji: "🏬",
      pros: ["$60 below the cheapest new unit"],
      cons: ["Refurbished, not new", "90-day warranty instead of a full year", "Slowest delivery"],
      aiReason:
        "The low price is explained by refurbished condition and a 90-day warranty — a real saving only if you're comfortable with both.",
    },
    verdict:
      "Buy the Best Buy listing at $349.99. It's $22 more than Amazon, but it ships direct rather than through a marketplace seller, arrives a day sooner, and can be returned in store — worth the difference on a $300+ purchase. Take the Walmart refurbished unit only if saving $60 matters more to you than a full-year warranty.",
    recommendation: 2,
  };
}
