const express = require('express');
const fetch = require('node-fetch'); // node 18+ has fetch globally; keep for clarity
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 4000;

// Load products.json (the file you provided)
const products = JSON.parse(fs.readFileSync('./products.json', 'utf8'));

// Gold price cache
let goldCache = { pricePerGram: null, ts: 0 };
const GOLD_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Choose provider: GOLDAPI or METALS-API. We include a small adapter that tolerates different responses.
// Configure via env var PROVIDER = 'GOLDAPI' or 'METALSAPI'
const PROVIDER = process.env.PROVIDER || 'GOLDAPI';
// For GoldAPI: set GOLDAPI_KEY
// For Metals-API: set METALS_API_KEY
const GOLDAPI_KEY = process.env.GOLDAPI_KEY || '';
const METALS_API_KEY = process.env.METALS_API_KEY || '';

// convert troy ounce -> gram factor
const OUNCE_TO_GRAM = 31.1034768;

// Optional fixed gold price override (USD/gram) to avoid external APIs during local dev
const FIXED_GOLD_PRICE = process.env.GOLD_PRICE_PER_GRAM
  ? Number(process.env.GOLD_PRICE_PER_GRAM)
  : null;

// Optional TLS bypass for dev (behind corporate proxy/self-signed certs)
const DISABLE_TLS_VERIFY = process.env.DISABLE_TLS_VERIFY === '1';
const httpsAgent = DISABLE_TLS_VERIFY ? new https.Agent({ rejectUnauthorized: false }) : undefined;

// Fetch gold price per gram in USD with simple provider detection & conversion
async function fetchGoldPricePerGramUSD() {
  const now = Date.now();
  if (goldCache.pricePerGram && (now - goldCache.ts) < GOLD_CACHE_TTL) return goldCache.pricePerGram;

  let pricePerGram;

  // Allow local/dev override
  if (typeof FIXED_GOLD_PRICE === 'number' && !Number.isNaN(FIXED_GOLD_PRICE)) {
    pricePerGram = FIXED_GOLD_PRICE;
  } else
  if (PROVIDER === 'GOLDAPI') {
    // If no key is provided, use a sensible local default instead of failing.
    if (!GOLDAPI_KEY) {
      console.warn('GOLDAPI_KEY not set. Falling back to local default price 80 USD/gram.');
      pricePerGram = 80;
    } else {
      const url = `https://www.goldapi.io/api/XAU/USD`;
      const resp = await fetch(url, { headers: { 'x-access-token': GOLDAPI_KEY }, agent: httpsAgent });
      if (!resp.ok) {
        const body = await resp.text().catch(()=> '');
        throw new Error(`GoldAPI error ${resp.status}: ${body}`);
      }
      const j = await resp.json();
      // GoldAPI example responses include fields like { "metal":"XAU", "currency":"USD", "price":2000.12, "unit":"oz_t" } - price usually per troy ounce.
      // If provider returns "unit" containing "oz" convert; if returns pricePerGram use directly.
      if (j.unit && j.unit.toLowerCase().includes('oz')) {
        pricePerGram = Number(j.price) / OUNCE_TO_GRAM;
      } else if (j.price_per_gram) {
        pricePerGram = Number(j.price_per_gram);
      } else {
        // fallback assume price is per ounce
        pricePerGram = Number(j.price) / OUNCE_TO_GRAM;
      }
    }
  } else if (PROVIDER === 'METALSAPI') {
    if (!METALS_API_KEY) throw new Error('METALS_API_KEY env var not set');
    // metals-api often returns a base USD rates object where rates.XAU = 1 USD equals XAU fraction.
    const url = `https://metals-api.com/api/latest?access_key=${METALS_API_KEY}&base=USD&symbols=XAU`;
    const resp = await fetch(url, { agent: httpsAgent });
    if (!resp.ok) {
      const body = await resp.text().catch(()=> '');
      throw new Error(`Metals-API error ${resp.status}: ${body}`);
    }
    const j = await resp.json();
    // Example metals-api: { base: "USD", rates: { "XAU": 0.000482 }, unit: "per troy ounce" }
    if (j.rates && j.rates.XAU) {
      const rate = Number(j.rates.XAU);
      // If rates.XAU means 1 USD = rate XAU -> price of 1 XAU in USD is 1 / rate
      let pricePerOunceUSD = (rate > 0 && rate < 1) ? (1 / rate) : rate;
      // ensure unit comment - convert ounce->gram
      pricePerGram = pricePerOunceUSD / OUNCE_TO_GRAM;
    } else if (j.price) {
      // direct price per ounce
      pricePerGram = Number(j.price) / OUNCE_TO_GRAM;
    } else {
      throw new Error('Unexpected metals-api response format');
    }
  } else {
    // default fallback for local dev if no provider specified
    pricePerGram = 80;
  }

  goldCache = { pricePerGram, ts: now };
  return pricePerGram;
}

// Price calculation (as spec): Price = (popularityScore + 1) * weight * goldPrice
function calculatePriceUSD(popularityScore, weightGrams, goldPricePerGram) {
  const p = Number(popularityScore);
  const w = Number(weightGrams);
  return (p + 1) * w * goldPricePerGram;
}

// GET /products with optional filters: price_min, price_max, pop_min, pop_max
app.get('/products', async (req, res) => {
  try {
    const goldPrice = await fetchGoldPricePerGramUSD();

    let enriched = products.map(p => {
      const priceUsd = calculatePriceUSD(p.popularityScore, p.weight, goldPrice);
      const popularityOutOf5 = Number((p.popularityScore * 5).toFixed(1)); // 0-5 scale decimal
      return {
        ...p,
        priceUsd: Number(priceUsd.toFixed(2)),
        popularityOutOf5
      };
    });

    // filtering
    const { price_min, price_max, pop_min, pop_max } = req.query;
    if (price_min) enriched = enriched.filter(x => x.priceUsd >= Number(price_min));
    if (price_max) enriched = enriched.filter(x => x.priceUsd <= Number(price_max));
    if (pop_min) enriched = enriched.filter(x => x.popularityOutOf5 >= Number(pop_min));
    if (pop_max) enriched = enriched.filter(x => x.popularityOutOf5 <= Number(pop_max));

    return res.json({ goldPricePerGram: Number(goldPrice.toFixed(4)), count: enriched.length, products: enriched });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'internal error' });
  }
});

app.listen(PORT, () => console.log(`API listening on ${PORT} (PROVIDER=${PROVIDER})`));