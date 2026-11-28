// IndexNow: tell Bing and other engines about the site's URLs right after a deploy.
//   node scripts/indexnow.mjs --dry-run              print the request body, send nothing
//   node scripts/indexnow.mjs                        read dist/sitemap.xml and submit
//   node scripts/indexnow.mjs --from-live            read https://dhruvkothari.com/sitemap.xml and submit
// The key is public by design: the file public/<key>.txt proves ownership, so it must be live before a real submit.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KEY = '26adaa305e0fcdbfc4494fa69f9434ce';
const HOST = 'dhruvkothari.com';
const args = new Set(process.argv.slice(2));

const xml = args.has('--from-live')
  ? await fetch(`https://${HOST}/sitemap.xml`).then((r) => { if (!r.ok) throw new Error(`sitemap ${r.status}`); return r.text(); })
  : readFileSync(join(import.meta.dirname, '../dist/sitemap.xml'), 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const body = { host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList };

if (args.has('--dry-run')) { console.log(JSON.stringify(body, null, 2)); process.exit(0); }
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
console.log(`IndexNow ${r.status} ${r.statusText} for ${urlList.length} urls`);
process.exit(r.ok ? 0 : 1);
