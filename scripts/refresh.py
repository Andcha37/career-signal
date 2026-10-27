import json,datetime,urllib.request,urllib.parse,xml.etree.ElementTree as ET,hashlib,time
from pathlib import Path
categories={"ai-data":"machine learning AI data analyst","sw":"software engineering","cyber":"cybersecurity","product":"product management","marketing":"digital marketing","sales":"business development","strategy":"business strategy","finance":"finance accounting","finserv":"fintech banking","hr":"human resources hiring","manufacturing":"manufacturing","supply":"supply chain logistics","semi":"semiconductor","energy":"renewable energy","bio":"healthcare biotechnology","edu":"education","media":"media entertainment","creative":"design fashion","legal":"regulation legal","construction":"construction real estate","hospitality":"tourism hospitality","food":"food agriculture","mobility":"automotive aerospace","government":"government policy","science":"scientific research","service":"consumer services"}
out=[];seen=set()
for family,query in categories.items():
    try:
        q=urllib.parse.quote(query+' when:30d')
        req=urllib.request.Request('https://news.google.com/rss/search?q='+q+'&hl=en-US&gl=US&ceid=US:en',headers={'User-Agent':'CareerSignalAcademic/1.0'})
        with urllib.request.urlopen(req,timeout=12) as r: root=ET.fromstring(r.read(1_500_000))
        for item in root.findall('./channel/item')[:18]:
            title=item.findtext('title','').strip()
            if not title or title.lower() in seen:continue
            link=item.findtext('link','')
            if not link.startswith('https://'):continue
            from email.utils import parsedate_to_datetime
            pub=parsedate_to_datetime(item.findtext('pubDate')).astimezone(datetime.timezone.utc)
            if pub < datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=34):continue
            seen.add(title.lower());out.append({'id':hashlib.sha256(link.encode()).hexdigest()[:16],'title':title,'url':link,'publisher':item.findtext('source','Google News'),'published_at':pub.isoformat(),'kind':'news','family_ids':[family],'date_kind':'published'})
        print(family,len(out))
    except Exception as e:print('collection failed for',family,type(e).__name__)
    time.sleep(.15)
p=Path('data/news.json');p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps({'generated_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'coverage_note':'Google News RSS의 직무별 상위 공개 기사 메타데이터를 수집했습니다. 전체 웹을 포괄하지 않으며 기사 본문은 수집하지 않습니다.','articles':out},ensure_ascii=False,indent=2),encoding='utf-8')
print('items',len(out))
