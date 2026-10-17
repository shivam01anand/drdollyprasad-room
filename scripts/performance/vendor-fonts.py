"""Vendor the existing Google Fonts locally with content hashes and OFL licenses.
Run manually when updating fonts; normal builds never contact Google.
"""
from pathlib import Path
import re,hashlib,urllib.request
from concurrent.futures import ThreadPoolExecutor
import os
os.chdir(Path(__file__).resolve().parents[2])
url='https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Devanagari:wght@500&family=Cormorant+Garamond:ital,wght@1,500&display=swap'
request=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'})
css=urllib.request.urlopen(request).read().decode()
Path('public/fonts').mkdir(parents=True,exist_ok=True)
assets={};faces=[]
for m in re.finditer(r'(?:/\*\s*(.*?)\s*\*/\s*)?@font-face\s*\{(.*?)\}',css,re.S):
 subset,body=m.groups();values={k:v.strip() for k,v in re.findall(r'([a-z-]+):\s*([^;]+);',body)}
 family=values['font-family'].strip("'");slug=family.lower().replace(' ','-');url=re.search(r'url\((.*?)\)',values['src']).group(1)
 if url not in assets:
  weight='' if family=='Instrument Sans' else '-'+values['font-weight']
  assets[url]=f'{slug}-{values["font-style"]}{weight}-{subset}.woff2'
 faces.append((body,url))
def download(pair):
 url,name=pair;data=urllib.request.urlopen(url).read();assert data[:4]==b'wOF2';digest=hashlib.sha256(data).hexdigest()[:12];name=name.removesuffix('.woff2')+'.'+digest+'.woff2' if hasattr(name,'removesuffix') else name[:-6]+'.'+digest+'.woff2';Path('public/fonts',name).write_bytes(data);return url,name,len(data)
with ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(download,assets.items()))
paths={u:'/fonts/'+n for u,n,_ in results}
local=['/* The same Google Fonts files served locally, with their original coverage and weights. */']
for body,url in faces:local.append('@font-face {'+body.replace(url,paths[url])+'}')
Path('app/fonts.css').write_text('\n'.join(local)+'\n')
preloads=[]
for body,url in faces:
 if any(x in paths[url] for x in ['instrument-sans-normal-latin.','cormorant-garamond-italic-500-latin.','ibm-plex-mono-normal-400-latin.','ibm-plex-sans-devanagari-normal-500-devanagari.']):
  if paths[url] not in preloads:preloads.append(paths[url])
Path('lib/welcome-fonts.json').write_text(__import__('json').dumps(preloads,indent=2))
for family in ['instrumentsans','cormorantgaramond','ibmplexmono','ibmplexsansdevanagari']:
 text=urllib.request.urlopen('https://raw.githubusercontent.com/google/fonts/main/ofl/'+family+'/OFL.txt').read();Path('public/fonts',family+'-OFL.txt').write_bytes(text)
print('Local font files',len(results),'bytes',sum(n for _,_,n in results));print('Welcome fonts:',preloads)
