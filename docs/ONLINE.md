# Era Draw — Online multiplayer + chat (design plan, not built)

Status: plan only. LAN play (`#/lan`) already works without any server: it uses WebRTC data channels, a host that runs the authoritative fixed-tick sim, 15 Hz snapshots and 20 Hz inputs. Online play can reuse that netcode. Over the internet, the two missing pieces are **signalling** (exchanging the offer and answer automatically instead of by QR) and **NAT traversal** (STUN, with TURN as the relay fallback). Accounts, rooms, matchmaking and chat sit on top of those.

## 1. Architecture options

| Option | What runs where | Pros | Cons |
|---|---|---|---|
| **A. Cloudflare Workers + Durable Objects (recommended)** | One Durable Object per room. It holds WebSocket connections, relays signalling and chat, and can relay game traffic when P2P fails. | Global edge, room state is naturally single-threaded, WebSockets with hibernation are cheap when idle, no servers to patch. | Some Cloudflare-specific code. Durable Objects need the Workers Paid plan. |
| **B. Small Node WebSocket server on Fly.io or Render** | One process (`ws` + in-memory rooms, Redis if you scale out). | Plain Node, easy to reason about, the same code runs locally. | You own uptime and scaling. Free tiers sleep or cold-start. A second region needs sticky routing. |
| **C. PeerJS (hosted or self-hosted PeerServer)** | Signalling only. Peers then talk over WebRTC as in LAN mode. | Fastest to prototype. Almost no backend code. | Still needs your own TURN. The public PeerServer has no SLA. Chat, moderation and rooms would have to be built elsewhere. |
| **D. Firebase (Firestore/RTDB signalling + Auth)** | Offer and answer documents per room. Auth for accounts. Chat stored in Firestore. | Auth, persistence and security rules are built in, plus a generous free tier. | Vendor lock-in. Polling and listener costs grow with chat volume. Moderation needs Cloud Functions. |

**Recommendation:** Option A. Durable Objects handle signalling, the room lobby and chat. Game traffic stays peer-to-peer over WebRTC, using the existing LAN netcode. When P2P fails (symmetric NAT, strict mobile carriers), fall back to **TURN** (Cloudflare Calls TURN or Twilio/Metered) or to relaying snapshots through the room's WebSocket. Snapshots are about 3–6 KB at 15 Hz, roughly 45–90 KB/s per joiner, which a WebSocket relay handles fine.

## 2. Netcode reuse
- The host-authoritative model is unchanged. The host device runs the sim and the others send inputs. Seeded RNG and a fixed timestep (already in place) make reconnection and spectating straightforward.
- **Signalling:** `hostInvite()`/`joinWith()` already produce compact `EDL1~…` codes. Online, these are sent through the room socket instead of by QR or paste. ICE candidates can trickle, so there is no need to wait for gathering to finish.
- **ICE servers:** `[{urls:'stun:stun.cloudflare.com:3478'}, {urls:'turn:…', username, credential}]`. TURN credentials are minted per session by the server (short-lived, HMAC), so they are never shipped in the client.
- **Host migration (later):** the host streams a full snapshot every 5 s. If the host drops, the lowest-latency peer can resume from the latest snapshot and the RNG state.

## 3. Rooms and matchmaking
- **Room codes:** 6 characters, for example `INK-4F7Q`. Join links look like `https://pingwyd.github.io/era-draw/#/online/INK-4F7Q`.
- **Public quick-match:** a matchmaker Durable Object keeps queues keyed by `era + difficulty + region`. It fills rooms of 2–4 players and starts after 20 s with whoever is present.
- **Lobby:** ready-checks, host era/difficulty selection, kick, and spectate slots. Rooms close 2 minutes after they empty.
- **Region:** pick by the Cloudflare colo, or by client-measured RTT to 3–4 regions. Mostly relevant for the TURN fallback.

## 4. Chat with moderation
- **Lobby chat** is text, 200 characters max, with rate limits of 1 message per second and 10 per 30 s per user. In-run chat is **quick-chat only**, using preset phrases ("Revive me!", "Boss incoming", "Nice draw") and pings on the minimap. This keeps play safe and readable on small screens.
- **Filtering:** messages are filtered server-side before broadcast.
  1. Normalise leetspeak and Unicode.
  2. Run a blocklist and regex pass (an open list such as LDNOOBW, plus your own).
  3. Optionally call a moderation API for anything that gets past the list.
  4. Strip URLs and emails.
- **Safety:** mute and block per user, report with an attached chat log (kept 7 days), and server-side shadow mute. Chat is off by default for players who state they are under 13. Content is sanitised as text, never HTML. If any child-directed audience is expected, check COPPA/GDPR-K first.
- **Storage:** none for live chat beyond the room's lifetime. Reports go to a KV or D1 table.

## 5. Accounts and identity
- **Phase 1:** anonymous device IDs plus a display name (filtered), with no PII.
- **Phase 2 (optional):** sign in with Apple/Google via Firebase Auth or Cloudflare Access to enable cross-device saves, a global leaderboard (the existing `#/leaderboard` stub) and friends.
- **Anti-cheat:** the host is authoritative per room, so a cheating host only affects their own room. Global leaderboard entries should be validated by replaying the seed and input log on the server (possible because the sim is deterministic).

## 6. What you would need to provide

| Item | Why | Where |
|---|---|---|
| Cloudflare account + Workers Paid plan (~$5/mo) | Durable Objects, WebSockets, KV/D1 | dash.cloudflare.com |
| `wrangler` API token (Workers + DO edit) stored as a GitHub Actions secret | CI deploy of the signalling/chat worker | Cloudflare → API Tokens |
| TURN provider key (Cloudflare Calls TURN, Twilio, or Metered.ca) | NAT fallback for roughly 10–20% of mobile sessions | provider console |
| Optional moderation API key | Chat filtering beyond the blocklist | provider console |
| Optional custom domain (e.g. `play.eradraw.app`) | Nicer join links and a cookie/CORS boundary | any registrar |
| Optional Firebase project (if Option D, or for Auth) | Accounts / cross-device saves | console.firebase.google.com |
| Decisions | Age gating, chat on/off by default, data retention, region list | — |

## 7. Rough cost (check current pricing before committing)
- **Hobby scale (≤100 concurrent players):** Workers Paid at $5/mo covers the DO requests and duration for signalling and chat. TURN is pay-per-GB (typically about $0.05–0.40/GB). With about 15% of sessions relayed at 60 KB/s × 20 min, that is about 70 MB per relayed session, so roughly $1–10/mo. **Total: about $5–15/mo.**
- **Growth (1–2k concurrent):** about $20–80/mo for DO and WebSockets, plus TURN at $50–300/mo depending on the relay share. A moderation API, if used, is usually cents per thousand messages.
- **Fly.io/Render alternative:** about $5–25/mo per always-on small VM per region, plus TURN at the same rates.

## 8. Rollout plan (when approved)
1. Signalling Durable Object plus a `#/online` page with room codes. Reuses `lan.js` with STUN, and adds TURN once it is available.
2. Lobby chat with filter, rate limits, mute and report. In-run quick-chat and pings.
3. Public matchmaking queues.
4. Optional accounts, a global leaderboard validated by seed/input replay, and host migration.

Every step keeps the existing offline/LAN modes working, and the service worker continues to cache the client.
