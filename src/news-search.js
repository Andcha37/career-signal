// Google News search gateway. Deployment URL is configured in config.js.
import {NEWS_GATEWAY_URL} from './config.js';
import {companyMention,issueCategory} from './company-research.js';
const timeout=18000;
export function expandCompanyNames(name,aliases=[]){
 const root=String(name||'').trim();
 const variants={
 '현대':['현대자동차','현대차','Hyundai Motor','현대그룹','현대건설','현대백화점','현대해상'],
 '현대자동차':['현대자동차','현대차','Hyundai Motor'],
 '현대해상':['현대해상','현대해상화재보험','Hyundai Marine & Fire Insurance','Hyundai Marine'],
 '대한항공':['대한항공','Korean Air'],
 '스타벅스':['스타벅스','Starbucks','SCK컴퍼니'],
 '현대차':['현대자동차','현대차','Hyundai Motor'],
 '삼성':['삼성전자','Samsung Electronics','삼성물산','삼성SDI'],
 '네이버':['네이버','NAVER'],
 '카카오':['카카오','Kakao']
 };
 const candidates=[root,...(variants[root]||[]),...aliases].filter(Boolean);
 return [...new Set(candidates)].slice(0,9);
}
export async function searchNews({terms,from,to,mode='keywords',companyNames=[],onProgress=()=>{}}){
 if(!NEWS_GATEWAY_URL)return {articles:[],problems:['구글 뉴스 검색 게이트웨이가 아직 연결되지 않았습니다. Cloudflare Worker 배포 후 src/config.js의 NEWS_GATEWAY_URL을 설정하세요.'],checked:[],configured:false,startedAt:new Date().toISOString()};
 const companyTerms=mode==='company'?expandCompanyNames(companyNames[0],companyNames.slice(1)):terms;
 const qs=[...new Set(companyTerms.map(x=>String(x).trim()).filter(Boolean))].slice(0,mode==='company'?4:3);
 const batches=[],checked=[],problems=[];
 await Promise.all(qs.map(async q=>{
  const url=new URL(NEWS_GATEWAY_URL.replace(/\/$/,'')+'/search');
  for(const [k,v] of Object.entries({q,from,to}))url.searchParams.set(k,v);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
   const res=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal});
   const json=await res.json().catch(()=>({error:'JSON 응답을 받지 못했습니다.'}));
   if(!res.ok)throw Error('News gateway HTTP '+res.status+': '+(json.sources||[]).map(x=>x.source+' '+x.status).join(', ').slice(0,240));
   batches.push(json.articles||[]);
   for(const s of json.sources||[])checked.push(s);
   onProgress();
  }catch(e){problems.push(q+': '+(e?.message||String(e))+(e instanceof TypeError?' (CSP/CORS/네트워크 점검 필요)':''))}finally{clearTimeout(timer)}
 }));
 const providerFailures=[...new Set(checked.filter(x=>!x.success).map(x=>x.source+': '+x.status))];
 if(!batches.flat().length)problems.push(...providerFailures);
 const seen=new Set(),all=[];
 for(const a of batches.flat()){
  if(!a?.title||!a?.url||!a?.published_at||a.published_at<from||a.published_at>to)continue;
  const key=a.title.toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
  if(!key||seen.has(key))continue;seen.add(key);
  // "현대" is ambiguous, so present potential group companies but never imply one company.
  if(mode==='company'&&!companyMention(a,companyTerms))continue;
  all.push({...a,issue:mode==='company'?issueCategory(a):undefined});
 }
 all.sort((a,b)=>b.published_at.localeCompare(a.published_at));
 return {articles:all.slice(0,90),checked,problems,configured:true,startedAt:new Date().toISOString(),scopeNote:mode==='company'&&companyNames[0]==='현대'?'현대는 여러 독립 회사·계열사를 가리킬 수 있습니다. 정확한 기업명을 입력해 범위를 좁히세요.':null};
}
