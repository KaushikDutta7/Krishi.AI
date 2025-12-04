// app.js — defensive, waits for DOM ready, logs useful debug info

(function(){
  // Utility: safe DOM getter
  const $ = (id) => document.getElementById(id);

  function log(...args){ console.log('[Krishi.AI]', ...args) }
  function err(...args){ console.error('[Krishi.AI]', ...args) }

  document.addEventListener('DOMContentLoaded', () => {
    log('DOM loaded — initializing app');

    // dataset
    const soilData = [
      {name: 'Alluvial Soil', states:['Punjab','Haryana','Uttar Pradesh','Bihar','West Bengal'], crops:['Rice','Wheat','Sugarcane','Pulses','Maize'], period:'Kharif & Rabi', details:'Found in Indo-Gangetic plains. Rich in potash & lime.'},
      {name: 'Black Soil', states:['Maharashtra','Madhya Pradesh','Gujarat'], crops:['Cotton','Sugarcane','Tobacco','Jowar','Sunflower'], period:'Kharif', details:'Moisture-retaining, good for cotton.'},
      {name: 'Red Soil', states:['Tamil Nadu','Karnataka','Odisha','Jharkhand'], crops:['Millets','Groundnut','Potato','Oilseeds'], period:'Kharif', details:'Rich in iron, low nitrogen.'},
      {name: 'Laterite Soil', states:['Kerala','Karnataka','Goa'], crops:['Tea','Coffee','Cashew','Rubber'], period:'Plantation', details:'Leached, acidic; needs manure.'},
      {name: 'Desert Soil', states:['Rajasthan'], crops:['Bajra','Guar','Dates'], period:'Kharif', details:'Sandy, needs irrigation.'}
    ];

    const cropData = [
      {name:'Rice', season:'Kharif', duration:'100-150 days', notes:'Needs standing water.'},
      {name:'Wheat', season:'Rabi', duration:'120-140 days', notes:'Cool season crop.'},
      {name:'Cotton', season:'Kharif', duration:'150-200 days', notes:'Prefers black soils.'},
      {name:'Sugarcane', season:'Long', duration:'10-18 months', notes:'High nutrient demand.'},
      {name:'Millets', season:'Kharif/Rabi', duration:'70-120 days', notes:'Drought tolerant.'}
    ];

    // DOM refs (use $ and guard)
    const searchBox = $('searchBox');
    const resultsDiv = $('results');
    const soilList = $('soilList');
    const cropList = $('cropList');
    const statesButtons = $('statesButtons');
    const soilTags = $('soilTags');
    const fertSoil = $('fertSoil');
    const fertCrop = $('fertCrop');
    const fertResult = $('fertResult');
    const calcBtn = $('calcBtn');
    const searchBtn = $('searchBtn');

    // show basic UI error if something critical is missing
    if(!searchBox || !resultsDiv){
      err('Critical DOM elements missing. Make sure index.html contains elements with ids: searchBox, results');
      if(resultsDiv) resultsDiv.innerHTML = '<p style="color:crimson">App failed to initialize — missing DOM elements. Open console for details.</p>';
      return;
    }

    // --- rendering functions ---
    function makeSoilCard(s){
      const div = document.createElement('div');
      div.className = 'soil-card';
      div.innerHTML = `<h3>${s.name}</h3>
        <div class="soil-meta">${s.states.join(', ')} • ${s.period}</div>
        <ul class="crops">${s.crops.map(c=>`<li>${c}</li>`).join('')}</ul>
        <p style="margin-top:8px;color:var(--muted)">${s.details}</p>`;
      return div;
    }

    function renderSoils(filter){
      if(!soilList){ log('renderSoils: soilList element not present; skipping'); return; }
      soilList.innerHTML = '';
      const list = filter ? soilData.filter(s =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.states.some(st => st.toLowerCase().includes(filter.toLowerCase()))
      ) : soilData;
      if(list.length === 0){
        soilList.innerHTML = '<p class="soil-meta">No results</p>';
        return;
      }
      list.forEach(s => soilList.appendChild(makeSoilCard(s)));
    }

    function renderCrops(filter){
      if(!cropList){ log('renderCrops: cropList missing; skipping'); return; }
      cropList.innerHTML = '';
      const list = filter ? cropData.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())) : cropData;
      if(list.length === 0){
        cropList.innerHTML = '<p class="soil-meta">No results</p>';
        return;
      }
      list.forEach(c => {
        const d = document.createElement('div');
        d.className = 'soil-card';
        d.innerHTML = `<h3>${c.name}</h3><div class="soil-meta">Season: ${c.season} • ${c.duration}</div><p style="margin-top:8px;color:var(--muted)">${c.notes}</p>`;
        cropList.appendChild(d);
      });
    }

    // --- states buttons ---
    if(statesButtons){
      const uniqueStates = [...new Set(soilData.flatMap(s=>s.states))].sort();
      uniqueStates.forEach(st => {
        const b = document.createElement('button');
        b.textContent = st;
        b.style.padding='8px 10px';
        b.style.borderRadius='8px';
        b.style.border='1px solid #e6f2ea';
        b.style.background='#fff';
        b.style.cursor='pointer';
        b.addEventListener('click', ()=> { showPage('soils'); renderSoils(st); });
        statesButtons.appendChild(b);
      });
    } else {
      log('statesButtons element not found — skipping state buttons rendering');
    }

    // --- tags ---
    if(soilTags){
      soilData.forEach(s => {
        const b = document.createElement('button');
        b.textContent = s.name;
        b.addEventListener('click', ()=> { showPage('soils'); renderSoils(s.name); });
        soilTags.appendChild(b);
      });
    } else {
      log('soilTags element not found — skipping tags rendering');
    }

    // --- navigation ---
    function showPage(id){
      // hide all main left-column sections
      document.querySelectorAll('main > div > section').forEach(el => el.style.display = 'none');
      const target = document.getElementById(id);
      if(target) target.style.display = 'block';
      else log('showPage: target not found', id);
      window.scrollTo({top:80, behavior:'smooth'});
    }
    document.querySelectorAll('nav.topnav button').forEach(b => b.addEventListener('click', ()=> showPage(b.dataset.page)));

    // --- search ---
    if(searchBtn) searchBtn.addEventListener('click', doSearch);
    if(searchBox) searchBox.addEventListener('keydown', e => { if(e.key === 'Enter') doSearch(); });

    function doSearch(){
      const q = (searchBox.value || '').trim().toLowerCase();
      if(!q){ resultsDiv.innerHTML = 'Please enter a search term.'; return; }
      const soilsMatch = soilData.filter(s => s.name.toLowerCase().includes(q) || s.states.some(st => st.toLowerCase().includes(q)) || s.crops.some(c => c.toLowerCase().includes(q)));
      const cropsMatch = cropData.filter(c => c.name.toLowerCase().includes(q));
      let html = '';
      if(soilsMatch.length) html += `<strong>Soil matches</strong><ul>${soilsMatch.map(s => `<li><a href="#" data-soil="${s.name}">${s.name} — ${s.states.join(', ')}</a></li>`).join('')}</ul>`;
      if(cropsMatch.length) html += `<strong style="display:block;margin-top:8px">Crop matches</strong><ul>${cropsMatch.map(c => `<li><a href="#" data-crop="${c.name}">${c.name}</a></li>`).join('')}</ul>`;
      if(!html) html = '<p class="soil-meta">No results found.</p>';
      resultsDiv.innerHTML = html;

      // bind links (guard)
      resultsDiv.querySelectorAll('[data-soil]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault();
        const name = a.dataset.soil;
        renderSoils(name);
        showPage('soils');
      }));
      resultsDiv.querySelectorAll('[data-crop]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault();
        const name = a.dataset.crop;
        renderCrops(name);
        showPage('crops');
      }));
    }

    // --- fertilizer ---
    if(fertSoil && fertCrop){
      soilData.forEach(s => {
        const o = document.createElement('option'); o.value = s.name; o.textContent = s.name; fertSoil.appendChild(o);
      });
      cropData.forEach(c => {
        const o = document.createElement('option'); o.value = c.name; o.textContent = c.name; fertCrop.appendChild(o);
      });
    } else {
      log('fert selects not found; fertilizer dropdowns disabled');
    }

    const baseNPK = {Rice:[100,50,50],Wheat:[120,60,40],Cotton:[80,40,40],Sugarcane:[200,80,80],Millets:[40,20,20]};
    if(calcBtn){
      calcBtn.addEventListener('click', () => {
        const soil = fertSoil ? fertSoil.value : '';
        const crop = fertCrop ? fertCrop.value : '';
        const areaEl = $('area');
        const area = areaEl ? parseFloat(areaEl.value) || 1 : 1;
        if(!baseNPK[crop]){ if(fertResult) fertResult.innerHTML = '<p class="soil-meta">No profile for this crop.</p>'; return; }
        let modifier = 1;
        if(soil.includes('Red')||soil.includes('Laterite')||soil.includes('Desert')) modifier = 1.15;
        if(soil.includes('Black')) modifier = 0.9;
        const base = baseNPK[crop];
        const N = Math.round(base[0]*modifier*area);
        const P = Math.round(base[1]*modifier*area);
        const K = Math.round(base[2]*modifier*area);
        if(fertResult) fertResult.innerHTML = `<p><strong>Suggested N-P-K for <em>${crop}</em> on <em>${soil}</em> for ${area} ha:</strong></p><ul><li>N: ${N} kg</li><li>P: ${P} kg</li><li>K: ${K} kg</li></ul><p class="soil-meta">Illustrative estimates only. Use soil test results and local agronomy advice for production.</p>`;
      });
    }

    // initial render
    try{
      renderSoils();
      renderCrops();
      showPage('home');
      log('App initialized successfully');
    }catch(e){
      err('Initialization error:', e);
      if(resultsDiv) resultsDiv.innerHTML = '<p style="color:crimson">Initialization error — open console for details.</p>';
    }
  }); // end DOMContentLoaded
})();
