// Company research planning and conservative Korean issue classification.
export const ISSUE_GROUPS=[
 {id:'performance',label:'실적·재무',patterns:['earnings','revenue','profit','sales growth','quarterly','guidance','실적','매출','영업이익','적자','흑자','profitability','forecast']},
 {id:'strategy',label:'투자·전략·인수합병',patterns:['acquisition','merger','investment','funding','partnership','joint venture','expansion','restructur','투자','인수','합병','제휴','사업재편','파트너십']},
 {id:'technology',label:'제품·기술·혁신',patterns:['launch','release','product','technology','research','artificial intelligence','chip','software','platform','출시','신제품','기술','혁신','인공지능','플랫폼','개발']},
 {id:'employment',label:'채용·인사·조직',patterns:['hiring','recruit','layoff','workforce','talent','jobs','headcount','employees','채용','고용','인사','인력','구조조정','감원','정리해고']},
 {id:'regulation',label:'규제·법률·리스크',patterns:['lawsuit','antitrust','regulation','investigation','compliance','data breach','penalty','regulator','privacy','소송','제재','규제','조사','공정위','개인정보','사고']},
 {id:'market',label:'시장·경쟁·사업환경',patterns:['market','competition','demand','customers','supply chain','international','export','prices','시장','경쟁','수요','고객','수출','공급망']}
];
export const ISSUE_QUERIES=['','earnings OR revenue','investment OR acquisition','product OR AI','hiring OR layoffs','regulation OR lawsuit'];
export function issueCategory(article){
 const value=String(article?.title||'')+' '+String(article?.description||'');
 const lower=value.toLowerCase();
 let best=null,score=0;
 for(const group of ISSUE_GROUPS){const n=group.patterns.reduce((s,p)=>s+(lower.includes(p.toLowerCase())?1:0),0);if(n>score){best=group;score=n}}
 return best?.label||'기타 주요 동향';
}
export function companyQueries(name,aliases=[]){
 const main=String(name).trim().slice(0,90);
 if(!main)return [];
 const secondary=aliases.map(s=>String(s).trim().slice(0,80)).filter(Boolean).slice(0,2);
 const names=[main,...secondary];
 // The first query is brand-specific, then cover several distinct corporate issue categories.
 const queries=[...new Set(names)];
 for(const aspect of ['earnings','investment','product','hiring','regulation','strategy'])queries.push(main+' '+aspect);
 return queries.slice(0,8);
}
export function companyMention(article,names){
 const text=(String(article?.title||'')+' '+String(article?.description||'')).toLowerCase();
 return names.some(raw=>{
  let name=String(raw||'').trim().toLowerCase();if(name.length<2)return false;
  const pos=text.indexOf(name);if(pos<0)return false;
  if(!/^[a-z0-9 .&-]+$/i.test(name))return true;
  const isWord=c=>/[a-z0-9]/i.test(c||'');
  const before=text[pos-1],after=text[pos+name.length];
  return !isWord(before)&&!isWord(after);
 });
}
export function matchCompanyArticles(rows,names){
 return rows.filter(a=>companyMention(a,names)).map(a=>({...a,issue:issueCategory(a)}));
}
