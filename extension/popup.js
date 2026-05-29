const CATEGORY_MAP = {
  'twitter.com':'Social','x.com':'Social','instagram.com':'Social','facebook.com':'Social',
  'linkedin.com':'Social','reddit.com':'Social','tiktok.com':'Social','threads.net':'Social',
  'notion.so':'Productivity','docs.google.com':'Productivity','drive.google.com':'Productivity',
  'calendar.google.com':'Productivity','mail.google.com':'Productivity','gmail.com':'Productivity',
  'slack.com':'Productivity','linear.app':'Productivity','figma.com':'Productivity',
  'github.com':'Dev','gitlab.com':'Dev','stackoverflow.com':'Dev','vercel.com':'Dev',
  'supabase.com':'Dev','npmjs.com':'Dev','docs.anthropic.com':'Dev',
  'youtube.com':'Learning','udemy.com':'Learning','coursera.org':'Learning',
  'learn.uwaterloo.ca':'Learning',
  'news.ycombinator.com':'News','techcrunch.com':'News','theverge.com':'News',
  'netflix.com':'Entertainment','spotify.com':'Entertainment','twitch.tv':'Entertainment',
};

function getCategory(d){return CATEGORY_MAP[d]??'Other'}

function fmt(s){
  if(s<60)return`${Math.round(s)}s`;
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.round(s%60);
  if(h>0)return`${h}h ${m}m`;
  return`${m}m ${String(sec).padStart(2,'0')}s`;
}

async function load(){
  const{queue=[]}=await chrome.storage.local.get({queue:[]});
  document.getElementById('queue-count').textContent=queue.length;

  const today=new Date().toDateString();
  const map={};
  for(const r of queue.filter(r=>new Date(r.visited_at).toDateString()===today))
    map[r.domain]=(map[r.domain]||0)+r.duration_seconds;

  const sorted=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const el=document.getElementById('top-sites');

  if(!sorted.length){
    el.innerHTML='<div class="empty">no visits yet today</div>';
  } else {
    const max=sorted[0][1];
    el.innerHTML=sorted.map(([d,s],i)=>`
      <div class="list-row">
        <span class="rank${i===0?' no1':''}">${i+1}</span>
        <div class="site-col">
          <div class="site-label">${d}</div>
          <div class="track"><div class="fill" style="width:${Math.round(s/max*100)}%"></div></div>
        </div>
        <span class="site-dur">${fmt(s)}</span>
      </div>`).join('');
  }

  const[tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(tab?.url){
    try{
      const{hostname}=new URL(tab.url);
      const d=hostname.replace(/^www\./,'');
      document.getElementById('current-domain').textContent=d;
      document.getElementById('current-cat').textContent=getCategory(d);
    }catch{
      document.getElementById('current-domain').textContent='new tab';
      document.getElementById('current-cat').textContent='—';
    }
  }
}

let s=0;
setInterval(()=>{
  s++;
  const m=Math.floor(s/60),sec=String(s%60).padStart(2,'0');
  document.getElementById('current-timer').textContent=`${m}:${sec}`;
},1000);

document.getElementById('flush-btn').addEventListener('click',async()=>{
  const btn=document.getElementById('flush-btn');
  btn.textContent='syncing…';btn.disabled=true;
  try{await chrome.runtime.sendMessage({type:'FLUSH'})}catch(e){}
  setTimeout(async()=>{await load();btn.textContent='sync';btn.disabled=false},1000);
});

load();
