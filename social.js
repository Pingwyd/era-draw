'use strict';
// ================= UPDATE: SOCIAL + REPLAY =================
// ---- seeded runs: every run has a seed; the simulation RNG is derived from it ----
let RUN_SEED=null;
runHooks.unshift(G=>{G.seed=(RUN_SEED!=null?RUN_SEED:Math.floor(Math.random()*4294967295))>>>0;RUN_SEED=null;G.rng=mulberry(G.seed)});
