"use strict";

const SOURCES = [
  { type: "Manga", file: "files/Manga/index.json" },
  { type: "Manhwa", file: "files/Manhwa/index.json" }
];

const mangaGrid = document.getElementById("mangaGrid");
const mangaCount = document.getElementById("mangaCount");
const popularList = document.getElementById("popularList");
const noResults = document.getElementById("noResults");
const searchToggle = document.getElementById("searchToggle");
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const themeBtn = document.getElementById("themeBtn");
const menuBtn = document.getElementById("menuBtn");

let allWorks = [];

function esc(v) {
  return String(v ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function htmlFile(v) {
  v = String(v || "").trim();
  if (!v) return "";
  return v.toLowerCase().endsWith(".html") ? v : `${v}.html`;
}

function folderFor(work) {
  return String(work.type || "Manga").toLowerCase() === "manhwa"
    ? "Manhwa" : "Manga";
}

function workUrl(work) {
  return `files/${folderFor(work)}/${htmlFile(work.page || work.slug)}`;
}

function chapterUrl(work) {
  const c = work.latestChapterUrl;
  return c
    ? `files/${folderFor(work)}/${htmlFile(c)}`
    : workUrl(work);
}

async function loadWorks() {
  mangaGrid.innerHTML = `<div class="loading">جاري تحميل الأعمال...</div>`;

  const results = await Promise.all(SOURCES.map(async source => {
    try {
      const r = await fetch(source.file, { cache: "no-store" });
      if (!r.ok) throw new Error(`${source.file}: ${r.status}`);
      const d = await r.json();
      return Array.isArray(d) ? d.map(x => ({...x, type: x.type || source.type})) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }));

  allWorks = results.flat();
  renderWorks(allWorks);
  renderPopular(allWorks);
  updateHero(allWorks);
}

function createWorkCard(work) {
  const article = document.createElement("article");
  article.className = "manga-card";
  article.dataset.title = work.name || "";

  const name = work.name || "بدون اسم";
  const status = work.status || "مستمرة";
  const statusClass = status === "مكتملة" ? "completed" : "ongoing";

  article.innerHTML = `
    <div class="cover-container">
      <img src="${esc(work.cover || "https://picsum.photos/500/750?random=99")}"
           alt="${esc(name)}" loading="lazy">
      <span class="status ${statusClass}">${esc(status)}</span>
      <button class="favorite" type="button" data-favorite="${esc(work.slug || name)}">♡</button>
    </div>
    <div class="manga-content">
      <h3>${esc(name)}</h3>
      <div class="rating">⭐ ${esc(work.rating ?? "—")}</div>
      <div class="chapter-row">
        <span>الفصل ${esc(work.latestChapter ?? "—")}</span>
        <span>${esc(work.type || "")}</span>
      </div>
      <div class="card-buttons">
        <a href="${esc(workUrl(work))}" class="read-btn">📖 العمل</a>
        <a href="${esc(chapterUrl(work))}" class="download-btn">الفصل الأخير</a>
      </div>
    </div>`;
  return article;
}

function renderWorks(works) {
  mangaGrid.innerHTML = "";
  if (!works.length) {
    noResults.hidden = false;
    mangaCount.textContent = "0 عمل";
    return;
  }
  noResults.hidden = true;
  mangaCount.textContent = `${works.length} عمل`;
  works.forEach(w => mangaGrid.appendChild(createWorkCard(w)));
  setupFavorites();
}

function renderPopular(works) {
  if (!popularList) return;
  popularList.innerHTML = "";
  [...works].sort((a,b)=>Number(b.rating||0)-Number(a.rating||0)).slice(0,4).forEach((work,i)=>{
    const item=document.createElement("div");
    item.className="popular-item";
    item.innerHTML=`
      <span class="rank">${String(i+1).padStart(2,"0")}</span>
      <img src="${esc(work.cover || "https://picsum.photos/300/450")}" alt="${esc(work.name||"")}" loading="lazy">
      <div>
        <h3>${esc(work.name||"")}</h3>
        <p>${(Array.isArray(work.genres)?work.genres:[]).map(esc).join(" • ")}</p>
        <strong>⭐ ${esc(work.rating ?? "—")}</strong>
      </div>`;
    item.addEventListener("click",()=>location.href=workUrl(work));
    popularList.appendChild(item);
  });
}

function updateHero(works) {
  if (!works.length) return;
  const best=[...works].sort((a,b)=>Number(b.rating||0)-Number(a.rating||0))[0];
  const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v;};
  set("heroTitle",best.name||"MangaX");
  set("heroRating",`⭐ ${best.rating||"—"}`);
  set("heroChapter",`📚 الفصل ${best.latestChapter||"—"}`);
  set("heroType",`📖 ${best.type||""}`);
  set("heroDescription",`${(best.genres||[]).join(" • ")} — ${best.status||""}`);
  const bg=document.querySelector(".hero-background");
  if(bg && best.cover) bg.style.backgroundImage=`url("${best.cover}")`;
}

if (searchToggle && searchPanel) {
  searchToggle.addEventListener("click",()=>{
    searchPanel.classList.toggle("open");
    if(searchPanel.classList.contains("open") && searchInput) searchInput.focus();
  });
}

if (searchInput) {
  searchInput.addEventListener("input",()=>{
    const q=searchInput.value.trim().toLowerCase();
    if(!q) return renderWorks(allWorks);
    renderWorks(allWorks.filter(w=>{
      const n=String(w.name||"").toLowerCase();
      const g=Array.isArray(w.genres)?w.genres.join(" ").toLowerCase():"";
      const t=String(w.type||"").toLowerCase();
      return n.includes(q)||g.includes(q)||t.includes(q);
    }));
  });
}

if(clearSearch){
  clearSearch.addEventListener("click",()=>{
    searchInput.value="";
    renderWorks(allWorks);
    searchInput.focus();
  });
}

const savedTheme=localStorage.getItem("mangax-theme");
if(savedTheme==="light"){
  document.body.classList.add("light");
  if(themeBtn) themeBtn.textContent="☀";
}
if(themeBtn){
  themeBtn.addEventListener("click",()=>{
    document.body.classList.toggle("light");
    const light=document.body.classList.contains("light");
    localStorage.setItem("mangax-theme",light?"light":"dark");
    themeBtn.textContent=light?"☀":"☾";
  });
}

if(menuBtn){
  menuBtn.addEventListener("click",()=>{
    const nav=document.querySelector(".navigation");
    if(!nav)return;
    nav.style.display=nav.style.display==="flex"?"":"flex";
    if(nav.style.display==="flex"){
      Object.assign(nav.style,{
        position:"absolute",top:"68px",right:"10px",left:"10px",
        padding:"15px",background:"var(--card)",
        border:"1px solid var(--border)",borderRadius:"15px",
        flexDirection:"column"
      });
    }
  });
}

function setupFavorites(){
  document.querySelectorAll(".favorite").forEach(btn=>{
    const id=btn.dataset.favorite;
    let f=[];
    try{f=JSON.parse(localStorage.getItem("mangax-favorites")||"[]")}catch{}
    if(f.includes(id)){btn.classList.add("active");btn.textContent="♥";}
    btn.addEventListener("click",e=>{
      e.preventDefault(); e.stopPropagation();
      try{f=JSON.parse(localStorage.getItem("mangax-favorites")||"[]")}catch{f=[]}
      if(f.includes(id)){
        f=f.filter(x=>x!==id); btn.classList.remove("active"); btn.textContent="♡";
      }else{
        f.push(id); btn.classList.add("active"); btn.textContent="♥";
      }
      localStorage.setItem("mangax-favorites",JSON.stringify(f));
    });
  });
}

loadWorks();
