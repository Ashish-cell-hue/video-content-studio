
let data=[],byPath=new Map(),children=new Map(),folderStats=new Map(); const iconFor=o=>o.type==='Folder'?'📁':o.ext==='.mp4'?'🎞️':o.ext==='.png'?'🖼️':o.ext==='.txt'?'📜':o.ext==='.pdf'?'📕':o.ext==='.docx'?'📘':'📄'; const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const parent=p=>p.includes('/')?p.slice(0,p.lastIndexOf('/')):'';const name=p=>p.split('/').pop();let grades=[...new Set(data.map(o=>o.path.split('/')[0]))].filter(g=>/^grade\s+\d+/i.test(g)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));for(const g of grades)document.getElementById('grade').insertAdjacentHTML('beforeend',`<option value="${esc(g)}">${esc(g)}</option>`);
for(const o of data){byPath.set(o.path,o);let par=parent(o.path);if(!children.has(par))children.set(par,[]);children.get(par).push(o);if(o.type==='File'){let parts=o.path.split('/');for(let i=1;i<parts.length;i++){let key=parts.slice(0,i).join('/');let s=folderStats.get(key)||{files:0,images:0,videos:0,scripts:0};s.files++;if(o.ext==='.png')s.images++;if(o.ext==='.mp4')s.videos++;if(o.ext==='.txt')s.scripts++;folderStats.set(key,s)}}}for(let arr of children.values())arr.sort((a,b)=>(a.type==='Folder'?0:1)-(b.type==='Folder'?0:1)||name(a.path).localeCompare(name(b.path),undefined,{numeric:true}));let state={path:'',selected:null};const $=x=>document.getElementById(x);let files=data.filter(o=>o.type==='File');let folderRows=data.filter(o=>o.type==='Folder');const typeName=o=>{let n=name(o.path).trim().toLowerCase();if(/^(?:topic|topics)(?=$|[\s_\-.(0-9])/.test(n))return 'topics';if(/^(?:activity|activities)(?=$|[\s_\-.(0-9])/.test(n))return 'activities';if(/^(?:project|projects)(?=$|[\s_\-.(0-9])/.test(n))return 'projects';return ''};function inScope(o,p){return !p||o.path===p||o.path.startsWith(p+'/')};function counts(p){const fs=folderRows.filter(o=>inScope(o,p)),fl=files.filter(o=>inScope(o,p));return {grades:p?0:grades.length,folders:fs.length-(p&&byPath.get(p)?.type==='Folder'?1:0),files:fl.length,videos:fl.filter(o=>o.ext==='.mp4').length,projects:fs.filter(o=>typeName(o)==='projects').length,activities:fs.filter(o=>typeName(o)==='activities').length,topics:fs.filter(o=>typeName(o)==='topics').length,images:fl.filter(o=>o.ext==='.png').length,scripts:fl.filter(o=>o.ext==='.txt').length}}function renderStats(){let p=state.path,c=counts(p),items=[['📁 Folders',c.folders],['🎞️ Videos',c.videos],['🚀 Projects',c.projects],['🧪 Activities',c.activities],['📚 Topics',c.topics],['📄 Files',c.files],['🖼️ Images',c.images]];$('scopeName').textContent=p?'📊 Counts for: '+p+' (including nested folders)':'🌐 Entire Master Folder — all grades';$('stats').innerHTML=items.map(([t,n])=>`<article class="stat scope"><strong>${n.toLocaleString()}</strong><span>${esc(t)}</span></article>`).join('')};$('treeCount').textContent=`${grades.length} grades`;
function navig(p){state.path=p;state.selected=byPath.get(p)||null;$('search').value='';$('kind').value='';$('grade').value=p?p.split('/')[0]:'';render()};function select(p){const item = byPath.get(p);
if (item?.type === "File" && typeof openMediaPreview === "function") {
  openMediaPreview(p);
}let o=byPath.get(p);if(o?.type==='Folder')navig(p);else{state.selected=o;renderInspector();renderResults()}}function renderTree(){let current=state.path;let visible=new Set(['']);if(current){let a=current.split('/');for(let i=1;i<=a.length;i++)visible.add(a.slice(0,i).join('/'))}let out=`<button class="node ${current===''?'active':''}" data-nav="">🏠 All Grades</button>`;function walk(p,level){for(let o of children.get(p)||[]){if(o.type!=='Folder')continue;let hasKids=(children.get(o.path)||[]).some(x=>x.type==='Folder');let expanded=visible.has(o.path);out+=`<button title="${esc(o.path)}" class="node ${current===o.path?'active':''}" style="padding-left:${10+level*15}px" data-nav="${esc(o.path)}">${hasKids?(expanded?'▾':'▸'):'·'} 📁 <span style="overflow:hidden;text-overflow:ellipsis">${esc(name(o.path))}</span></button>`;if(expanded)walk(o.path,level+1)}}walk('',0);$('tree').innerHTML=out}
function renderInspector(){let o=state.selected,p=state.path;if(!o){$('inspector').innerHTML='<div class="hint">Click a folder or file to inspect it. This report lists names only, not file contents.</div>';return}let f=o.type==='Folder',stats=folderStats.get(o.path)||{files:0,images:0,videos:0,scripts:0};let rows=[['Type',f?'Folder':o.ext||'Unspecified'],['Location',o.path],['Level',o.path.split('/').length]];if(f)rows.push(['Total files below',stats.files],['Images below',stats.images],['Videos below',stats.videos],['TXT scripts below',stats.scripts],['Projects below',counts(o.path).projects],['Activities below',counts(o.path).activities],['Topics below',counts(o.path).topics],['Subfolders below',counts(o.path).folders]);$('inspector').innerHTML=`<div style="font-size:28px">${iconFor(o)}</div><h3>${esc(name(o.path))}</h3>${rows.map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}<div class="hint ${f?'':'warning'}">${f?'Counts include all nested subfolders. Select a subfolder to drill down.':'File name only. To preview actual content, the app will later need local media access.'}</div>`}
function matches(o,q,k,g){if(g && o.path.split('/')[0]!==g)return false;if(q&&!o.path.toLowerCase().includes(q))return false;if(k==='folder')return o.type==='Folder';if(k==='other')return o.type==='File'&&!['.txt','.png','.mp4','.pdf','.docx'].includes(o.ext);if(k)return o.type==='File'&&o.ext===k;return true}
function renderResults(){let q=$('search').value.toLowerCase().trim(),k=$('kind').value,g=$('grade').value,searching=!!(q||k);let items=searching?data.filter(o=>matches(o,q,k,g)):(children.get(state.path)||[]).filter(o=>!g||o.path.split('/')[0]===g);if(searching&&items.length>250){$('resultsTitle').textContent=`🔍 ${items.length.toLocaleString()} matching items • showing first 250` ;items=items.slice(0,250)}else $('resultsTitle').textContent=searching?`🔍 ${items.length} matching items`:`📂 ${items.length} direct items`;if(!items.length){$('results').innerHTML='<div class="empty">No matching items. Try clearing your filters.</div>';return}$('results').innerHTML=items.map(o=>{let stats=folderStats.get(o.path),cc=o.type==='Folder'?counts(o.path):null,details=o.type==='Folder'?`${cc.folders} folders • ${cc.videos} videos • ${cc.projects} projects • ${cc.activities} activities • ${cc.topics} topics`:`${o.ext||'unknown type'} • ${o.category||'File'}`;return `<button class="tile ${state.selected?.path===o.path?'selected':''}" title="${esc(o.path)}" data-select="${esc(o.path)}"><span class="symbol">${iconFor(o)}</span><strong>${esc(name(o.path))}</strong><span class="meta">${esc(details)}</span>${searching?`<span class="meta">${esc(parent(o.path))}</span>`:''}</button>`}).join('')}
function render(){let a=state.path?state.path.split('/'):[];$('crumbs').innerHTML=`<button data-nav="">Home</button>`+a.map((x,i)=>`<em>›</em><button data-nav="${esc(a.slice(0,i+1).join('/'))}">${esc(x)}</button>`).join('');$('heading').textContent=a.length?name(state.path):'All Curriculum Grades';let s=folderStats.get(state.path);$('description').textContent=s?`${s.files} files in this folder and all nested folders • ${s.images} images • ${s.videos} videos • ${s.scripts} TXT scripts`:'Explore your actual OneDrive folder snapshot, without moving or changing files.';renderStats();renderTree();renderResults();renderInspector()}
document.addEventListener('click',e=>{let t=e.target.closest('[data-nav],[data-select]');if(t){if(t.hasAttribute('data-nav'))navig(t.getAttribute('data-nav'));else select(t.getAttribute('data-select'))}});$('search').addEventListener('input',renderResults);$('kind').addEventListener('change',renderResults);$('grade').addEventListener('change',()=>{let g=$('grade').value;if(g&&!state.path.startsWith(g)){state.path=g;state.selected=byPath.get(g)}else if(!g&&state.path){state.path='';state.selected=null}render()});$('reset').addEventListener('click',()=>{$('search').value='';$('kind').value='';navig('')});render();
async function loadFolderData() {
  try {
    const response = await fetch('http://127.0.0.1:8001/api/folders');

    if (!response.ok) {
      throw new Error('API error: ' + response.status);
    }

    const rows = await response.json();

    // Convert CSV column names into dashboard format
    data = rows.map(row => ({
      path: row['Relative Path'],
      type: row['Item Type'],
      ext: row['Extension'],
      category: row['Category']
    }));

    byPath.clear();
    children.clear();
    folderStats.clear();
    grades = [...new Set(data.map(o => o.path.split('/')[0]).filter(g => /^grade\s+\d+/i.test(g)))].sort((a, b) => a.localeCompare(b, undefined, {numeric:true}));
    document.getElementById('treeCount').textContent = grades.length + ' grades';
    
files = data.filter(o => o.type === 'File');
folderRows = data.filter(o => o.type === 'Folder');

for (const o of files) {
  const parts = o.path.split('/');

  for (let i = 1; i < parts.length; i++) {
    const key = parts.slice(0, i).join('/');
    const s = folderStats.get(key) || {
      files: 0, images: 0, videos: 0, scripts: 0
    };

    s.files++;

    const ext = (o.ext || '').toLowerCase();
    if (ext === '.png') s.images++;
    if (ext === '.mp4') s.videos++;
    if (ext === '.txt') s.scripts++;

    folderStats.set(key, s);
  }
}


    for (const item of data) {
      byPath.set(item.path, item);

      const par = parent(item.path);
      if (!children.has(par)) children.set(par, []);
      children.get(par).push(item);
    }

    state.path = '';
    state.selected = null;
    render();

    console.log('Folder data loaded:', data.length);
  } catch (error) {
    console.error('Could not load folder data:', error);
    alert('Backend connection failed. Check Python server on port 8001.');
  }
}

loadFolderData();
