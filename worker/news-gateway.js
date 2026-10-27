/**
 * Career Signal free, keyless, bounded news-search gateway.
 * Browser AI stays local; user queries go only to fixed upstream news providers.
 * Google News and Bing News RSS endpoints are public but undocumented and may block automation.
 */
const ALLOWED_ORIGIN='https://andcha37.github.io';
const VERSION='2026-10-28-multi-news-v2';
const MAX_ITEMS=85;
const UPSTREAM_TIMEOUT=9000;
const CORS={
 'Access-Control-Allow-Origin':ALLOWED_ORIGIN,
 'Access-Control-Allow-Methods':'GET, OPTIONS',
 'Access-Control-Allow-Headers':'Content-Type',
 'Vary':'Origin'
};
const CACHE={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function respond(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8',...CACHE,...CORS}})}
function parseDay(s){
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
 const d=new Date(s+'T00:00:00Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s?s:null;
}
function dateOf(s){
 const d=new Date(String(s||''));return !Number.isNaN(d.getTime())?d.toISOString().slice(0,10):null;
}
function nextDay(s){const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)}
function tag(s,name){
 const pattern=new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i');
 return pattern.exec(s)?.[1]||'';
}
function plain(s){
 const table={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ','#39':"'",'#x27':"'"};
 return String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
  .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi,(all,key)=>{
   const norm=key.toLowerCase();if(Object.hasOwn(table,norm))return table[norm];
   if(norm.startsWith('#')){
    const value=norm.startsWith('#x')?parseInt(norm.slice(2),16):parseInt(norm.slice(1),10);
    if(Number.isInteger(value)&&value>0&&value<=0x10ffff)return String.fromCodePoint(value);
   }
   return all;
  }).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
}
function safeLink(s){
 try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}
}
function finalLink(raw,source){
 if(source==='Bing News'){
  try{
   const u=new URL(raw);
   if(u.hostname==='www.bing.com'&&u.pathname==='/news/apiclick.aspx'){
    const target=u.searchParams.get('url');if(target&&safeLink(target))return target;
   }
  }catch{}
 }
 return raw;
}
function parseRSS(xml,from,to,source){
 if(xml.length>1_500_000)throw Error(source+': response too large');
 if(!/<rss(?:\s|>)/i.test(xml)||!/<channel(?:\s|>)/i.test(xml))throw Error(source+': no RSS channel');
 const articles=[],re=/<item\b[^>]*>([\s\S]*?)<\/item>/gi;let match;
 while((match=re.exec(xml))&&articles.length<MAX_ITEMS){
  const item=match[1];
  const title=plain(tag(item,'title'));
  const rawUrl=plain(tag(item,'link'));
  const url=finalLink(rawUrl,source);
  const published_at=dateOf(plain(tag(item,'pubDate')));
  const publisher=plain(tag(item,'News:Source'))||plain(tag(item,'source'))||source;
  if(title&&safeLink(url)&&published_at&&published_at>=from&&published_at<=to){
   articles.push({title,url,published_at,publisher,source,kind:'news',date_kind:'published'});
  }
 }
 return articles;
}
async function upstream(url){
 const response=await fetch(url,{headers:{Accept:'application/rss+xml, application/xml, text/xml'} ,signal:AbortSignal.timeout(UPSTREAM_TIMEOUT),redirect:'follow'});
 if(!response.ok)throw Error('HTTP '+response.status);
 return response.text();
}
async function google(q,from,to,lang){
 const url=new URL('https://news.google.com/rss/search');
 const kr=lang==='ko';
 url.searchParams.set('q',q+' after:'+from+' before:'+nextDay(to));
 url.searchParams.set('hl',kr?'ko':'en-US');
 url.searchParams.set('gl',kr?'KR':'US');
 url.searchParams.set('ceid',kr?'KR:ko':'US:en');
 return parseRSS(await upstream(url),from,to,'Google News');
}
async function bing(q,from,to,lang){
 const url=new URL('https://www.bing.com/news/search');
 url.searchParams.set('q',q);
 url.searchParams.set('format','rss');
 url.searchParams.set('setmkt',lang==='ko'?'ko-KR':'en-US');
 return parseRSS(await upstream(url),from,to,'Bing News');
}
function merge(batches){
 const seen=new Set();
 return batches.flat().sort((a,b)=>b.published_at.localeCompare(a.published_at)).filter(a=>{
  const key=a.title.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu,'').slice(0,160);
  if(!key||seen.has(key))return false;seen.add(key);return true;
 }).slice(0,120);
}
export default {async fetch(request){
 const origin=request.headers.get('Origin');
 if(origin&&origin!==ALLOWED_ORIGIN)return respond({error:'Forbidden origin'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 if(request.method!=='GET')return respond({error:'Method not allowed'},405);
 const u=new URL(request.url);
 if(u.pathname==='/health')return respond({ok:true,version:VERSION,providers:['Google News RSS','Bing News RSS'],note:'Only verifies Worker deployment. Test /search to check news providers.'});
 if(u.pathname!=='/search')return respond({error:'Not found'},404);
 const q=(u.searchParams.get('q')||'').trim();
 const from=parseDay(u.searchParams.get('from')),to=parseDay(u.searchParams.get('to'));
 if(q.length<2||q.length>90||!from||!to||from>to||new Date(to)-new Date(from)>40*864e5)return respond({error:'Invalid query or date range'},400);
 const tasks=[
  {name:'Google News KR',get:()=>google(q,from,to,'ko')},
  {name:'Bing News KR',get:()=>bing(q,from,to,'ko')},
  {name:'Google News EN',get:()=>google(q,from,to,'en')},
  {name:'Bing News EN',get:()=>bing(q,from,to,'en')}
 ];
 const results=await Promise.all(tasks.map(async task=>{
  try{const hits=await task.get();return {source:task.name,success:true,status:'ok',count:hits.length,articles:hits}}
  catch(e){return {source:task.name,success:false,status:String(e?.message||e).slice(0,120),count:0,articles:[]}}
 }));
 const succeeded=results.filter(r=>r.success);
 const articles=merge(results.map(r=>r.articles));
 return respond({ok:succeeded.length>0,version:VERSION,articles,
  sources:results.map(({source,success,status,count})=>({source,success,status,count})),
  error:succeeded.length?'':"모든 뉴스 제공자 연결 실패: 원본 뉴스가 0건이라는 뜻이 아닙니다.",
  searched_at:new Date().toISOString(),note:'Public news search index only, not exhaustive; titles are not full article texts.'},
  succeeded.length?200:502);
}};
