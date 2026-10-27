// 26 career families and 215 roles. Public taxonomy; no user data or API keys.
const rows = `
AI·데이터·통계|ai-data|데이터 분석가~data analyst,데이터 사이언티스트~data scientist,머신러닝 엔지니어~machine learning,AI 연구원~AI research,데이터 엔지니어~data engineering,MLOps 엔지니어~MLOps,BI 분석가~business intelligence,통계 분석가~statistics,인과추론 연구원~causal inference,생성형 AI 기획~generative AI
소프트웨어·개발|sw|프론트엔드 개발~frontend,백엔드 개발~backend,풀스택 개발~full stack,모바일 앱 개발~mobile development,클라우드 엔지니어~cloud computing,DevOps·SRE~DevOps,QA·테스트~software testing,게임 개발~game development,시스템 개발~systems programming,오픈소스 개발~open source
보안·네트워크|cyber|보안 분석~security analyst,보안 엔지니어~security engineering,침해대응~incident response,클라우드 보안~cloud security,네트워크 엔지니어~network engineering,개인정보 보호~data privacy,보안 감사~security audit,디지털 포렌식~digital forensics
제품·UX·디자인|product|프로덕트 매니저~product manager,프로덕트 오너~product owner,UX 리서치~user research,UI/UX 디자인~UX design,서비스 기획~service design,기술기획~technical product,프로덕트 분석~product analytics,디자인 시스템~design systems
마케팅·광고·브랜드|marketing|디지털 마케팅~digital marketing,브랜드 매니저~brand management,퍼포먼스 마케팅~performance marketing,콘텐츠 마케팅~content marketing,CRM 마케팅~CRM,시장조사~market research,홍보·PR~public relations,광고기획~advertising,그로스 마케팅~growth marketing
영업·사업개발|sales|B2B 영업~B2B sales,B2C 영업~retail sales,사업개발~business development,글로벌 영업~international sales,기술영업~technical sales,영업기획~sales operations,채널·파트너십~channel partnerships,고객성공~customer success
전략·컨설팅·경영|strategy|경영전략~corporate strategy,전략 컨설팅~management consulting,경영기획~corporate planning,사업기획~business planning,신사업 개발~new ventures,경영혁신~business transformation,인수합병~mergers acquisitions,기업 분석~industry analysis
재무·회계·세무|finance|재무관리~corporate finance,회계~accounting,세무~taxation,재무분석 FP&A~financial planning,감사~financial auditing,내부통제~internal controls,자금·Treasury~treasury,IR~investor relations
금융·보험·투자|finserv|은행 디지털~digital banking,은행 영업·여신~commercial banking,투자 리서치~investment research,자산운용~asset management,증권 트레이딩~securities trading,보험 계리~actuarial science,보험 심사~insurance underwriting,핀테크~fintech,리스크 관리~financial risk
인사·조직·운영|hr|채용·TA~talent acquisition,인사기획~HR strategy,교육·조직개발~learning development,보상·급여~compensation benefits,노무·ER~labor relations,HR 애널리틱스~people analytics,총무·운영~business operations,조직문화~organizational culture
제조·생산·품질|manufacturing|생산관리~production management,공정 엔지니어~process engineering,품질관리 QA~quality assurance,품질보증 QC~quality control,제조 자동화~factory automation,산업안전~industrial safety,설비·보전~industrial maintenance,산업공학~industrial engineering
물류·구매·유통|supply|SCM~supply chain,구매·소싱~procurement,물류 운영~logistics,유통기획~retail operations,재고·수요예측~demand forecasting,국제무역~international trade,해운·항만~shipping ports,전자상거래 운영~ecommerce
반도체·전자·하드웨어|semi|반도체 설계~chip design,반도체 공정~semiconductor process,반도체 패키징~advanced packaging,전기전자 설계~electrical engineering,임베디드 SW~embedded systems,통신 장비~telecom equipment,로봇 하드웨어~robotics hardware,반도체 장비~semiconductor equipment
에너지·환경·ESG|energy|재생에너지~renewable energy,전력·전력망~power grid,배터리·저장~battery storage,탄소·기후~climate policy,ESG·지속가능성~sustainability,석유·가스~oil and gas,환경공학~environmental engineering,원자력~nuclear energy
바이오·의료·제약|bio|제약 연구개발~drug discovery,임상시험~clinical trials,바이오인포매틱스~bioinformatics,의료기기~medical devices,의료 데이터~health data,의료행정~healthcare management,약사·제약~pharmaceuticals,간호·보건~nursing public health,정밀의료~precision medicine
교육·학술·연구|edu|교수·강의~higher education,교육기획~learning design,에듀테크~edtech,학술 연구~academic research,과학교육~STEM education,직업훈련~vocational training,교육행정~education administration,교육평가~educational assessment
미디어·콘텐츠·엔터|media|방송·영상 제작~video production,언론·기자~journalism,콘텐츠 기획~content strategy,출판·편집~publishing,음악·엔터~music industry,OTT·스트리밍~streaming media,게임 운영~gaming industry,크리에이터 비즈니스~creator economy
디자인·예술·패션|creative|그래픽 디자인~graphic design,시각·브랜딩~visual identity,산업디자인~industrial design,패션·MD~fashion merchandising,공간디자인~interior design,애니메이션~animation,사진·영상 디자인~visual production,예술기획~arts management
법률·컴플라이언스|legal|변호·법무~legal services,컴플라이언스~regulatory compliance,특허·지식재산~intellectual property,개인정보 법무~privacy law,정책 분석~public policy,행정·규제~government regulation,조사·감사~compliance investigations,거버넌스~corporate governance
건설·부동산·인프라|construction|건축설계~architecture,토목·인프라~civil engineering,건설 PM~construction management,부동산 개발~real estate development,시설관리~facility management,도시계획~urban planning,스마트시티~smart cities,감정평가·부동산 금융~real estate finance
호텔·관광·외식|hospitality|호텔 운영~hotel management,관광·여행 기획~tourism,리조트 경영~resort management,외식·F&B~food beverage,항공 서비스~airline passenger,이벤트·MICE~event management,식품 서비스~food service,레저·스포츠 서비스~leisure industry
식품·농업·소비재|food|식품 연구개발~food science,식품 품질~food safety,식품 마케팅~food marketing,농업기술~agritech,농업 경영~agriculture,소비재 기획~consumer goods,유통식품 MD~food merchandising,푸드테크~foodtech
자동차·모빌리티·항공|mobility|자동차 개발~automotive engineering,전기차 EV~electric vehicles,자율주행~autonomous vehicles,SDV·차량 SW~software defined vehicle,항공우주~aerospace,철도·교통~rail transportation,모빌리티 서비스~mobility services,항공 운영~airline operations
공공·국제기구·비영리|government|공공행정~public administration,국제기구~international organizations,NGO·비영리~nonprofit,국제개발~international development,외교·통상~diplomacy trade,국방·안보 정책~defense policy,공공 데이터~open government data,사회복지~social work
자연과학·수학·공학|science|수학·응용수학~applied mathematics,물리·광학~physics optics,화학·소재~materials chemistry,기계공학~mechanical engineering,화학공학~chemical engineering,기초 연구~fundamental research,지구과학~earth science,우주·천문~space science
생활서비스·직업기술|service|전기·배관 기술~electricians plumbers,기계 정비~mechanical maintenance,미용·웰니스~beauty wellness,조리·셰프~culinary careers,고객 상담~contact center,보육·돌봄~childcare eldercare,시설 보안~physical security,스포츠 트레이너~fitness training
`.trim().split('\n');
export const families = rows.map(row => {
  const [name,id,entries]=row.split('|');
  const roles=entries.split(',').map((item,i)=>{
    const [name,term]=item.split('~');
    return {id:id+'-'+(i+1),name,term};
  });
  return {id,name,roles,search:roles.slice(0,3).map(r=>r.term).join(' ')};
});
export const allRoles=families.flatMap(f=>f.roles.map(r=>({...r,familyId:f.id,familyName:f.name})));
