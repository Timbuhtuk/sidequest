import assert from 'node:assert/strict';
const base='http://localhost:3000';
for(const [route,title,image] of [['/','SIDEQUEST','/og.png'],['/deus-ex','Deus Ex','/deus-ex-og.png'],['/witcher-3','Ведьмак 3','/witcher-cover.jpg']]){
 const response=await fetch(base+route);assert.equal(response.status,200,route);const source=await response.text();
 const actualTitle=source.match(/<title>(.*?)<\/title>/s)?.[1];assert(actualTitle?.includes(title),`${route} title: ${actualTitle}`);
 const ogImage=source.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/)?.[1];assert(ogImage?.endsWith(image),`${route} OG image mismatch`);assert(ogImage.startsWith('https://deus-ex-achievement-protocol.tymofii-pankovsky10.chatgpt.site/'));
 for(const key of ['og:title','og:description','twitter:title','twitter:description'])assert(source.includes(`="${key}"`),`${route}: ${key}`);
 console.log(`PASS: ${route} HTTP 200, correct title and independent absolute social preview.`);
}
for(const asset of ['/witcher-cover.jpg','/witcher-landscape.jpg']){const r=await fetch(base+asset);assert.equal(r.status,200);assert(r.headers.get('content-type')?.startsWith('image/'));console.log(`PASS: ${asset}`)}
