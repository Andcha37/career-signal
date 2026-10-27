import skill from './skill-text.js';
let engine=null;
export async function generate(rows,target,from,to,onStatus=()=>{},mode='keywords'){
 if(!navigator.gpu)throw new Error('WebGPU를 사용할 수 없습니다.');
 onStatus('로컬 AI 모델 다운로드 및 초기화');
 const {CreateMLCEngine}=await import('https://esm.sh/@mlc-ai/web-llm@0.2.85');
 if(!engine)engine=await CreateMLCEngine('Qwen2.5-1.5B-Instruct-q4f16_1-MLC',{initProgressCallback:p=>onStatus(p.text||'AI 초기화 중')});
 const refs=rows.slice(0,12).map((a,i)=>'[S'+(i+1)+'] '+a.title+' | '+a.publisher+' | '+a.published_at.slice(0,10)+' | '+a.source+' | '+(a.issue||'')).join('\n');
 const description=mode==='company'?'기업 분석: 실적·전략·투자·사업변화·기술·규제·채용에 관한 이슈를 근거 강도에 따라 정리. 채용공고가 없는 한 채용 확대를 단정하지 말 것.':'직무·키워드 분석: 중요한 변화와 취업에 필요한 역량을 신중하게 해석할 것.';
 const prompt='대상: '+target+'\n조사기간: '+from+' ~ '+to+'\n조사유형: '+mode+'\n'+description+'\n다음은 기사 본문이 아닌 공개 검색 결과 메타데이터다. 제목을 그대로 옮기거나 문장 인용하지 말고 한국어로 독립적으로 재서술해 분석보고서를 작성하라. 출처번호는 각 사실을 뒷받침하는 표식이며 직접 인용이 아니다. 확인된 사실과 해석·미검증 사항을 반드시 구분하라.\n'+refs;
 const r=await engine.chat.completions.create({messages:[{role:'system',content:skill},{role:'user',content:prompt}],temperature:.15,max_tokens:1400});
 const text=r.choices?.[0]?.message?.content?.trim();
 if(!text||!text.includes('[S'))throw new Error('생성 결과의 근거 표기가 불충분합니다.');
 const refsUsed=[...text.matchAll(/\[S(\d+)\]/g)].map(m=>Number(m[1]));
 if(refsUsed.some(n=>n<1||n>Math.min(12,rows.length)))throw new Error('잘못된 출처 인용 번호가 포함되어 있습니다.');
 return text;
}
