(() => {
  'use strict';

  const BUILD = window.GLORIOSA_BUILD || {blank:false,version:'iPad PWA v2.0'};
  const PDFJS_SCRIPT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const STORAGE_KEY = 'gloriosa-event-display-v1';
  const DB_NAME = 'gloriosa-event-display-images';
  const DB_STORE = 'images';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const uid = (p='id') => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

  const demoSeed = () => ({
    event: {
      circle: 'GLORiOSA',
      name: '強欲で謙虚なイベントTURN20',
      space: 'No.103',
      theme: 'light',
      palette: 'default',
      customColors: {background:'#f0f0f2', card:'#ffffff', accent:'#181a20'},
      logoMode: 'auto',
      logoBlack: {kind:'asset', src:'assets/logo-black.png'},
      logoWhite: {kind:'asset', src:'assets/logo-white.png'},
      qrX: {kind:'asset', src:'assets/qr-x.svg'},
      qrBooth: {kind:'asset', src:'assets/qr-booth.svg'}
    },
    demo: {
      menuForwardSeconds: 25,
      menuBackwardSeconds: 25,
      headerFocusSeconds: 3,
      cardFocusSeconds: 3,
      menuCardSizePercent: 78,
      coverSeconds: 5,
      pageSeconds: 7,
      previewPageCount: 3,
      resumeSeconds: 8,
      readerTimeoutSeconds: 45,
      fadeSeconds: 0.6,
      pdfRenderMode: 'toneSafe',
      pdfRenderPercent: 180
    },
    touch: {
      menuHoldMs: 180,
      previewHoldMs: 250,
      dragThreshold: 12,
      cooldownMs: 300
    },
    device: { keepAwake: true },
    products: [
      {
        id:'voice', type:'book', kindLabel:'NEW', title:'voice of echo', price:500, size:'B5', pages:28,
        summary:'付き合ってないレイがロゼを意識しちゃう', soldOut:false, visible:true, autoPreview:true,
        soldOutBehavior:'menuOnly', focusSeconds:3, previewSource:'pdf', pdf:null, pdfPageCount:0,
        cover:{kind:'asset',src:'assets/voice-cover.png'},
        pageImages:[
          {kind:'asset',src:'assets/voice-p1.png'},
          {kind:'asset',src:'assets/voice-p2.png'},
          {kind:'asset',src:'assets/voice-p3.png'}
        ]
      },
      {
        id:'matome', type:'book', kindLabel:'BOOK', title:'レイロゼまとめ本A', price:800, size:'B5', pages:88,
        summary:'2024年に出したレイロゼのまとめ本', soldOut:false, visible:true, autoPreview:true,
        soldOutBehavior:'menuOnly', focusSeconds:3, previewSource:'pdf', pdf:null, pdfPageCount:0, cover:{kind:'asset',src:'assets/matome-cover.png'}, pageImages:[]
      },
      {
        id:'nemophila', type:'book', kindLabel:'BOOK', title:'Nemophila', price:500, size:'B5', pages:26,
        summary:'戦いをえてレイとロゼの関係の変化', soldOut:false, visible:true, autoPreview:true,
        soldOutBehavior:'menuOnly', focusSeconds:3, previewSource:'pdf', pdf:null, pdfPageCount:0, cover:{kind:'asset',src:'assets/nemophila-cover.jpg'}, pageImages:[]
      },
      {
        id:'acrylic', type:'goods', kindLabel:'GOODS', title:'レイロゼのご様子', price:1000, size:'14cm', pages:null,
        summary:'制服のアクスタ', soldOut:false, visible:true, autoPreview:false,
        soldOutBehavior:'menuOnly', focusSeconds:3, previewSource:'pdf', pdf:null, pdfPageCount:0, cover:{kind:'asset',src:'assets/acrylic.png'}, pageImages:[]
      }
    ]
  });

  const PALETTES = {
    default: {name:'デフォルト', background:'#f0f0f2', card:'#ffffff', text:'#16181d', muted:'#666b75', accent:'#181a20', accentText:'#ffffff'},
    roseQuartz: {name:'Rose Quartz', background:'#f4e7ee', card:'#fffafb', text:'#34202a', muted:'#7d6872', accent:'#b85d84', accentText:'#ffffff'},
    sparkleCitrus: {name:'Sparkle Citrus', background:'#f2f9d8', card:'#fffdf3', text:'#29331d', muted:'#697154', accent:'#98c93c', accentText:'#17210f'},
    zinraiViolet: {name:'ZINRAI Violet', background:'#140d25', card:'#281940', text:'#fbf8ff', muted:'#c4b5d7', accent:'#ca4cff', accentText:'#ffffff'},
    aquaNocturne: {name:'Aqua Nocturne', background:'#0d1b26', card:'#142b38', text:'#f1fbfd', muted:'#abc4cb', accent:'#59d6d0', accentText:'#092025'}
  };

  function hexRgb(hex){
    const h=String(hex||'').replace('#','').trim();
    if(!/^[0-9a-fA-F]{6}$/.test(h)) return {r:255,g:255,b:255};
    return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};
  }
  function isDark(hex){ const {r,g,b}=hexRgb(hex); return (r*0.299+g*0.587+b*0.114)<145; }
  function activePalette(){
    if(state.event.palette==='custom'){
      const c=state.event.customColors||{}; const bg=c.background||'#f0f0f2', card=c.card||'#ffffff', accent=c.accent||'#181a20';
      const dark=isDark(card);
      return {name:'カスタム',background:bg,card,text:dark?'#f8f8fb':'#16181d',muted:dark?'#c8c8d0':'#666b75',accent,accentText:isDark(accent)?'#ffffff':'#121419'};
    }
    return PALETTES[state.event.palette]||PALETTES.default;
  }
  function priceLabel(value){
    const n=Number(value||0);
    return n===0?'無料':`¥${n.toLocaleString('ja-JP')}`;
  }

  function normalizeState(raw){
    const d=demoSeed(); const s=raw||{};
    s.event={...d.event,...(s.event||{})};
    s.event.customColors={...d.event.customColors,...(s.event.customColors||{})};
    if(!s.event.palette) s.event.palette='default';
    if(s.event.palette==='sparkleMint') s.event.palette='roseQuartz';
    if(s.event.palette==='zinraiNeon') s.event.palette='aquaNocturne';
    s.demo={...d.demo,...(s.demo||{})}; s.touch={...d.touch,...(s.touch||{})}; s.device={...d.device,...(s.device||{})};
    // v5以前の固定原稿解像度/高精細チェックを新しい方式へ移行
    if(!s.demo.pdfRenderMode) s.demo.pdfRenderMode = s.demo.pdfHighQuality===false ? 'toneSafe' : 'highQuality';
    if(!Number.isFinite(Number(s.demo.pdfRenderPercent))) s.demo.pdfRenderPercent = 180;
    s.products=Array.isArray(s.products)?s.products:d.products;
    s.products=s.products.map(p=>({...p, focusSeconds:Number.isFinite(Number(p.focusSeconds))?Number(p.focusSeconds):s.demo.cardFocusSeconds, previewSource:p.previewSource||'pdf', pdf:p.pdf||null, pdfPageCount:Number(p.pdfPageCount||0), pageImages:Array.isArray(p.pageImages)?p.pageImages:[]}));
    return s;
  }

  function blankSeed(){
    const d=demoSeed();
    return normalizeState({event:{...d.event,circle:'',name:'',space:''},demo:d.demo,touch:d.touch,device:d.device,products:[]});
  }

  let state = loadState();
  let objectUrlCache = new Map();
  let pdfDocCache = new Map();
  let pdfJsLoadPromise = null;
  let currentScreen = 'menu';
  let autoplayToken = 0;
  let previewBookCursor = 0;
  let currentPreviewBook = null;
  let readerBook = null;
  let readerIndex = 0;
  let readerTimeout = null;
  let menuCamera = {x:0,y:0};
  let menuManual = false;
  let menuResumeTimer = null;
  let lastAcceptedAction = 0;
  let wakeLock = null;

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) return normalizeState(JSON.parse(raw));
    }catch(e){ console.warn(e); }
    const s = BUILD.blank ? blankSeed() : demoSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return normalizeState(s);
  }
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  // IndexedDB for uploaded images
  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE); };
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async function putBlob(blob){
    const key=uid('img'); const db=await openDb();
    await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(blob,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
    db.close(); return {kind:'idb',key};
  }
  async function getBlob(key){
    const db=await openDb();
    const blob=await new Promise((resolve,reject)=>{const r=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    db.close(); return blob;
  }
  async function imageSrc(ref){
    if(!ref) return '';
    if(ref.kind==='asset') return ref.src;
    if(ref.kind==='idb'){
      if(objectUrlCache.has(ref.key)) return objectUrlCache.get(ref.key);
      const blob=await getBlob(ref.key); if(!blob) return '';
      const url=URL.createObjectURL(blob); objectUrlCache.set(ref.key,url); return url;
    }
    return '';
  }
  async function setImg(img, ref){ img.src = await imageSrc(ref); }

  function visibleProducts(){ return state.products.filter(p=>p.visible); }
  function previewBooks(){
    return state.products.filter(p=>p.type==='book' && p.visible && p.autoPreview && !(p.soldOut && p.soldOutBehavior==='menuOnly'));
  }

  // Screen switching
  function showScreen(name){
    currentScreen = name;
    const map={menu:'#menuScreen',preview:'#previewScreen',reader:'#readerScreen',goods:'#goodsScreen',empty:'#emptyScreen'};
    $$('.screen').forEach(el=>el.classList.remove('active'));
    const el=$(map[name]); if(el) el.classList.add('active');
  }
  function applyFade(){ document.documentElement.style.setProperty('--fade', `${state.demo.fadeSeconds}s`); }

  async function renderMenu(){
    applyFade();
    const board=$('#menuBoard'); board.innerHTML='';
    const products=visibleProducts();
    if(products.length===0){ showScreen('empty'); return; }
    const pal=activePalette();
    board.style.setProperty('--menu-bg',pal.background);
    board.style.setProperty('--card-bg',pal.card);
    board.style.setProperty('--menu-text',pal.text);
    board.style.setProperty('--menu-muted',pal.muted);
    board.style.setProperty('--menu-accent',pal.accent);
    board.style.setProperty('--menu-accent-text',pal.accentText);
    board.style.background=pal.background;
    board.style.color=pal.text;

    // 0番目はサークル情報。商品カードと同じ大きさの「紹介枠」として左上に置く。
    // 左列・右列のどちらをフォーカスしても、カード中心が必ず画面中心に来るよう、
    // 現在の表示領域幅から左右余白とボード幅を動的に決める。
    const vp=$('#appViewport');
    const baseCardW=410, baseCardH=560;
    const viewportW=Math.max(1,vp.clientWidth), viewportH=Math.max(1,vp.clientHeight);
    // iPad縦置き専用。カード幅を画面幅に対する割合で指定し、縦方向は最大82%に収める。
    // 既定78%で、紹介カードがおおむね画面の7〜8割を占める。
    const cardSizePercent=clamp(Number(state.demo.menuCardSizePercent||78),60,85);
    const scaleByWidth=(viewportW*(cardSizePercent/100))/baseCardW;
    const scaleByHeight=(viewportH*0.82)/baseCardH;
    const cardScale=Math.max(1,Math.min(scaleByWidth,scaleByHeight));
    const cardW=baseCardW*cardScale, cardH=baseCardH*cardScale;
    board.style.setProperty('--menu-card-scale',String(cardScale));
    const sidePad=Math.max(28, Math.round(viewportW/2 - cardW/2));
    const verticalPad=Math.max(28, Math.round(viewportH/2 - cardH/2));
    const columnGap=Math.max(140,Math.round(cardW*0.48));
    const rowGap=Math.round(cardH + Math.max(120,cardH*0.15));
    const xLeft=sidePad, xRight=sidePad+cardW+columnGap, baseTop=verticalPad;
    const boardW=xRight+cardW+sidePad;
    board.style.width=`${boardW}px`;
    const header=document.createElement('article'); header.className='header-card focus-card'; header.dataset.focusOrder='0'; header.dataset.dwell=String(state.demo.headerFocusSeconds||0);
    header.style.left=`${xLeft}px`; header.style.top=`${baseTop}px`;
    const brand=document.createElement('div'); brand.className='header-brand';
    const logo=document.createElement('img');
    const logoAutoWhite=isDark(pal.card);
    const logoRef = state.event.logoMode==='black' ? state.event.logoBlack : state.event.logoMode==='white' ? state.event.logoWhite : (logoAutoWhite?state.event.logoWhite:state.event.logoBlack);
    await setImg(logo,logoRef); brand.appendChild(logo);
    const ev=document.createElement('div'); ev.className='header-event';
    ev.innerHTML=`<strong>${escapeHtml(state.event.name||'イベント名未設定')}</strong><span>${escapeHtml(state.event.circle||'')}</span><em>${escapeHtml(state.event.space||'')}</em>`;
    const qrRow=document.createElement('div'); qrRow.className='header-qr-row';
    for(const [label,ref] of [['X',state.event.qrX],['BOOTH',state.event.qrBooth]]){
      if(!ref) continue;
      const item=document.createElement('div'); item.className='header-qr-item';
      const qi=document.createElement('img'); qi.alt=`${label} QRコード`; qi.draggable=false; await setImg(qi,ref);
      const qs=document.createElement('span'); qs.textContent=label; item.append(qi,qs); qrRow.appendChild(item);
    }
    const menuLabel=document.createElement('div'); menuLabel.className='header-menu-label'; menuLabel.textContent='TODAY’S MENU';
    header.append(menuLabel,brand,ev,qrRow); board.appendChild(header);

    // 1=右上、2=左下、3=右下、4=さらに左下…の蛇行配置。
    products.forEach((p,i)=>{
      const card=document.createElement('article');
      card.className=`product-card focus-card ${p.type}`; card.dataset.id=p.id; card.dataset.order=String(i); card.dataset.focusOrder=String(i+1); card.dataset.dwell=String(Number.isFinite(Number(p.focusSeconds))?Number(p.focusSeconds):state.demo.cardFocusSeconds||0);
      const slot=i+1, row=Math.floor(slot/2), x=(slot%2===0)?xLeft:xRight, y=baseTop+row*rowGap;
      card.style.left=`${x}px`; card.style.top=`${y}px`;
      const coverWrap=document.createElement('div'); coverWrap.className='cover-wrap';
      const img=document.createElement('img'); img.className='cover'; img.alt=p.title; img.draggable=false; setImg(img,p.cover); coverWrap.appendChild(img);
      const kind=document.createElement('div'); kind.className='kind'; kind.textContent=p.kindLabel || (p.type==='book'?'BOOK':'GOODS');
      const h=document.createElement('h3'); h.textContent=p.title;
      const spec=document.createElement('div'); spec.className='spec'; spec.textContent=p.type==='book' ? `${p.size||''} / ${p.pages||'-'}P` : `${p.size||''}`;
      const summary=document.createElement('p'); summary.className='summary'; summary.textContent=p.summary||'';
      const priceWrap=document.createElement('div'); priceWrap.className='price-wrap';
      const price=document.createElement('div'); price.className='price'; price.textContent=priceLabel(p.price); priceWrap.appendChild(price);
      if(p.soldOut){const so=document.createElement('div');so.className='soldout-overlay';so.textContent='SOLD OUT';priceWrap.appendChild(so);}
      card.append(kind,coverWrap,h,spec,summary,priceWrap);
      const bubble=document.createElement('div'); bubble.className='read-bubble';
      bubble.textContent=p.type==='book'?'表紙をタップすると読めます':'タップで画像を拡大'; card.appendChild(bubble);
      board.appendChild(card);
    });

    const rows=Math.max(1,Math.ceil((products.length+1)/2));
    // 最上段と最下段も縦方向の中央に止められるよう、上下にも同じ余白を確保する。
    const height=Math.max(viewportH, baseTop + (rows-1)*rowGap + cardH + verticalPad);
    board.style.height=`${height}px`;
    setupMenuPointer();
  }

  function boardMetrics(){
    const vp=$('#appViewport'), board=$('#menuBoard');
    return {vw:vp.clientWidth,vh:vp.clientHeight,bw:board.offsetWidth,bh:board.offsetHeight,maxX:Math.max(0,board.offsetWidth-vp.clientWidth),maxY:Math.max(0,board.offsetHeight-vp.clientHeight)};
  }
  function setCamera(x,y){
    const m=boardMetrics(); menuCamera.x=clamp(x,0,m.maxX); menuCamera.y=clamp(y,0,m.maxY);
    $('#menuBoard').style.transform=`translate(${-menuCamera.x}px, ${-menuCamera.y}px)`;
  }
  function cameraTargetFor(el){
    const m=boardMetrics();
    if(!el) return {x:0,y:0};
    const board=$('#menuBoard');
    const scale=Number.parseFloat(getComputedStyle(board).getPropertyValue('--menu-card-scale'))||1;
    const cx=el.offsetLeft + (el.offsetWidth*scale)/2;
    const cy=el.offsetTop + (el.offsetHeight*scale)/2;
    return {x:clamp(cx-m.vw/2,0,m.maxX), y:clamp(cy-m.vh/2,0,m.maxY)};
  }

  function menuPath(){
    const board=$('#menuBoard');
    const cards=[...board.querySelectorAll('.focus-card')]
      .sort((a,b)=>Number(a.dataset.focusOrder)-Number(b.dataset.focusOrder));
    return cards.length?cards.map(el=>({...cameraTargetFor(el),dwell:Number(el.dataset.dwell||0)})):[{x:0,y:0,dwell:0}];
  }

  function animateCameraTo(target,duration,token){
    return new Promise(resolve=>{
      const start={...menuCamera}, t0=performance.now();
      function tick(now){
        if(token!==autoplayToken || menuManual || currentScreen!=='menu') return resolve(false);
        const p=clamp((now-t0)/duration,0,1); const ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
        setCamera(start.x+(target.x-start.x)*ease,start.y+(target.y-start.y)*ease);
        if(p<1) requestAnimationFrame(tick); else resolve(true);
      }
      requestAnimationFrame(tick);
    });
  }
  async function waitFocus(seconds,token){
    const ms=Math.max(0,Number(seconds||0)*1000);
    const end=performance.now()+ms;
    while(performance.now()<end){
      await sleep(Math.min(100,end-performance.now()));
      if(token!==autoplayToken || menuManual || currentScreen!=='menu') return false;
    }
    return true;
  }
  async function runPath(points,totalMs,token){
    const segments=Math.max(1,points.length-1), dur=totalMs/segments;
    for(let i=1;i<points.length;i++){
      if(!(await animateCameraTo(points[i],dur,token))) return false;
      if(!(await waitFocus(points[i].dwell,token))) return false;
    }
    return true;
  }

  async function autoplayLoop(smoothStart=false){
    const my=++autoplayToken;
    if(visibleProducts().length===0){showScreen('empty');return;}
    showScreen('menu'); menuManual=false;
    let firstCycle=true;
    while(my===autoplayToken){
      const before={...menuCamera};
      await renderMenu(); showScreen('menu'); await sleep(250);
      const path=menuPath();
      if(firstCycle && smoothStart){
        setCamera(before.x,before.y);
        const backOk=await animateCameraTo(path[0],1400,my); if(!backOk) return;
      }else setCamera(path[0].x,path[0].y);
      if(!(await waitFocus(path[0].dwell,my))) return;
      firstCycle=false;
      const ok1=await runPath(path,state.demo.menuForwardSeconds*1000,my); if(!ok1) return;
      const rev=[...path].reverse(); const ok2=await runPath(rev,state.demo.menuBackwardSeconds*1000,my); if(!ok2) return;
      const books=previewBooks();
      if(books.length===0) continue;
      const book=books[previewBookCursor%books.length]; previewBookCursor=(previewBookCursor+1)%books.length;
      const okPrev=await runPreview(book,my); if(!okPrev) return;
    }
  }

  function pdfJsReady(){ return !!(window.pdfjsLib && window.pdfjsLib.getDocument); }
  async function ensurePdfJs(){
    if(pdfJsReady()) return true;
    if(pdfJsLoadPromise) return pdfJsLoadPromise;
    pdfJsLoadPromise=new Promise(resolve=>{
      const script=document.createElement('script');
      script.src=PDFJS_SCRIPT_URL; script.async=true;
      const done=ok=>{clearTimeout(timer);resolve(ok&&pdfJsReady());};
      script.onload=()=>done(true); script.onerror=()=>done(false);
      const timer=setTimeout(()=>done(false),5000); document.head.appendChild(script);
    });
    return pdfJsLoadPromise;
  }
  async function pdfBlob(ref){
    if(!ref) return null;
    if(ref.kind==='idb') return await getBlob(ref.key);
    if(ref.kind==='asset'){ try{return await (await fetch(ref.src)).blob();}catch{return null;} }
    return null;
  }
  async function getPdfDoc(book){
    if(!book?.pdf || !(await ensurePdfJs())) return null;
    const key=book.pdf.kind==='idb'?book.pdf.key:book.pdf.src;
    if(pdfDocCache.has(key)) return pdfDocCache.get(key);
    const blob=await pdfBlob(book.pdf); if(!blob) return null;
    const data=await blob.arrayBuffer();
    try{
      if(window.pdfjsLib.GlobalWorkerOptions) window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER_URL;
      const doc=await window.pdfjsLib.getDocument({data}).promise; pdfDocCache.set(key,doc); book.pdfPageCount=doc.numPages; saveState(); return doc;
    }catch(e){ console.warn('PDF.js load failed',e); return null; }
  }
  function drawHighQuality(ctx, source, sw, sh, dw, dh){
    ctx.imageSmoothingEnabled=true;
    if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality='high';
    ctx.drawImage(source,0,0,sw,sh,0,0,dw,dh);
  }

  function multiStageDownsample(source, targetW, targetH){
    let current=source;
    let owned=[];
    // 1回で極端に縮めるより、約50%ずつ段階的に縮小した方が
    // スクリーントーンの周期成分を平均化しやすく、モアレを抑えられる。
    while(current.width > targetW*1.9 || current.height > targetH*1.9){
      const next=document.createElement('canvas');
      next.width=Math.max(targetW,Math.round(current.width*0.5));
      next.height=Math.max(targetH,Math.round(current.height*0.5));
      const nctx=next.getContext('2d',{alpha:false});
      nctx.fillStyle='#fff'; nctx.fillRect(0,0,next.width,next.height);
      drawHighQuality(nctx,current,current.width,current.height,next.width,next.height);
      if(current!==source) owned.push(current);
      current=next;
    }
    const out=document.createElement('canvas');
    out.width=targetW; out.height=targetH;
    const octx=out.getContext('2d',{alpha:false});
    octx.fillStyle='#fff'; octx.fillRect(0,0,targetW,targetH);
    drawHighQuality(octx,current,current.width,current.height,targetW,targetH);
    return out;
  }

  async function renderPdfPageToCanvas(book,pageNumber,canvas,maxW,maxH){
    const doc=await getPdfDoc(book); if(!doc) return false;
    const page=await doc.getPage(clamp(pageNumber,1,doc.numPages));
    const base=page.getViewport({scale:1});

    const dpr=Math.max(1,window.devicePixelRatio||1);
    const physicalBoxW=Math.max(1,Math.round(maxW*dpr));
    const physicalBoxH=Math.max(1,Math.round(maxH*dpr));
    const fitScale=Math.min(physicalBoxW/base.width,physicalBoxH/base.height);
    const finalVp=page.getViewport({scale:fitScale});
    const finalW=Math.max(1,Math.round(finalVp.width));
    const finalH=Math.max(1,Math.round(finalVp.height));

    const percent=clamp(Number(state.demo.pdfRenderPercent||180),100,300)/100;
    const renderScale=fitScale*percent;
    const hiVp=page.getViewport({scale:renderScale});
    const mode=state.demo.pdfRenderMode||'toneSafe';

    if(mode==='toneSafe'){
      // iPadトーン補正：一度高解像度に展開し、最終的な物理解像度まで
      // 多段階で縮小して周期的なトーンの干渉縞を軽減する。
      const temp=document.createElement('canvas');
      temp.width=Math.max(1,Math.ceil(hiVp.width));
      temp.height=Math.max(1,Math.ceil(hiVp.height));
      const tctx=temp.getContext('2d',{alpha:false});
      tctx.imageSmoothingEnabled=true;
      if('imageSmoothingQuality' in tctx) tctx.imageSmoothingQuality='high';
      await page.render({canvasContext:tctx,viewport:hiVp,background:'#ffffff'}).promise;
      const reduced=multiStageDownsample(temp,finalW,finalH);
      canvas.width=finalW; canvas.height=finalH;
      const ctx=canvas.getContext('2d',{alpha:false});
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,finalW,finalH);
      drawHighQuality(ctx,reduced,reduced.width,reduced.height,finalW,finalH);
      canvas.style.width=`${Math.max(1,Math.floor(finalW/dpr))}px`;
      canvas.style.height=`${Math.max(1,Math.floor(finalH/dpr))}px`;
      return true;
    }

    // 高精細モード：指定倍率の大きなCanvasをそのままCSSで表示領域にフィット。
    // iPad実機でトーン補正モードと比較できるよう残す。
    canvas.width=Math.max(1,Math.ceil(hiVp.width));
    canvas.height=Math.max(1,Math.ceil(hiVp.height));
    const cssScale=Math.min(maxW/hiVp.width,maxH/hiVp.height);
    canvas.style.width=`${Math.max(1,Math.floor(hiVp.width*cssScale))}px`;
    canvas.style.height=`${Math.max(1,Math.floor(hiVp.height*cssScale))}px`;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=true;
    if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality='high';
    await page.render({canvasContext:ctx,viewport:hiVp,background:'#ffffff'}).promise;
    return true;
  }
  async function pdfNativeUrl(book,pageNumber=1){
    const src=await imageSrc(book.pdf); return src?`${src}#page=${pageNumber}&view=FitH&toolbar=0&navpanes=0`:'';
  }
  async function pdfPageCountFromFile(file){
    if(await ensurePdfJs()){
      try{const doc=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise; return doc.numPages;}catch(e){console.warn(e);}
    }
    try{const bytes=new Uint8Array(await file.arrayBuffer()); const text=new TextDecoder('latin1').decode(bytes); const m=text.match(/\/Type\s*\/Page\b/g); return m?.length||0;}catch{return 0;}
  }

  async function runPreview(book,token){
    currentPreviewBook=book; showScreen('preview');
    $('#previewTitle').textContent=book.title;
    const img=$('#previewPage');
    let canvas=$('#previewPdfCanvas');
    if(!canvas){ canvas=document.createElement('canvas'); canvas.id='previewPdfCanvas'; canvas.className='preview-pdf-canvas hidden'; $('#previewPageWrap').insertBefore(canvas,$('#previewPageLabel')); }
    const hasPageImages=(book.pageImages||[]).length>0;
    const usePdfPreview=!!book.pdf && !(book.previewSource==='images' && hasPageImages);
    if(usePdfPreview){
      const doc=await getPdfDoc(book);
      if(doc){
        img.classList.add('hidden'); canvas.classList.remove('hidden');
        const count=Math.min(doc.numPages,Math.max(1,Number(state.demo.previewPageCount||0)+1));
        for(let i=1;i<=count;i++){
          if(token!==autoplayToken || currentScreen!=='preview') return false;
          canvas.style.opacity='.15'; await sleep(120);
          const wrap=$('#previewPageWrap'); await renderPdfPageToCanvas(book,i,canvas,wrap.clientWidth*.92,wrap.clientHeight*.96); canvas.style.opacity='1';
          $('#previewPageLabel').textContent=i===1?'表紙':`${i-1}P`;
          const ms=(i===1?state.demo.coverSeconds:state.demo.pageSeconds)*1000;
          const stop=performance.now()+ms; while(performance.now()<stop){await sleep(Math.min(100,stop-performance.now()));if(token!==autoplayToken||currentScreen!=='preview')return false;}
        }
      }else{
        canvas.classList.add('hidden'); img.classList.remove('hidden'); await setImg(img,book.cover); $('#previewPageLabel').textContent='表紙'; await sleep(state.demo.coverSeconds*1000);
      }
    }else{
      canvas.classList.add('hidden'); img.classList.remove('hidden');
      const refs=[book.cover,...(book.pageImages||[]).slice(0,state.demo.previewPageCount)];
      const labels=['表紙',...(book.pageImages||[]).slice(0,state.demo.previewPageCount).map((_,i)=>`${i+1}P`)];
      for(let i=0;i<refs.length;i++){
        if(token!==autoplayToken || currentScreen!=='preview') return false;
        img.classList.add('turning'); await sleep(150); await setImg(img,refs[i]);
        $('#previewPageLabel').textContent=labels[i]||''; img.classList.remove('turning');
        const ms=(i===0?state.demo.coverSeconds:state.demo.pageSeconds)*1000;
        const stop=performance.now()+ms; while(performance.now()<stop){await sleep(Math.min(100,stop-performance.now()));if(token!==autoplayToken||currentScreen!=='preview')return false;}
      }
    }
    showScreen('menu'); await renderMenu(); return true;
  }

  function stopAutoplay(){ autoplayToken++; clearTimeout(menuResumeTimer); }
  function scheduleMenuAutoplay(){
    clearTimeout(menuResumeTimer);
    menuResumeTimer=setTimeout(()=>{ if(currentScreen==='menu' && $('#adminOverlay').classList.contains('hidden')) autoplayLoop(true); }, state.demo.resumeSeconds*1000);
  }

  // human-ish hold + drag handling for menu
  function setupMenuPointer(){
    const menu=$('#menuScreen'); if(menu.dataset.pointerReady==='1') return; menu.dataset.pointerReady='1';
    let down=false,startX=0,startY=0,lastX=0,lastY=0,startT=0,dragging=false,hitCard=null;
    menu.addEventListener('pointerdown',e=>{
      if(e.target.closest('.floating-admin')) return;
      if(performance.now()-lastAcceptedAction<state.touch.cooldownMs) return;
      down=true; startX=lastX=e.clientX; startY=lastY=e.clientY; startT=performance.now(); dragging=false; hitCard=e.target.closest('.product-card');
      menu.setPointerCapture?.(e.pointerId); stopAutoplay(); menuManual=true; hitCard?.classList.add('pressed'); $('#menuHint').classList.add('hidden-hint');
    });
    menu.addEventListener('pointermove',e=>{
      if(!down) return; const dx=e.clientX-startX,dy=e.clientY-startY;
      if(Math.hypot(dx,dy)>state.touch.dragThreshold){dragging=true;hitCard?.classList.remove('pressed');}
      if(dragging){ setCamera(menuCamera.x-(e.clientX-lastX),menuCamera.y-(e.clientY-lastY)); }
      lastX=e.clientX;lastY=e.clientY;
    });
    const end=e=>{
      if(!down) return; down=false; const duration=performance.now()-startT; hitCard?.classList.remove('pressed');
      if(!dragging && hitCard && duration>=state.touch.menuHoldMs){
        const p=state.products.find(x=>x.id===hitCard.dataset.id); if(p){lastAcceptedAction=performance.now(); if(p.type==='book') openReader(p); else openGoods(p); return;}
      }
      menuManual=false; scheduleMenuAutoplay();
      setTimeout(()=>$('#menuHint').classList.remove('hidden-hint'),3000);
    };
    menu.addEventListener('pointerup',end); menu.addEventListener('pointercancel',end);
  }

  function setupPreviewPointer(){
    const el=$('#previewScreen'); let down=false,t0=0,x0=0,y0=0;
    el.addEventListener('pointerdown',e=>{ if(performance.now()-lastAcceptedAction<state.touch.cooldownMs)return;down=true;t0=performance.now();x0=e.clientX;y0=e.clientY;el.classList.add('pressed'); });
    el.addEventListener('pointerup',e=>{ if(!down)return;down=false;el.classList.remove('pressed');const d=performance.now()-t0,dist=Math.hypot(e.clientX-x0,e.clientY-y0);if(d>=state.touch.previewHoldMs&&dist<state.touch.dragThreshold&&currentPreviewBook){lastAcceptedAction=performance.now();openReader(currentPreviewBook);} });
    el.addEventListener('pointercancel',()=>{down=false;el.classList.remove('pressed');});
  }

  async function openGoods(product){
    stopAutoplay(); currentPreviewBook=null; showScreen('goods');
    $('#goodsTitle').textContent=product.title||'';
    $('#goodsSpec').textContent=[product.size,priceLabel(product.price)].filter(Boolean).join(' / ');
    $('#goodsSummary').textContent=product.summary||'';
    await setImg($('#goodsImage'),product.cover);
  }

  async function openReader(book){
    stopAutoplay(); currentPreviewBook=null; readerBook=book; readerIndex=0; showScreen('reader');
    $('#readerTitle').textContent=book.title; $('#readerGuide').classList.remove('hidden-hint'); setTimeout(()=>$('#readerGuide').classList.add('hidden-hint'),3500);
    await renderReaderPage(); resetReaderTimeout();
  }
  function readerRefs(){ return readerBook?[readerBook.cover,...(readerBook.pageImages||[])]:[]; }
  async function readerPageCount(){
    if(!readerBook) return 0;
    if(readerBook.pdf){ const doc=await getPdfDoc(readerBook); if(doc)return doc.numPages; return Number(readerBook.pdfPageCount||readerBook.pages||1); }
    return readerRefs().length;
  }
  async function renderReaderPage(){
    if(!readerBook) return;
    const img=$('#readerPage'), empty=$('#readerEmpty'), final=$('#readerFinalNote'), canvas=$('#readerPdfCanvas'), fallback=$('#readerPdfFallback');
    img.classList.add('hidden'); canvas.classList.add('hidden'); fallback.classList.add('hidden'); empty.classList.add('hidden'); final.classList.add('hidden');
    if(readerBook.pdf){
      const doc=await getPdfDoc(readerBook); const count=doc?.numPages||Number(readerBook.pdfPageCount||readerBook.pages||1);
      if(!count){ empty.classList.remove('hidden'); $('#readerCounter').textContent='PDF'; $('#readerPrev').style.visibility='hidden'; $('#readerNext').style.visibility='hidden'; return; }
      readerIndex=clamp(readerIndex,0,count-1);
      if(doc){
        canvas.classList.remove('hidden'); const stage=$('#readerStage'); await renderPdfPageToCanvas(readerBook,readerIndex+1,canvas,stage.clientWidth*.96,stage.clientHeight*.96);
      }else{
        fallback.classList.remove('hidden'); fallback.src=await pdfNativeUrl(readerBook,readerIndex+1);
      }
      $('#readerCounter').textContent=`${readerIndex===0?'表紙':readerIndex+'P'} / ${count}ページ`;
      $('#readerPrev').style.visibility=readerIndex>0?'visible':'hidden'; $('#readerNext').style.visibility='visible';
      $('#readerNext').textContent=readerIndex===count-1?'↺':'‹'; $('#readerNext').setAttribute('aria-label',readerIndex===count-1?'表紙に戻る':'次のページ');
      if(readerIndex===count-1) final.classList.remove('hidden');
      return;
    }
    const refs=readerRefs();
    if(!refs.length){empty.classList.remove('hidden');$('#readerCounter').textContent='未登録';$('#readerPrev').style.visibility='hidden';$('#readerNext').style.visibility='hidden';return;}
    readerIndex=clamp(readerIndex,0,refs.length-1); img.classList.remove('hidden');
    if(!refs[readerIndex]){empty.classList.remove('hidden');img.classList.add('hidden');} else await setImg(img,refs[readerIndex]);
    $('#readerCounter').textContent=`${readerIndex===0?'表紙':readerIndex+'P'} / ${Math.max(0,refs.length-1)}P登録`;
    $('#readerPrev').style.visibility=readerIndex>0?'visible':'hidden'; $('#readerNext').style.visibility='visible';
    $('#readerNext').textContent=readerIndex===refs.length-1?'↺':'‹'; $('#readerNext').setAttribute('aria-label',readerIndex===refs.length-1?'表紙に戻る':'次のページ');
    if(readerIndex===refs.length-1) final.classList.remove('hidden');
  }
  async function shiftReader(delta){
    if(!readerBook)return; const count=await readerPageCount(); if(!count)return;
    if(delta>0 && readerIndex===count-1){ readerIndex=0; } else { const next=clamp(readerIndex+delta,0,count-1); if(next===readerIndex)return; readerIndex=next; }
    await renderReaderPage(); resetReaderTimeout();
  }

  function resetReaderTimeout(){ clearTimeout(readerTimeout); readerTimeout=setTimeout(()=>returnToMenu(true),state.demo.readerTimeoutSeconds*1000); }
  async function returnToMenu(auto=false){
    clearTimeout(readerTimeout); readerBook=null; readerIndex=0; await renderMenu(); showScreen(visibleProducts().length?'menu':'empty');
    if(visibleProducts().length){ const p=menuPath(); if(p.length)setCamera(p[0].x,p[0].y); if(auto) autoplayLoop(); else scheduleMenuAutoplay(); }
  }
  function setupReaderPointer(){
    const stage=$('#readerStage'); let down=false,x0=0,y0=0,startInLeft=false;
    stage.addEventListener('pointerdown',e=>{down=true;x0=e.clientX;y0=e.clientY;const r=stage.getBoundingClientRect();startInLeft=(e.clientX-r.left)<r.width*.5;resetReaderTimeout();});
    stage.addEventListener('pointerup',e=>{
      if(!down)return;down=false;const dx=e.clientX-x0,dy=e.clientY-y0;
      if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){
        // 左→右スワイプで次ページ。最終ページでは表紙へ戻る。
        shiftReader(dx>0?1:-1);
      }else resetReaderTimeout();
    });
    stage.addEventListener('pointercancel',()=>down=false);
  }


  async function requestWakeLock(){
    if(!state.device?.keepAwake || !('wakeLock' in navigator) || document.visibilityState!=='visible') return false;
    try{
      if(!wakeLock) wakeLock=await navigator.wakeLock.request('screen');
      wakeLock.addEventListener?.('release',()=>{wakeLock=null;},{once:true});
      return true;
    }catch(e){ return false; }
  }
  async function releaseWakeLock(){ try{await wakeLock?.release();}catch(e){} wakeLock=null; }
  function isStandalone(){ return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone===true; }
  async function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return null;
    try{ await navigator.serviceWorker.register('./sw.js',{scope:'./'}); return await navigator.serviceWorker.ready; }catch(e){console.warn('SW register failed',e);return null;}
  }
  async function updateDeviceStatus(){
    const mode=$('#deviceDisplayMode'), sw=$('#deviceSwStatus'), pdf=$('#devicePdfStatus'), st=$('#deviceStorageStatus');
    if(mode) mode.textContent=isStandalone()?'ホーム画面アプリ':'Safari / ブラウザ';
    if(sw){
      if(!('serviceWorker' in navigator)) sw.textContent='非対応';
      else { const reg=await navigator.serviceWorker.getRegistration('./').catch(()=>null); sw.textContent=reg?'準備済み':'未準備'; }
    }
    if(pdf) pdf.textContent=pdfJsReady()?'読み込み済み':'未読み込み';
    if(st && navigator.storage?.estimate){
      try{const e=await navigator.storage.estimate(); const used=(e.usage||0)/1024/1024, quota=(e.quota||0)/1024/1024; st.textContent=`${used.toFixed(0)}MB / ${quota.toFixed(0)}MB`; }catch{st.textContent='取得できません';}
    }
  }
  async function prepareOfflinePdf(){
    const btn=$('#prepareOfflineBtn'); if(btn){btn.disabled=true;btn.textContent='準備中…';}
    let reg=await registerServiceWorker();
    try{reg?.active?.postMessage({type:'CACHE_PDFJS'});}catch(e){}
    const ok=await ensurePdfJs();
    if(ok && window.pdfjsLib?.GlobalWorkerOptions) window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER_URL;
    if(btn){btn.disabled=false;btn.textContent=ok?'PDF機能を準備しました':'再試行：オフライン用PDF機能を準備';}
    await updateDeviceStatus();
    return ok;
  }
  async function persistStorage(){
    const btn=$('#persistStorageBtn');
    if(!navigator.storage?.persist){ if(btn) btn.textContent='保存領域保護：非対応'; return false; }
    try{const ok=await navigator.storage.persist(); if(btn) btn.textContent=ok?'保存領域を保護しました':'端末設定により通常保存'; await updateDeviceStatus(); return ok;}catch{return false;}
  }


  // Admin
  function openAdmin(){ stopAutoplay(); clearTimeout(readerTimeout); $('#adminOverlay').classList.remove('hidden'); fillAdmin(); }
  function closeAdmin(){ $('#adminOverlay').classList.add('hidden'); renderMenu().then(()=>{ if(visibleProducts().length) autoplayLoop(); else showScreen('empty'); }); }
  function fillAdmin(){
    $('#eventCircle').value=state.event.circle||''; $('#eventName').value=state.event.name||''; $('#eventSpace').value=state.event.space||''; $('#logoMode').value=state.event.logoMode||'auto'; fillDesignAdmin();
    setImg($('#logoBlackPreview'),state.event.logoBlack); setImg($('#logoWhitePreview'),state.event.logoWhite); setImg($('#qrXPreview'),state.event.qrX); setImg($('#qrBoothPreview'),state.event.qrBooth);
    const d=state.demo; ['menuForwardSeconds','menuBackwardSeconds','headerFocusSeconds','cardFocusSeconds','menuCardSizePercent','coverSeconds','pageSeconds','previewPageCount','resumeSeconds','readerTimeoutSeconds','fadeSeconds','pdfRenderPercent'].forEach(k=>{const el=$('#'+k); if(el) el.value=d[k];}); const pdfMode=$('#pdfRenderMode'); if(pdfMode) pdfMode.value=d.pdfRenderMode||'toneSafe';
    const t=state.touch; ['menuHoldMs','previewHoldMs','dragThreshold','cooldownMs'].forEach(k=>$('#'+k).value=t[k]);
    const ka=$('#keepAwake'); if(ka) ka.checked=state.device?.keepAwake!==false;
    updateDeviceStatus();
    renderProductAdmin();
  }
  function fillDesignAdmin(){
    $$('.palette-option').forEach(el=>el.classList.toggle('selected',el.dataset.palette===state.event.palette));
    const c=state.event.customColors||{};
    [['customBg','background'],['customCard','card'],['customAccent','accent']].forEach(([id,key])=>{
      const picker=$('#'+id), text=$('#'+id+'Hex'); if(picker) picker.value=c[key]||demoSeed().event.customColors[key]; if(text) text.value=c[key]||demoSeed().event.customColors[key];
    });
  }
  function normalizeHex(v,fallback){ v=String(v||'').trim(); if(!v.startsWith('#'))v='#'+v; return /^#[0-9a-fA-F]{6}$/.test(v)?v.toLowerCase():fallback; }

  function switchAdminTab(name){ $$('.admin-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name)); $$('.admin-section').forEach(s=>s.classList.toggle('active',s.dataset.panel===name)); }

  async function renderProductAdmin(){
    const list=$('#productAdminList'); list.innerHTML='';
    for(const p of state.products){
      const details=document.createElement('details'); details.className='product-admin-card'; details.dataset.id=p.id;
      const summary=document.createElement('summary');
      const thumb=document.createElement('img'); thumb.className='admin-thumb'; await setImg(thumb,p.cover);
      const meta=document.createElement('div'); meta.className='admin-summary-meta'; meta.innerHTML=`<strong>${escapeHtml(p.title||'名称未設定')}</strong><span>${p.type==='book'?'同人誌':'グッズ'} / ${priceLabel(p.price)}</span>`;
      const pills=document.createElement('div'); pills.className='status-pills'; pills.innerHTML=`<span class="pill">${p.visible?'表示中':'非表示'}</span>${p.soldOut?'<span class="pill sold">SOLD OUT</span>':''}`;
      summary.append(thumb,meta,pills); details.appendChild(summary);
      const form=document.createElement('div'); form.className='product-form';
      form.innerHTML=`
        <div class="product-form-grid">
          <label>種類<select data-f="type"><option value="book">同人誌</option><option value="goods">グッズ</option></select></label>
          <label>表示ラベル<input data-f="kindLabel" type="text" value="${escapeAttr(p.kindLabel||'')}" /></label>
          <label>タイトル / 商品名<input data-f="title" type="text" value="${escapeAttr(p.title||'')}" /></label>
          <label>価格<input data-f="price" type="number" min="0" value="${p.price||0}" /></label>
          <label>判型 / サイズ<input data-f="size" type="text" value="${escapeAttr(p.size||'')}" /></label>
          <label>ページ数<input data-f="pages" type="number" min="0" value="${p.pages||''}" ${p.type==='goods'?'disabled':''}/></label>
          <label>フォーカス滞在時間<input data-f="focusSeconds" type="number" min="0" max="30" step="0.5" value="${Number.isFinite(Number(p.focusSeconds))?Number(p.focusSeconds):state.demo.cardFocusSeconds}" /></label>
          <label class="wide">あらすじ / 説明<textarea data-f="summary">${escapeHtml(p.summary||'')}</textarea></label>
          <label class="check-row"><input data-f="visible" type="checkbox" ${p.visible?'checked':''}/> お品書きに表示</label>
          <label class="check-row"><input data-f="autoPreview" type="checkbox" ${p.autoPreview?'checked':''} ${p.type==='goods'?'disabled':''}/> 自動本プレビューに使用</label>
          <label class="check-row"><input data-f="soldOut" type="checkbox" ${p.soldOut?'checked':''}/> SOLD OUT</label>
          <label>SOLD OUT時<select data-f="soldOutBehavior"><option value="menuOnly">お品書きに残す・プレビューしない</option><option value="keepPreview">お品書きに残す・プレビューも継続</option><option value="hide">非表示</option></select></label>
          <label>表紙 / 商品画像<input data-cover type="file" accept="image/*" /></label>
          <label class="page-upload">本文ページ画像（複数可）<input data-pages type="file" accept="image/*" multiple ${p.type==='goods'?'disabled':''}/><span class="page-file-list">現在 ${p.pageImages?.length||0}ページ登録</span></label>
          <label>自動プレビュー素材<select data-f="previewSource" ${p.type==='goods'?'disabled':''}><option value="pdf">PDF優先</option><option value="images">本文画像優先</option></select></label>
          <label class="page-upload wide">見本誌PDF（1ページ=1画像のPDF）<input data-pdf type="file" accept="application/pdf,.pdf" ${p.type==='goods'?'disabled':''}/><span class="pdf-status">${p.pdf?`PDF登録済み${p.pdfPageCount?` / ${p.pdfPageCount}ページ`:''}`:'未登録'}</span><span class="pdf-note">閲覧モードではPDFを優先します。自動デモで流す素材だけ、上の「PDF優先 / 本文画像優先」で選べます。</span></label>
          ${p.pdf?'<label class="check-row wide"><input data-clear-pdf type="checkbox" /> 登録済みPDFを解除する</label>':''}
        </div>
        <div class="product-form-actions"><button class="ui-btn danger" data-delete>削除</button><button class="ui-btn primary" data-save>保存</button></div>`;
      form.querySelector('[data-f="type"]').value=p.type; form.querySelector('[data-f="soldOutBehavior"]').value=p.soldOutBehavior||'menuOnly'; const previewSourceEl=form.querySelector('[data-f="previewSource"]'); if(previewSourceEl) previewSourceEl.value=p.previewSource||'pdf';
      details.appendChild(form); list.appendChild(details);

      form.querySelector('[data-f="type"]').addEventListener('change',e=>{const isBook=e.target.value==='book';form.querySelector('[data-f="pages"]').disabled=!isBook;form.querySelector('[data-f="autoPreview"]').disabled=!isBook;form.querySelector('[data-pages]').disabled=!isBook;form.querySelector('[data-pdf]').disabled=!isBook; const ps=form.querySelector('[data-f="previewSource"]'); if(ps) ps.disabled=!isBook;});
      form.querySelector('[data-save]').addEventListener('click',async()=>{
        const q=f=>form.querySelector(`[data-f="${f}"]`); p.type=q('type').value;p.kindLabel=q('kindLabel').value;p.title=q('title').value;p.price=Number(q('price').value||0);p.size=q('size').value;p.pages=p.type==='book'?Number(q('pages').value||0):null;p.summary=q('summary').value;p.focusSeconds=Number(q('focusSeconds').value||state.demo.cardFocusSeconds||0);p.visible=q('visible').checked;p.autoPreview=p.type==='book'&&q('autoPreview').checked;p.soldOut=q('soldOut').checked;p.soldOutBehavior=q('soldOutBehavior').value;p.previewSource=p.type==='book'?(q('previewSource')?.value||'pdf'):'pdf';
        const coverFile=form.querySelector('[data-cover]').files[0];if(coverFile)p.cover=await putBlob(coverFile);
        const pageFiles=[...form.querySelector('[data-pages]').files];if(pageFiles.length)p.pageImages=await Promise.all(pageFiles.map(putBlob));
        const clearPdf=form.querySelector('[data-clear-pdf]'); if(clearPdf?.checked){p.pdf=null;p.pdfPageCount=0;pdfDocCache.clear();}
        const pdfFile=form.querySelector('[data-pdf]').files[0];if(pdfFile){p.pdf=await putBlob(pdfFile);p.pdfPageCount=(await pdfPageCountFromFile(pdfFile))||Number(p.pages||1);pdfDocCache.clear();}
        if(p.soldOut&&p.soldOutBehavior==='hide')p.visible=false;
        saveState(); await renderProductAdmin(); alert('保存しました');
      });
      form.querySelector('[data-delete]').addEventListener('click',()=>{if(confirm(`「${p.title}」を削除しますか？`)){state.products=state.products.filter(x=>x.id!==p.id);saveState();renderProductAdmin();}});
    }
  }

  async function addProduct(){
    const p={id:uid('product'),type:'book',kindLabel:'BOOK',title:'新しい頒布物',price:0,size:'B5',pages:0,summary:'',soldOut:false,visible:true,autoPreview:true,soldOutBehavior:'menuOnly',focusSeconds:state.demo.cardFocusSeconds||3,previewSource:'pdf',pdf:null,pdfPageCount:0,cover:null,pageImages:[]};
    state.products.push(p);saveState();await renderProductAdmin(); const el=$(`.product-admin-card[data-id="${p.id}"]`); if(el){el.open=true;el.scrollIntoView({behavior:'smooth',block:'center'});} }

  function setupAdminEvents(){
    $('#adminBtn').onclick=openAdmin; $('#floatingAdmin').onclick=openAdmin; $('#emptyAdminBtn').onclick=openAdmin; $('#closeAdminBtn').onclick=closeAdmin;
    $$('.admin-tab').forEach(b=>b.onclick=()=>{switchAdminTab(b.dataset.tab); if(b.dataset.tab==='device') updateDeviceStatus();});
    $('#prepareOfflineBtn')?.addEventListener('click',prepareOfflinePdf);
    $('#persistStorageBtn')?.addEventListener('click',persistStorage);
    $('#refreshDeviceStatusBtn')?.addEventListener('click',updateDeviceStatus);
    $('#saveDeviceBtn')?.addEventListener('click',()=>{state.device.keepAwake=$('#keepAwake').checked;saveState(); if(state.device.keepAwake) requestWakeLock(); else releaseWakeLock(); alert('iPad設定を保存しました');});
    $('#saveEventBtn').onclick=()=>{state.event.circle=$('#eventCircle').value;state.event.name=$('#eventName').value;state.event.space=$('#eventSpace').value;state.event.logoMode=$('#logoMode').value;saveState();alert('イベント設定を保存しました');};
    $('#logoBlackUpload').onchange=async e=>{if(e.target.files[0]){state.event.logoBlack=await putBlob(e.target.files[0]);saveState();setImg($('#logoBlackPreview'),state.event.logoBlack);}};
    $('#logoWhiteUpload').onchange=async e=>{if(e.target.files[0]){state.event.logoWhite=await putBlob(e.target.files[0]);saveState();setImg($('#logoWhitePreview'),state.event.logoWhite);}};
    $('#qrXUpload').onchange=async e=>{if(e.target.files[0]){state.event.qrX=await putBlob(e.target.files[0]);saveState();setImg($('#qrXPreview'),state.event.qrX);}};
    $('#qrBoothUpload').onchange=async e=>{if(e.target.files[0]){state.event.qrBooth=await putBlob(e.target.files[0]);saveState();setImg($('#qrBoothPreview'),state.event.qrBooth);}};
    $$('.palette-option').forEach(el=>el.onclick=()=>{state.event.palette=el.dataset.palette;fillDesignAdmin();});
    [['customBg','background'],['customCard','card'],['customAccent','accent']].forEach(([id,key])=>{
      const picker=$('#'+id), text=$('#'+id+'Hex');
      picker?.addEventListener('input',()=>{text.value=picker.value;});
      text?.addEventListener('change',()=>{const v=normalizeHex(text.value,picker.value);text.value=v;picker.value=v;});
    });
    $('#saveDesignBtn').onclick=()=>{
      const d=demoSeed().event.customColors;
      state.event.customColors={background:normalizeHex($('#customBgHex').value,d.background),card:normalizeHex($('#customCardHex').value,d.card),accent:normalizeHex($('#customAccentHex').value,d.accent)};
      saveState(); fillDesignAdmin(); alert('デザイン設定を保存しました');
    };
    $('#addProductBtn').onclick=addProduct;
    $('#saveDemoBtn').onclick=()=>{['menuForwardSeconds','menuBackwardSeconds','headerFocusSeconds','cardFocusSeconds','menuCardSizePercent','coverSeconds','pageSeconds','previewPageCount','resumeSeconds','readerTimeoutSeconds','fadeSeconds','pdfRenderPercent'].forEach(k=>{const el=$('#'+k); if(el) state.demo[k]=Number(el.value);}); const pdfMode=$('#pdfRenderMode'); if(pdfMode) state.demo.pdfRenderMode=pdfMode.value; saveState();applyFade();alert('デモ設定を保存しました');};
    $('#saveTouchBtn').onclick=()=>{['menuHoldMs','previewHoldMs','dragThreshold','cooldownMs'].forEach(k=>state.touch[k]=Number($('#'+k).value));saveState();alert('タッチ設定を保存しました');};
    $('#blankBtn').onclick=()=>{if(confirm('登録内容をブランクにします。よろしいですか？')){const defaults=demoSeed();state={event:{...defaults.event,circle:'',name:'',space:''},demo:defaults.demo,touch:defaults.touch,device:defaults.device,products:[]};saveState();fillAdmin();alert('ブランク状態にしました');}};
    $('#seedBtn').onclick=()=>{if(confirm('今回のデモデータに戻しますか？')){state=demoSeed();saveState();fillAdmin();alert('デモデータを読み込みました');}};
    $('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='gloriosa-display-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
    $('#importInput').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{state=JSON.parse(await f.text());saveState();fillAdmin();alert('設定を読み込みました');}catch{alert('JSONを読み込めませんでした');}};
  }

  function setupTouchTest(){let t=0;const el=$('#touchTest');el.addEventListener('pointerdown',()=>{t=performance.now();$('#touchTestResult').textContent='接触中…';});el.addEventListener('pointerup',()=>{const ms=Math.round(performance.now()-t);$('#touchTestResult').textContent=`接触時間 ${ms}ms — ${ms>=state.touch.menuHoldMs?'人のタップ候補':'短いため無視候補'}`;});}

  function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function escapeAttr(v=''){return escapeHtml(v);}

  async function init(){
    registerServiceWorker();
    applyFade(); setupAdminEvents(); setupPreviewPointer(); setupReaderPointer(); setupTouchTest();
    $('#readerBackBtn').onclick=()=>returnToMenu(false); $('#goodsBackBtn').onclick=()=>returnToMenu(false); $('#readerPrev').onclick=()=>shiftReader(-1); $('#readerNext').onclick=()=>shiftReader(1);
    $('#startDemoBtn').onclick=()=>{requestWakeLock();stopAutoplay();autoplayLoop();};
    await renderMenu(); if(visibleProducts().length) autoplayLoop(); else showScreen('empty');
  }
  window.addEventListener('resize',()=>{if(currentScreen==='menu')setCamera(menuCamera.x,menuCamera.y);});
  document.addEventListener('pointerdown',()=>{if(state.device?.keepAwake) requestWakeLock();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.device?.keepAwake) requestWakeLock();});
  navigator.serviceWorker?.addEventListener?.('message',e=>{if(e.data?.type==='PDFJS_CACHE_RESULT') updateDeviceStatus();});
  init();
})();
