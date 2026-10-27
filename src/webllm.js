import skill from './skill-text.js';
let engine=null;
export async function generate(rows,target,from,to,onStatus=()=>{}){
 if(!navigator.gpu)throw new Error('WebGPU를 사용할 수 없습니다.');
 onStatus('로컬 모델 다운로드 및 초기화');const {CreateMLCEngine}=await import('https://esm.sh/@mlc-ai/web-llm@0.2.85');
 if(!engine)engine=await CreateMLCEngine('Qwen2.5-1.5B-Instruct-q4f16_1-MLC',{initProgressCallback:p=>onStatus(p.text||'AI 초기화 중')});
 const refs=rows.slice(0,9).map((a,i)=>'[S'+(i+1)+'] '+a.title+' | '+a.publisher+' | '+a.published_at.slice(0,10)).join('\n');
 const r=await engine.chat.completions.create({messages:[{role:'system',content:skill},{role:'user',content:'기간: '+from+'~'+to+'; 관심: '+target+'; 뉴스 제목과 메타데이터:\n'+refs+'\n한국어 에세이 작성. [S1] 형식으로 인용. 제목에서 확인할 수 없는 사실은 주장하지 말 것.'}],temperature:.2,max_tokens:950});
 const text=r.choices?.[0]?.message?.content?.trim();if(!text||!text.includes('[S'))throw new Error('모델 응답에 확인 가능한 출처가 없습니다.');return text;
}