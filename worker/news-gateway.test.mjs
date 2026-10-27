import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './news-gateway.js';
function req(p){return new Request('https://example.workers.dev'+p)}
const search='/search?q='+encodeURIComponent('현대해상')+'&from=2026-09-28&to=2026-10-28';
test('news is disabled by default and makes no provider calls',async()=>{
 const res=await worker.fetch(req(search),{});const j=await res.json();assert.equal(res.status,503);assert.equal(j.code,'NEWS_API_NOT_ENABLED');assert.deepEqual(j.articles,[]);
});
test('health does not expose API keys',async()=>{const j=await (await worker.fetch(req('/health'),{GNEWS_API_KEY:'secret'})).json();assert.equal(j.newsEnabled,false);assert.equal(JSON.stringify(j).includes('secret'),false)});
test('licensed request normalizes official JSON response',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>new Response(JSON.stringify({articles:[{title:'현대해상 발표',url:'https://example.org/a',publishedAt:'2026-10-27T02:00:00Z',source:{name:'Example'}}]}),{status:200,headers:{'Content-Type':'application/json'}});
 try{const r=await worker.fetch(req(search),{GNEWS_API_KEY:'secret',GNEWS_USAGE_APPROVED:'true'});const j=await r.json();assert.equal(r.status,200);assert.equal(j.articles.length,1);assert.equal(j.sources[0].source,'GNews API');}finally{globalThis.fetch=old}
});
test('upstream failure is explicit',async()=>{const old=globalThis.fetch;globalThis.fetch=async()=>new Response('',{status:403});try{const r=await worker.fetch(req(search),{GNEWS_API_KEY:'secret',GNEWS_USAGE_APPROVED:'true'});assert.equal(r.status,502)}finally{globalThis.fetch=old}});
