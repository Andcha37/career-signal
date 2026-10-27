export function keywords(s){return [...new Set(s.slice(0,700).split(/[,;\n，]+/).map(x=>x.trim()).filter(x=>x.length>=2))].slice(0,12)}
export function monthBack(s){let d=new Date(s+'T12:00:00');let m=d.getMonth(),day=d.getDate();d.setDate(1);d.setMonth(m-1);let last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d.toISOString().slice(0,10)}
export function eligible(article,from,to){if(!article?.title||!article?.url||!article?.published_at)return false;try{let url=new URL(article.url);if(url.protocol!=='https:')return false;}catch{return false}const dt=article.published_at.slice(0,10);return dt>=from&&dt<=to}
export function selectArticles(index,selection){const start=monthBack(selection.date);const terms=selection.terms.map(x=>x.toLowerCase());const tokens=selection.terms.flatMap(x=>x.toLowerCase().split(/\s+/).filter(y=>y.length>2));const seen=new Set();return (index.articles||[]).filter(a=>eligible(a,start,selection.date)).map(a=>{const title=a.title.toLowerCase();const hits=terms.filter(t=>title.includes(t)||t.split(' ').filter(x=>x.length>2).every(x=>title.includes(x)));const overlap=tokens.filter(t=>title.includes(t)).length;return {...a,relevance:hits.length*15+overlap*2+(a.kind==='news'?3:0),hits}}).filter(a=>a.relevance>0).filter(a=>{const key=a.title.toLowerCase().replace(/\W/g,'');if(seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>b.relevance-a.relevance||b.published_at.localeCompare(a.published_at)).slice(0,70)}
export function briefing(items,target,from,to,mode='keywords'){
 const total=items.length;
 const sources=[...new Set(items.map(a=>a.source||a.publisher))].join(', ');
 const categories=new Map();
 for(const a of items){const category=a.issue||((a.kind==='research')?'연구·학술':(a.kind==='community')?'커뮤니티 동향':'산업·기업 뉴스');categories.set(category,(categories.get(category)||0)+1)}
 const top=[...categories].sort((a,b)=>b[1]-a[1]).slice(0,4);
 const lines=[
 '# '+target+' 리서치 보고서',
 '',
 '조사 기간: '+from+' ~ '+to,
 '조사 대상: '+target,
 '자료 범위: 공개 검색 서비스의 기사·게시물·학술 메타데이터 '+total+'건 (출처: '+sources+')',
 '',
 '## 1. 핵심 요약',
 '이번 조사에서 확인한 자료는 '+top.map(([category,n])=>category+' '+n+'건').join(', ')+'으로 구분된다. 이는 수집된 공개 자료의 주제 분포이며 기업 실적이나 채용시장 전반에 대한 확정적인 통계는 아니다.',
 '',
 '## 2. 주요 이슈 및 근거',
 ...top.map(([category,n])=>{
   const refs=items.map((a,i)=>a.issue===category||(!a.issue&&category===(a.kind==='research'?'연구·학술':a.kind==='community'?'커뮤니티 동향':'산업·기업 뉴스'))?'[S'+(i+1)+']':null).filter(Boolean).slice(0,3);
   return '### '+category+'\n관련 검색 결과 '+n+'건이 확인된다. 이 범주의 이슈가 관측되지만, 사건의 구체적인 원인과 영향은 연결된 원문으로 검증할 필요가 있다. '+refs.join(' ');
 }),
 '',
 '## 3. 산업·사업·직무에 미치는 영향',
 mode==='company'?'이러한 이슈는 기업의 경영환경과 사업 우선순위를 이해하기 위한 단서다. 기사 제목만으로 경영성과의 변화나 실제 채용계획을 단정할 수 없다.':'공개 자료에서 드러난 주제는 관련 직무의 산업 환경을 파악하는 단서다. 역량 수요의 변화는 실제 채용공고와 교차 확인해야 한다.',
 '',
 '## 4. 취업 준비 시사점',
 '관련 기업의 공식 발표 및 채용공고를 확인하고, 지원 직무의 요구 역량과 이번에 파악한 이슈를 연결해 준비하는 것이 합리적이다.',
 '',
 '## 5. 한계와 추가 확인 사항',
 '이 보고서는 AI 모델 분석이 불가능한 환경에서 생성한 규칙 기반 요약이다. 기사 본문을 직접 검증하지 않았으며 특정 이슈의 인과관계나 채용 규모를 추정하지 않는다. 근거 자료는 위에 표시된 원문 링크로 확인할 수 있다.'
 ];
 return lines.join('\n');
}
