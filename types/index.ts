export type Listing = {
  store: string;
  price: string;
  originalPrice?: string | null;
  condition?: string;
  shipping?: string;
  delivery?: string;
  warranty?: string;
  sellerRating?: number;
  valueScore?: number;
  buyUrl?: string;
  emoji?: string;
  imageUrl?: string;
  pros?: string[];
  cons?: string[];
  aiReason?: string;
};

export type SearchResult = {
  productSummary?: string;
  listing1?: Listing;
  listing2?: Listing;
  listing3?: Listing;
  verdict?: string;
  recommendation?: number;
  error?: string;
};

export type ChatTurn = { role: "user" | "assistant"; text: string };

export type User = { id: string; email: string; name: string };
