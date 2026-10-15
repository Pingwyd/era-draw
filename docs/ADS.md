# Ads in Era Draw

All ad code is gated by the consent banner (`consent.js`, category `ads`). Nothing loads before **Accept** (or Ads enabled under Customize / Settings → Privacy); Reject or offline = no ad code. Ads never show during active gameplay (only pause, results and home).

## Providers (`ads.js` → `AD_CONFIG`)
| provider | banners | rewarded (Shop) | interstitial |
|---|---|---|---|
| `adsterra` (default) | sandboxed `srcdoc` iframe per slot (no same-origin, no top navigation) | "sponsored link" (open in new tab, reward after ≥15 s away, 5/day, 3 min cooldown) | none |
| `adsense` | `<ins class="adsbygoogle">` units at top level | H5 Games Ads `adBreak({type:'reward'})` – button enabled by `beforeReward`, coins granted only on `adViewed` (cap `rewardCap`/day, `rewardCooldown`) | `adBreak({type:'next'})` on results, every `interstitialEvery` runs, ≥ `interstitialMinGap` ms apart |

AdSense cannot run inside a sandboxed srcdoc iframe, so with `provider:'adsense'` its script (`adsbygoogle.js?client=…`, with `data-ad-frequency-hint`) is loaded on the top-level page – still only after consent.

## Switching to AdSense
1. Wait for the site (pingwyd.github.io) to be approved in AdSense.
2. Create three display ad units (pause, results, home) and paste their slot IDs into `AD_CONFIG.adsense.slots`. Empty slot = that banner is skipped.
3. In AdSense → *Games* enable H5 Games Ads (for rewarded/interstitial). `h5:false` disables them.
4. Set `AD_CONFIG.provider='adsense'`, run `/tmp/reg.sh`, ship. The privacy page text and the consent "Personalised ads" checkbox switch automatically.
5. To roll back, set `provider:'adsterra'`.

## Personalisation
With AdSense, the Customize panel shows **Personalised ads**. Off (or Reject) → `adsbygoogle.requestNonPersonalizedAds=1` before the script loads. Stored as `adp` in `eradraw.consent`.

## ads.txt / verification
- `<meta name="google-adsense-account" content="ca-pub-2853919516364773">` is in `index.html`.
- `ads.txt` (this repo) and, more importantly, the root-domain one at https://pingwyd.github.io/ads.txt (repo `Pingwyd/pingwyd.github.io`) contain:
  `google.com, pub-2853919516364773, DIRECT, f08c47fec0942fa0`
- On localhost, H5 ads run in test mode (`data-adbreak-test="on"`).

## Adcash zones (`AD_CONFIG.adcash`)
- `{enabled:true, banner:'12319166', interstitial:'12319258'}`; `aclib.js` (`id="aclib"`) loads once, top level, only after ads consent and online.
- Display 300x100 (`aclib.runBanner`) fills the pause / results / home slots whenever the AdSense slot ID for that placement is empty (an inline script is inserted inside the slot so it renders there). Collapses if nothing renders within 7 s.
- Interstitial (`aclib.runInterstitial`) only on the results screen, at most every 3rd run and 3 min apart. AdSense `next` interstitial is off to avoid stacking.
- Shop reward: AdSense H5 rewarded when an ad is offered; otherwise falls back to the sponsored-link reward.
- Autotag (zone 7h02lstdl5) was removed.
