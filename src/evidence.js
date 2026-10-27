// Select diverse, traceable headline evidence for locally generated company reports.
// Topic grouping is heuristic: it groups *coverage*, not validated independent events.
export function topicKey(row){
 const t=String(row?.title||'').toLowerCase();
 if(/(?:\bai\b|\bax\b|인공지능|생성형)/i.test(t)&&/(?:활용|업무|혁신|전환|경험|페스티벌|festival|적용|확산|교육|도입)/i.test(t))return '조직 내 AI·AX 활용';
 if(/기본자본|자본비율|지급여력|킥스|k-ics|건전성|capital ratio/i.test(t))return '자본·건전성';
 if(/민원|소비자|보상|주주환원|배당|complaint|consumer protection/i.test(t))return '소비자·주주 관련 쟁점';
 if(/특약|특허|보험료|신상품|상품출시|특화상품|discount|patent/i.test(t))return '상품·서비스';
 if(/일본|해외진출|해외시장|international expansion|overseas/i.test(t))return '해외사업';
 if(/후원|kpga|스포츠대회|sponsor/i.test(t))return '후원·사회활동';
 if(/브리핑|오늘의 .* 소식|종합|모음|roundup/i.test(t))return '종합 뉴스';
 return row?.issue||'기타 뉴스';
}
export function evidenceGroups(rows){
 const groups=new Map();
 for(let i=0;i<rows.length;i++){
  const key=topicKey(rows[i]);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({index:i+1,article:rows[i]});
 }
 return [...groups].map(([topic,articles])=>({topic,count:articles.length,articles}))
  .sort((a,b)=>b.count-a.count);
}
export function selectEvidence(rows,mode='keywords',limit=12){
 if(mode!=='company')return rows.slice(0,limit).map((article,i)=>({index:i+1,article,topic:article.issue||'자료'}));
 const groups=evidenceGroups(rows);
 // Take up to two reports from each thematic cluster. This reduces repeated coverage
 // of the same development while retaining multiple publishers when present.
 const selected=[];
 for(let round=0;round<2;round++){
  for(const group of groups){
   if(selected.length>=limit)break;
   const found=group.articles[round];
   if(found)selected.push({...found,topic:group.topic});
  }
 }
 return selected.sort((a,b)=>a.index-b.index);
}
