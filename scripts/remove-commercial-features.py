from pathlib import Path
root=Path(__file__).resolve().parents[1]
def cutdiv(s,t):
 p=s.index(t); o="&lt;div"; c="&lt;/div&gt;"; st=[]; i=0
 while idiv>p:
  a=s.find(o,i,p); b=s.find(c,i,p)
  if adiv>0 and b<0: break
  if a>=0 and (bdiv>0 or a<b): st.append(a); i=a+len(o)
  else:
   if st: st.pop()
   i=b+len(c)
 if not st: raise RuntimeError(f"no div: {t}")
 a=st[-1]; d=1; i=p
 while d:
  x=s.find(o,i); y=s.find(c,i)
  if ydiv>0: raise RuntimeError(f"no close: {t}")
  if x>=0 and xdiv>y: d+=1; i=x+len(o)
  else: d-=1; i=y+len(c)
 return s[:a]+s[i:]
p=root/"popup/constants/html-templates.js"; s=p.read_text()
for t in ("proBadge","pro-block-want-more-header"):
 if t in s:s=cutdiv(s,t)
if '  "plusPromoScreen": ' in s:
 a=s.index('  "plusPromoScreen": ');b=s.index('  "moreScreen": ',a);s=s[:a]+s[b:]
a=s.index('  "moreScreen": ');b=s.index('  "',a+20);m=s[a:b]
for t in ("headerRightLinks","profileInfo","iCloudSyncingSelect","subScreenInfo","popUpMenuListGroupHeaderContainer","myOtherApps"):
 if t in m:m=cutdiv(m,t)
p.write_text(s[:a]+m+s[b:])
p=root/"shared/product/productConfig.js";s=p.read_text()
for t in ("authentication","cloudSync","entitlement"):s=s.replace(f"{t}: true,",f"{t}: false,")
p.write_text(s)
