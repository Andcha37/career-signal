/**
 * Career Signal licensed-news API gateway.
 * No feed extraction, scraping or bypass of publisher access controls.
 * The news API is disabled unless an operator confirms their data-use rights.
 * Secrets remain in Cloudflare Worker Secrets (never in public GitHub or a URL).
 */
const VERSION='2026-10-28-licensed-api-v3';
const ALLOWED_ORIGIN='https://andcha37.github.io';
const CORS={'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{...CORS,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s}
function safeUrl(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}}
function licenseReady(env){return !!(env?.GNEWS_API_KEY&&env?.GNEWS_USAGE_APPROVED==='true')}
function day(s){if(typeof s!=='string')return null;const d=new Date(s);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):null}
function deduplicate(articles){
 const seen=new Set();return articles.filter(a=>{
 const key=a.title.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu,'').slice(0,140);
 if(!key||seen.has(key))return false;seen.add(key);return true;
 });
}
function normalize(data,from,to){
 return deduplicate((Array.isArray(data?.articles)?data.articles:[]).map(a=>({
  title:String(a?.title||'').trim(),
  url:a?.url,
  published_at:day(a?.publishedAt),
  publisher:String(a?.source?.name||'GNews').slice(0,160),
  source:'GNews API',kind:'news',date_kind:'published'
 })).filter(a=>a.title&&safeUrl(a.url)&&a.published_at>=from&&a.published_at<=to));
}
async function searchGnews(q,from,to,lang,env){
 const url=new URL('https://gnews.io/api/v4/search');
 url.searchParams.set('q',q);
 url.searchParams.set('lang',lang);
 url.searchParams.set('max','10');
 url.searchParams.set('from',from+'T00:00:00Z');
 url.searchParams.set('to',to+'T23:59:59Z');
 const r=await fetch(url.toString(),{
  method:'GET',
  headers:{'X-Api-Key':env.GNEWS_API_KEY,'Accept':'application/json'},
  redirect:'error',
  signal:AbortSignal.timeout(12000)
 });
 if(!r.ok){
  // Never reflect upstream bodies or API credentials to visitors.
  throw Error('GNews API HTTP '+r.status+(r.status===403?' (quota or entitlement)':''));
 }
 const j=await r.json();
 return normalize(j,from,to);
}
export default {async fetch(request,env={}){
 const origin=request.headers.get('Origin');
 if(origin&&origin!==ALLOWED_ORIGIN)return json({ok:false,error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 if(request.method!=='GET')return json({ok:false,error:'Method not allowed'},405);
 const url=new URL(request.url);
 if(url.pathname==='/health')return json({ok:true,version:VERSION,provider:'GNews API',newsEnabled:licenseReady(env),note:'No upstream request made by health check.'});
 if(url.pathname!=='/search')return json({ok:false,error:'Not found'},404);
 const q=(url.searchParams.get('q')||'').trim(),from=url.searchParams.get('from')||'',to=url.searchParams.get('to')||'';
 if(q.length<2||q.length>90||!validDate(from)||!validDate(to)||from>to||new Date(to)-new Date(from)>40*86400000)return json({ok:false,error:'Invalid search parameters'},400);
 if(!licenseReady(env))return json({
  ok:false,code:'NEWS_API_NOT_ENABLED',articles:[],sources:[],
  error:'정식 뉴스 API 이용권이 확인되지 않아 뉴스 검색이 비활성화되어 있습니다. Cloudflare Worker Secret(GNEWS_API_KEY)과 이용권 확인 설정(GNEWS_USAGE_APPROVED=true)이 필요합니다.'
 },503);
 const lang=/[가-힣]/.test(q)?'ko':'en';
 try{
  const articles=await searchGnews(q,from,to,lang,env);
  return json({ok:true,version:VERSION,articles,
   sources:[{source:'GNews API',success:true,count:articles.length,status:'ok'}],
   searched_at:new Date().toISOString(),
   note:'Licensed provider metadata only; no full article content, no publisher-page scraping.'});
 }catch(err){
  return json({ok:false,code:'NEWS_API_ERROR',articles:[],
   error:err?.message||'News provider failed',
   sources:[{source:'GNews API',success:false,count:0,status:err?.message||'Provider error'}]},502);
 }
}};
