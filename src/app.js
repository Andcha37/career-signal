import {families,allRoles} from './taxonomy.js';
import {keywords,monthBack,selectArticles,briefing} from './research.js';
const root=document.getElementById('root');
const today=new Date().toLocaleDateString('en-CA');
let mode='roles',selected=new Set(),articles=[],essay='',filter='';
const el=(tag,cls,text)=>{let node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node};
const add=(parent,tag,cls,text)=>{let node=el(tag,cls,text);parent.append(node);return node};
function button(parent,title,action,cls='button'){let b=add(parent,'button',cls,title);b.type='button';b.addEventListener('click',action);return b}
root.innerHTML='';
const shell=add(root,'main','layout');const nav=add(shell,'header','topbar');add(nav,'div','brand','◉ CAREER SIGNAL');add(nav,'div','topnote','GLOBAL CAREER INTELLIGENCE · PRIVATE BY DESIGN');
const hero=add(shell,'section','hero');add(hero,'div','eyebrow','RESEARCH BRIEFING / CLIENT-SIDE AI');add(hero,'h1','title','직무와 산업의 변화를\n근거로 읽다.');add(hero,'p','subtitle','관심 직무 또는 키워드를 선택하면 최근 한 달의 공개 뉴스에서 관련 기사를 먼저 정리하고, 브라우저 내 AI가 출처 중심의 한국어 리서치 에세이를 작성합니다.');
const body=add(shell,'div','content');const left=add(body,'section','panel control');const right=add(body,'section','panel results');
add(left,'h2','','01 / Research Parameters');const switcher=add(left,'div','switcher');
const a=button(switcher,'직무 선택',()=>setMode('roles'),'tab active');const b=button(switcher,'직접 키워드 입력',()=>setMode('keywords'),'tab');
const roleUI=add(left,'div','role-area');
const search=add(roleUI,'input','input');search.placeholder='직무 검색 (예: 데이터, 마케팅, 금융)';
const stat=add(roleUI,'div','subtle','선택 0 / '+allRoles.length);
const actions=add(roleUI,'div','actions');
button(actions,'전체 선택',()=>{selected=new Set(allRoles.map(x=>x.id));drawRoles()},'small');
button(actions,'선택 해제',()=>{selected.clear();drawRoles()},'small');
const roleList=add(roleUI,'div','role-list');
function drawRoles(){stat.textContent='선택 '+selected.size+' / '+allRoles.length;roleList.replaceChildren();let q=search.value.trim().toLowerCase();for(const f of families){let candidates=f.roles.filter(r=>!q||(r.name+' '+r.term+' '+f.name).toLowerCase().includes(q));if(!candidates.length)continue;let details=add(roleList,'details','family');details.open=!!q;let summary=add(details,'summary','',''+f.name+' · '+candidates.filter(r=>selected.has(r.id)).length+'/'+f.roles.length);summary.setAttribute('aria-label',f.name);let grid=add(details,'div','role-grid');for(const r of candidates){let label=add(grid,'label','role');let box=add(label,'input');box.type='checkbox';box.checked=selected.has(r.id);box.addEventListener('change',()=>{box.checked?selected.add(r.id):selected.delete(r.id);stat.textContent='선택 '+selected.size+' / '+allRoles.length});add(label,'span','',r.name)}}}
search.addEventListener('input',drawRoles);drawRoles();
const keywordUI=add(left,'div','keyword-area hidden');add(keywordUI,'p','hint','쉼표 또는 줄바꿈으로 키워드를 구분해 입력하세요. 최대 12개까지 검색합니다.');
const input=add(keywordUI,'textarea','input keyword');input.placeholder='예: 인공지능 에이전트, causal inference, digital transformation';input.maxLength=700;
function setMode(next){mode=next;a.classList.toggle('active',next==='roles');b.classList.toggle('active',next==='keywords');roleUI.classList.toggle('hidden',next!=='roles');keywordUI.classList.toggle('hidden',next!=='keywords');}
add(left,'h3','control-label','RESEARCH WINDOW');const date=add(left,'input','input');date.type='date';date.value=today;date.max=today;
const windowHint=add(left,'p','hint');const setHint=()=>windowHint.textContent=monthBack(date.value)+' — '+date.value+' (최근 1개월)';date.addEventListener('change',setHint);setHint();
const start=button(left,'Research 시작 →',run,'start');
add(left,'p','privacy','🔒 Research 클릭 전 AI 실행 없음 · API Key 불필요 · 직무 선택 외부 전송 없음');
add(right,'h2','','02 / Research Results');const status=add(right,'p','status','직무 또는 키워드를 선택하고 Research를 눌러주세요.');
const items=add(right,'div','items');const essayTitle=add(right,'h3','section-title','Research Essay');const output=add(right,'div','essay','분석 전입니다.');
essayTitle.hidden=true;output.hidden=true;
async function run(){const terms=mode==='roles'?[...selected].map(id=>allRoles.find(r=>r.id===id)?.term).filter(Boolean):keywords(input.value);if(!terms.length){status.textContent='검색 직무 또는 키워드를 1개 이상 선택하세요.';return}start.disabled=true;items.replaceChildren();output.hidden=true;essayTitle.hidden=true;status.textContent='공개 뉴스 색인을 불러오는 중...';try{const res=await fetch('./data/news.json',{cache:'no-store'});if(!res.ok)throw Error('뉴스 데이터 접근 실패 HTTP '+res.status);const index=await res.json();const rows=selectArticles(index,{terms,date:date.value});articles=rows;status.textContent='검색 결과 '+rows.length+'건 · 수집 갱신: '+(index.generated_at||'미실행')+' · 기사 전문 미수집';if(!rows.length){add(items,'p','notice','일치하는 기사가 없습니다. GitHub Actions의 Refresh public news index를 실행하거나 다른 검색어를 시도하세요.');return}add(items,'h3','section-title','Top Stories');for(let i=0;i<rows.length;i++){let x=rows[i];let card=add(items,'article','news-card');let line=add(card,'div','eyebrow','S'+(i+1)+' · '+(x.publisher||'Unknown')+' · '+x.published_at.slice(0,10));let link=add(card,'a','article-title',x.title);link.href=x.url;link.target='_blank';link.rel='noopener noreferrer';add(card,'p','hint','원문 보기 ↗')}essayTitle.hidden=false;output.hidden=false;output.textContent='자료 요약 생성 중...';let from=monthBack(date.value),topic=mode==='roles'?[...selected].map(id=>allRoles.find(r=>r.id===id)?.name).filter(Boolean).slice(0,10).join(', '):terms.join(', ');const fallback=briefing(rows,topic,from,date.value);output.textContent=fallback+'\n\n브라우저 내 AI 모델을 로딩하는 중입니다. WebGPU가 없는 기기에서는 이 근거 기반 브리핑으로 대체합니다.';try{const {generate}=await import('./webllm.js');let text=await generate(rows,topic,from,date.value,msg=>{status.textContent='기사 '+rows.length+'건 · '+msg});output.textContent=text+'\n\n※ 기사 제목·날짜·출처 메타데이터 기반 분석. 기사 본문을 검증한 연구가 아닙니다.';status.textContent='브라우저 내 AI 완료 · '+rows.length+'건';}catch(err){output.textContent=fallback+'\n\n※ 로컬 AI를 실행할 수 없어 규칙 기반 브리핑을 표시했습니다: '+(err?.message||'기기 호환성 오류');}}catch(err){status.textContent='리서치 실패: '+(err?.message||'알 수 없는 오류')}finally{start.disabled=false}}
button(right,'보고서 복사',async()=>{if(!articles.length)return;let text=output.textContent+'\n\n'+articles.map((a,i)=>'[S'+(i+1)+'] '+a.title+' '+a.url).join('\n');try{await navigator.clipboard.writeText(text);status.textContent='보고서를 클립보드에 복사했습니다.'}catch{status.textContent='클립보드 접근이 제한되었습니다.'}},'small');
add(shell,'footer','footer','CAREER SIGNAL · No operator LLM API costs · Public headline index · Locally executed analysis');
