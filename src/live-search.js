
/**
 * On-demand public-source research. No servers, GitHub tokens, API keys or prebuilt news index.
 * Queries leave the browser and are visible to the queried provider (and to the user's network).
 * This is federated search of specific public indexes, NOT a full web search engine.
 */
export const SOURCES = [
  {id:'gdelt',name:'GDELT Global News',category:'글로벌 뉴스'},
  {id:'hackernews',name:'Hacker News / Algolia',category:'기술·산업 게시물'},
  {id:'crossref',name:'Crossref',category:'연구·학술 문헌'},
  {id:'openalex',name:'OpenAlex',category:'공개 연구·과학 기술'}
];
export const MAX_QUERIES=8;
import {matchCompanyArticles} from './company-research.js';
const MAX_ARTICLES=90;
const API_TIMEOUT=18000;

export function planQueries(terms,cap=MAX_QUERIES){
  const unique=[...new Set(terms.map(v=>String(v).trim()).filter(Boolean))];
  if(unique.length<=cap)return {queries:unique,total:unique.length,partial:false};
  // A reproducible spread across the complete selection, instead of picking only one sector.
  const queries=[];
  for(let i=0;i<cap;i++){const index=Math.min(unique.length-1,Math.floor((i+.5)*unique.length/cap));queries.push(unique[index]);}
  return {queries:[...new Set(queries)],total:unique.length,partial:true};
}
export function isoDay(s){if(typeof s!=='string')return null;const m=s.match(/^(\d{4})-?(\d{2})-?(\d{2})/);if(!m)return null;const d=`${m[1]}-${m[2]}-${m[3]}`;const parsed=new Date(d+'T12:00:00Z');return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===d?d:null}
export function extractCrossrefDate(o){
  for(const key of ['published','published-online','published-print','issued']){
    const p=o?.[key]?.['date-parts']?.[0];
    if(Array.isArray(p)&&p.length===3&&p.every(Number.isInteger))return isoDay(`${p[0]}-${String(p[1]).padStart(2,'0')}-${String(p[2]).padStart(2,'0')}`);
  }
  return null;
}
export function isSafeArticle(a,from,to){
  if(!a?.title||!a?.url||!a?.published_at)return false;
  let u;try{u=new URL(a.url)}catch{return false}
  if(u.protocol!=='https:'||u.username||u.password)return false;
  const day=isoDay(a.published_at);
  return !!day&&day>=from&&day<=to;
}
function exactTermScore(title,query){
  let t=String(title).toLowerCase(), q=String(query).toLowerCase();
  if(t.includes(q))return 6;
  const words=q.split(/\s+/).filter(x=>x.length>=3);
  return words.length?words.filter(x=>t.includes(x)).length/words.length:0;
}
async function requestJSON(url,signal){
  const ctl=new AbortController();
  const timer=setTimeout(()=>ctl.abort(),API_TIMEOUT);
  const abort=()=>ctl.abort();
  signal?.addEventListener('abort',abort,{once:true});
  try{
    const r=await fetch(url,{method:'GET',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:ctl.signal,headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const type=r.headers.get('content-type')||'';
    if(!type.includes('json'))throw new Error('검색 서비스가 JSON을 반환하지 않음');
    return await r.json();
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
function gdeltQ(q){
  const parts=q.split(/\s+/).filter(Boolean).slice(0,8);
  return parts.length>1?'"'+parts.join(' ').replaceAll('"','')+'"':(parts[0]||'');
}
export function gdeltURL(qs,from,to){
  const query=qs.map(gdeltQ).filter(Boolean);
  const expression=query.length>1?'('+query.join(' OR ')+')':query[0];
  const p=new URLSearchParams({query:expression,mode:'artlist',format:'json',maxrecords:'75',sort:'DateDesc',startdatetime:from.replaceAll('-','')+'000000',enddatetime:to.replaceAll('-','')+'235959'});
  return 'https://api.gdeltproject.org/api/v2/doc/doc?'+p;
}
export function hackerURL(q,from,to){
  const start=Math.floor(new Date(from+'T00:00:00Z').getTime()/1000);
  const end=Math.floor(new Date(to+'T23:59:59Z').getTime()/1000);
  const p=new URLSearchParams({query:q,tags:'story',numericFilters:`created_at_i>=${start},created_at_i<=${end}`,hitsPerPage:'24'});
  return 'https://hn.algolia.com/api/v1/search_by_date?'+p;
}
export function crossrefURL(q,from,to){
  const p=new URLSearchParams({'query.bibliographic':q,filter:`from-pub-date:${from},until-pub-date:${to}`,rows:'20',select:'DOI,title,URL,published,published-online,published-print,issued,publisher,type',sort:'relevance'});
  return 'https://api.crossref.org/works?'+p;
}
export function openAlexURL(q,from,to){
 const p=new URLSearchParams({search:q,filter:'from_publication_date:'+from+',to_publication_date:'+to,per_page:'20',select:'id,title,publication_date,doi,primary_location'});
 return 'https://api.openalex.org/works?'+p;
}
export function normalizeOpenAlex(json){
 return (json?.results||[]).map(a=>({title:a.title,url:a.doi||a.id,
 published_at:isoDay(a.publication_date),publisher:a.primary_location?.source?.display_name||'OpenAlex',
 kind:'research',source:'OpenAlex',date_kind:'published'}));
}
export function normalizeGdelt(json){
  return (json?.articles||[]).map(a=>({
    title:a.title,url:a.url,published_at:isoDay(a.seendate),publisher:a.domain||'GDELT',kind:'news',source:'GDELT',
    language:a.language||null,date_kind:'first_seen'
  }));
}
export function normalizeHacker(json){
  return (json?.hits||[]).map(a=>({
    title:a.title,url:a.url||('https://news.ycombinator.com/item?id='+encodeURIComponent(a.objectID)),
    published_at:isoDay(a.created_at),publisher:'Hacker News',kind:'community',source:'Hacker News',
    score:Number(a.points)||0,date_kind:'published'
  }));
}
export function normalizeCrossref(json){
  return (json?.message?.items||[]).map(a=>({
    title:Array.isArray(a.title)?a.title[0]:a.title,
    url:a.URL||('https://doi.org/'+encodeURIComponent(a.DOI||'')),
    published_at:extractCrossrefDate(a),publisher:a.publisher||'Crossref',
    kind:'research',source:'Crossref',date_kind:'published'
  }));
}
export function mergeResults(batches,from,to){
  const seen=new Set();
  return batches.flat().filter(a=>isSafeArticle(a,from,to)).filter(a=>{
    let key=a.url.toLowerCase().replace(/^https:\/\/www\./,'https://').replace(/[?#].*$/,'').replace(/\/$/,'');
    const titleKey=a.title.toLowerCase().replace(/[\p{P}\p{S}\s]/gu,'').slice(0,110);
    if(seen.has(key)||seen.has('t:'+titleKey))return false;
    seen.add(key);seen.add('t:'+titleKey);return true;
  }).sort((a,b)=>(b.relevance||0)-(a.relevance||0)||b.published_at.localeCompare(a.published_at)).slice(0,MAX_ARTICLES)
}
export async function liveResearch({terms,from,to,onProgress=()=>{},signal,companyNames=[]}){
  const plan=planQueries(terms);
  const problems=[];const batches=[];const checked=[];
  const jobs=[];
  // GDELT is the broad news index, queried in 2 batches to avoid overloading its public endpoint.
  if(plan.queries.length){
    const mid=Math.ceil(plan.queries.length/2);
    for(const group of [plan.queries.slice(0,mid),plan.queries.slice(mid)]){
      if(!group.length)continue;
      jobs.push({source:'GDELT',queries:group,query:()=>requestJSON(gdeltURL(group,from,to),signal).then(normalizeGdelt)});
    }
    for(const q of plan.queries.slice(0,6)){
      jobs.push({source:'Hacker News',queries:[q],query:()=>requestJSON(hackerURL(q,from,to),signal).then(normalizeHacker)});
    }
    for(const q of plan.queries.slice(0,4)){
      jobs.push({source:'Crossref',queries:[q],query:()=>requestJSON(crossrefURL(q,from,to),signal).then(normalizeCrossref)});
    }
    for(const q of plan.queries.slice(0,4)){
      jobs.push({source:'OpenAlex',queries:[q],query:()=>requestJSON(openAlexURL(q,from,to),signal).then(normalizeOpenAlex)});
    }
  }
  // Parallel provider calls with bounded total volume. Failed providers don't stop others.
  const all=await Promise.all(jobs.map(async (job,i)=>{
    try{
      const hits=await job.query();
      onProgress({done:true,source:job.source,completed:i,total:jobs.length,success:true,count:hits.length});
      return {source:job.source,hits};
    }catch(e){
      problems.push(job.source+': '+(e?.name==='AbortError'?'응답 시간 초과':e?.message||'검색 실패'));
      onProgress({done:true,source:job.source,completed:i,total:jobs.length,success:false});
      return {source:job.source,hits:[]};
    }
  }));
  for(const {source,hits} of all){checked.push({source,count:hits.length});batches.push(hits);}
  let results=mergeResults(batches,from,to);
  if(companyNames.length)results=matchCompanyArticles(results,companyNames);
  // An API can match body text rather than title; expose relevance conservatively.
  results=results.map(a=>({...a,relevance:Math.max(...plan.queries.map(q=>exactTermScore(a.title,q)),0)+(a.kind==='news'?1:0)}))
    .sort((a,b)=>b.relevance-a.relevance||b.published_at.localeCompare(a.published_at));
  return {articles:results,problems,checked,plan,startedAt:new Date().toISOString(),requestCount:jobs.length};
}
