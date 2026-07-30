# Testing VFM

Two layers: automated unit tests for the logic that is easy to get subtly wrong,
and a manual checklist for the flows that need a real browser.

---

## Automated tests

```bash
npm test
```

Runs `tests/*.test.ts` with Node's built-in test runner. No database, no network,
no API key needed — these are pure-function tests and finish in about a second.

| File | Covers |
|---|---|
| `tests/ai.test.ts` | Chat history trimming, JSON extraction from model output, the response schema, image-type validation, and the mock fixture |
| `tests/rate-limit.test.ts` | Limit enforcement, per-key isolation, window reset, caller identification, response headers |

Three of these guard bugs that were live in the first build, so they are worth
keeping rather than deleting if they ever start failing:

- **`trimHistoryForApi` drops the seeded assistant greeting.** The chat UI opens
  with an assistant message. It used to be forwarded to the API as the first
  turn, which Anthropic rejects — every *first* follow-up question failed.
- **`extractJSON` is not confused by a brace in trailing prose.** The old version
  took everything between the first `{` and the last `}`, so any stray brace after
  the JSON broke parsing.
- **The mock fixture recommends a listing that isn't the cheapest.** The premise
  of the product is that best value ≠ lowest price. If the fixture recommended
  the cheapest listing, the recommendation path would never be exercised.

Before pushing:

```bash
npm run check      # typecheck + lint + tests
```

---

## Manual checklist

Run through this after any change to search, auth, or the database.

**Setup:** put `VFM_MOCK_SEARCH=1` in `.env` to do the whole pass without
spending money. Do at least one pass with a real `ANTHROPIC_API_KEY` and
`VFM_MOCK_SEARCH=0` before deploying, since mock mode never calls Anthropic.

```bash
npm run db:setup && npm run dev
```

### 1. First load
- [ ] Home page loads with no console errors
- [ ] Sidebar shows "Log in to keep your search history."
- [ ] The loading spinner rotates when a search is running

### 2. Signup
- [ ] "Log in / Sign up" opens the dialog with focus in the first field
- [ ] **Escape** closes it; **Tab** cycles inside it and never escapes to the page behind
- [ ] Password under 8 characters is rejected with a visible message
- [ ] Signing up with a **mixed-case** email works, and the sidebar then shows it lower-cased
- [ ] Signing up again with the same address (any casing) says the account already exists

### 3. Login / logout / session
- [ ] Log out, then log back in with the **lower-case** form of that mixed-case address
- [ ] Wrong password and unknown email give the *same* message ("Incorrect email or password.")
- [ ] Reload the page while logged in — you stay logged in
- [ ] Log out — on-screen results are cleared and the sidebar lists empty

### 4. Text search
- [ ] Search "Sony WH-1000XM5" — three cards appear from three different stores
- [ ] Exactly one card carries the **✦ VFM PICK** badge
- [ ] That badge is on the listing matching `recommendation`, which is **not always the first card**
- [ ] Value-for-money bars show a score and never overflow their track
- [ ] A listing with no link shows "No direct link found" instead of a dead button
- [ ] "Show Full Comparison Table" expands and scrolls sideways on a narrow screen without moving the page

### 5. Image search
- [ ] Upload a JPEG or PNG — the thumbnail appears, then results render
- [ ] Upload a HEIC file — a clear "Unsupported image type" message, not a crash
- [ ] Upload something over ~3 MB — a clear "image is too large" message

### 6. Save and track
- [ ] Heart a listing → toast confirms, heart fills
- [ ] Bell a listing → toast confirms, bell turns amber
- [ ] Both appear under the sidebar "Saved" tab
- [ ] Reload — they are still there
- [ ] Un-heart → it disappears from the sidebar
- [ ] Logged out, clicking heart or bell prompts login instead of silently failing

### 7. Search history (the one that used to cost money)
- [ ] After a search, the query appears in the sidebar History tab
- [ ] Click it → the same results reappear
- [ ] **Confirm in the server log that this fired `GET /api/history/[id]` and NOT `POST /api/search`.** Reopening history must never trigger a paid call.

### 8. Follow-up chat
- [ ] Ask the **first** question via a quick chip — you get a reply, not an error
      (this is the case that used to fail every time)
- [ ] Ask a second question — the reply follows on from the first
- [ ] Logged out, the panel says login is required and the send is blocked

### 9. Rate limiting
- [ ] Logged out, run 6 searches — the 6th returns "Search limit reached…"
- [ ] Log in — searching works again immediately

### 10. Mobile (375px wide)
- [ ] Sidebar is hidden; a ☰ button appears
- [ ] ☰ opens the drawer over a dimmed background; ✕ and the backdrop both close it
- [ ] Both buttons are comfortably tappable — no precise aiming required
- [ ] The page never scrolls sideways
- [ ] Cards stack full width and text does not overflow

### 11. Keyboard and screen reader
- [ ] Tab through the page — focus is always visible
- [ ] Every control reachable and operable by keyboard alone
- [ ] Save/track buttons announce their state ("Remove … from saved" vs "Save … listing")
- [ ] With "reduce motion" enabled in the OS, animations stop and the verdict appears at once

### 12. Error handling
- [ ] Stop the dev server mid-search — a readable error, no stack trace on screen
- [ ] Set `ANTHROPIC_API_KEY` to a bogus value and unset `VFM_MOCK_SEARCH` — a clear
      "AI service isn't configured" message rather than a 500
- [ ] Visit `/nonexistent-page` — the styled 404 renders

### 13. Production build
- [ ] `npm run build` succeeds with no errors or lint failures
- [ ] `npm start` serves the app and search still works

---

## Quick API checks

With the dev server running:

```bash
# Unauthenticated chat must be rejected
curl -s -X POST localhost:3000/api/chat \
  -H 'Content-Type: application/json' -d '{"userMessage":"hi"}'
# → {"error":"Log in to ask follow-up questions.","code":"unauthorized"}
```

```bash
# Empty search must be a 400 with a helpful message, not a 500
curl -s -X POST localhost:3000/api/search \
  -H 'Content-Type: application/json' -d '{}'
# → {"error":"Enter a product to search for, or upload a photo.","code":"bad_request",...}
```

```bash
# Anonymous rate limit: the 6th call in an hour should be refused
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/api/search \
    -H 'Content-Type: application/json' -d '{"query":"test"}'
done
# → 200 200 200 200 200 429
```
