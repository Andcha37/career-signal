import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './news-gateway.js';
const originalFetch=globalThis.fetch;
const rss='<?xml version="1.0"?><rss version="2.0"><channel><title>Google News</title><item><title>현대해상 새 사업 발표 - 테스트언론</title><link>https://news.google.com/rss/articles/abc</link><pubDate>Wed, 28 Oct 2026 01:00:00 GMT</pubDate><source url="https://example.com">테스트언론</source></item></channel></rss>';
function request(p){return new Request('https://career-signal.example'+p)}
test('health returns a distinct gateway version',async()=>{const r=await worker.fetch(request('/health'));assert.equal(r.status,200);assert.equal((await r.json()).ok,true)});
test('normal Google News RSS yields one deduplicated story',async()=>{
 globalThis.fetch=async()=>new Response(rss,{status:200,headers:{'content-type':'application/rss+xml'}});
 try{const r=await worker.fetch(request('/search?q='+encodeURIComponent('현대해상')+'&from=2026-09-28&to=2026-10-28'));const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));assert.equal(j.articles.length,1,JSON.stringify(j));assert.equal(j.articles[0].publisher,'테스트언론');}finally{globalThis.fetch=originalFetch}
});
test('upstream unavailable returns explicit 502, not false zero matches',async()=>{
 globalThis.fetch=async()=>new Response('blocked',{status:429});
 try{const r=await worker.fetch(request('/search?q='+encodeURIComponent('현대해상')+'&from=2026-09-28&to=2026-10-28'));const j=await r.json();assert.equal(r.status,502);assert.equal(j.ok,false);assert.match(j.sources[0].status,/429/);}finally{globalThis.fetch=originalFetch}
});
