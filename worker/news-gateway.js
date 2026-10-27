/**
 * Career Signal public news search gateway for Cloudflare Workers Free.
 * - Google News RSS: keyless
 * - Strict upstream allowlist, fixed paths, bounded query, no arbitrary URL proxy.
 * - Origin allowlist helps browser access; it is not authentication.
 */
const ALLOWED_ORIGIN='https://andcha37.github.io';
const MAX_ITEMS=80;
const GATEWAY_VERSION='2026-10-28-search-diagnostics';
const CORS={'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store',...CORS}})}
function tag(xml,name){return new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i').exec(xml)?.[1]||''}
function unescapeHTML(t){const entities={'amp':'&','lt':'<','gt':'>','quot':'"','apos':"'",'#39':"'",'#x27':"'",'nbsp':' '};return String(t||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi,(m,n)=>{if(entities[n.toLowerCase()]!==undefined)return entities[n.toLowerCase()];if(n[0]==='#'){const code=n[1].toLowerCase()==='x'?parseInt(n.slice(2),16):parseInt(n.slice(1),10);return Number.isInteger(code)&&code>0&&code<=0x10ffff?String.fromCodePoint(code):m}return m}).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim()}
function day(s){const t=new Date(s);return Number.isFinite(t.getTime())?t.toISOString().slice(0,10):null}
function nextDay(s){const t=new Date(s+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+1);return t.toISOString().slice(0,10)}
function validLink(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}}
function parseRSS(xml,from,to){
 const results=[],re=/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;let m;
 while((m=re.exec(xml))&&results.length<MAX_ITEMS){
  const item=m[1],title=unescapeHTML(tag(item,'title')),url=unescapeHTML(tag(item,'link')),pub=day(tag(item,'pubDate'));
  const src=unescapeHTML(tag(item,'source'))||'Google News';
  if(title&&validLink(url)&&pub&&pub>=from&&pub<=to)results.push({title,url,published_at:pub,publisher:src,source:'Google News',kind:'news',date_kind:'published'});
 }
 return results;
}
async function google(q,from,to,language){
 const loc=language==='en'?{hl:'en-US',gl:'US',ceid:'US:en'}:{hl:'ko',gl:'KR',ceid:'KR:ko'};
 const rss=new URL('https://news.google.com/rss/search');
 rss.searchParams.set('q',q+' after:'+from+' before:'+nextDay(to));
 for(const [key,value]of Object.entries(loc))rss.searchParams.set(key,value);
 const r=await fetch(rss.toString(),{headers:{'User-Agent':'CareerSignalResearch/1.0','Accept':'application/rss+xml, application/xml'}});
 if(!r.ok)throw Error('Google News HTTP '+r.status);
 const xml=await r.text();
 if(xml.length>1_500_000)throw Error('Google RSS response too large');
 if(!/<rss[\\s>]/i.test(xml)||!/<channel[\\s>]/i.test(xml))throw Error('Google returned non-RSS content');
 return parseRSS(xml,from,to);
}
export default {async fetch(request){
 const origin=request.headers.get('Origin');
 if(origin&&origin!==ALLOWED_ORIGIN)return json({error:'origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 if(request.method!=='GET')return json({error:'method not allowed'},405);
 const u=new URL(request.url);
 if(u.pathname==='/health')return json({ok:true,provider:'Career Signal Google News Gateway',google:true,version:GATEWAY_VERSION,note:'Health checks worker only; use /search to test upstream Google News.'});
 if(u.pathname!=='/search')return json({error:'not found'},404);
 const q=(u.searchParams.get('q')||'').trim().slice(0,100),from=u.searchParams.get('from')||'',to=u.searchParams.get('to')||'';
 if(q.length<2||q.length>90||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(from)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(to)||!day(from)||!day(to)||from>to||new Date(to)-new Date(from)>40*864e5)return json({error:'invalid search input or date range'},400);
 const tasks=[
   ['Google News KR',()=>google(q,from,to,'ko')],
   ['Google News EN',()=>google(q,from,to,'en')]
 ];
 const results=await Promise.all(tasks.map(async([name,fn])=>{try{const answer=await fn();return {name,success:true,items:Array.isArray(answer)?answer:answer.results,info:answer.status||'ok'}}catch(e){return {name,success:false,items:[],error:String(e?.message||e).slice(0,100)}}}));
 const all=[],seen=new Set();
 for(const r of results){for(const a of r.items){const key=a.title.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');if(!key||seen.has(key))continue;seen.add(key);all.push(a)}}
 const sources=results.map(r=>({source:r.name,count:r.items.length,success:r.success,status:r.info||r.error}));
 const failed=results.every(r=>!r.success);
 return json({ok:!failed,version:GATEWAY_VERSION,articles:all.slice(0,150),sources,searched_at:new Date().toISOString(),error:failed?'Google News feeds are unavailable; see sources for details.':null,note:'Google News titles and metadata only. Queries and visitor IP can be seen by Cloudflare and the upstream service.'},failed?502:200);
}};
