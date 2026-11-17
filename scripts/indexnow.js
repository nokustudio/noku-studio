// Tells Bing (and other IndexNow engines: Yandex, Seznam, Naver) about every page in the
// live sitemap. Run after publishing changes or adding products:
//   node scripts/indexnow.js            submit
//   node scripts/indexnow.js --dry-run  list what would be sent
// The key is public by design; IndexNow checks it against /<key>.txt on the site.
// ponytail: manual run; hook it to deploys if products change often
const HOST = 'www.nokustudio.in';
const KEY = '9b8a76f5e9aba7b1f65b37cfe0331054';

(async () => {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  if (!urlList.length) throw new Error('No URLs found in sitemap');

  if (process.argv.includes('--dry-run')) {
    console.log(urlList.join('\n'));
    console.log(`\n${urlList.length} URLs (dry run, nothing sent)`);
    return;
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
  });
  // 200 = accepted, 202 = accepted (key check pending), 403 = key file not found/doesn't match
  console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URLs`);
  if (res.status >= 300) process.exitCode = 1;
})();
