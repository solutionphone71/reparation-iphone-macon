(function(){
  var trackingUrl='https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/evan-brain';
  var trackingKey='sb_publishable_3Mub3jSj8wUC8mfFtAuhdA_P4Ljnnhb';
  var trackingToken='';
  try{trackingToken=sessionStorage.getItem('iphone_detail_tracking_token')||''}catch(e){}
  function track(event,metadata){
    fetch(trackingUrl,{method:'POST',headers:{apikey:trackingKey,Authorization:'Bearer '+trackingKey,'Content-Type':'application/json'},body:JSON.stringify({event:event,conversation_token:trackingToken||undefined,event_metadata:metadata||{},context:{page:location.pathname,consent_to_store:false}})})
      .then(function(response){return response.ok?response.json():null})
      .then(function(data){if(data&&data.conversation_token){trackingToken=data.conversation_token;try{sessionStorage.setItem('iphone_detail_tracking_token',trackingToken)}catch(e){}}})
      .catch(function(){});
  }
  function init(){
    var mainBase=location.hostname==='localhost'?'http://localhost:4173':'https://solution-phone.fr';
    var detailModel=(document.querySelector('h1')?.textContent||document.title||'votre iPhone').replace(/\s+/g,' ').trim();
    document.querySelectorAll('body>nav').forEach(function(nav){nav.classList.add('sp-detail-legacy')});
    var header=document.createElement('header');header.className='sp-detail-header';
    header.innerHTML='<div class="sp-detail-inner"><button class="sp-detail-back" type="button" aria-label="Revenir à la page précédente"><span aria-hidden="true">←</span><b>Retour</b></button><a class="sp-detail-brand" href="'+mainBase+'/"><span class="sp-detail-mark">SP</span><span><strong>Solution Phone</strong><small>Atelier indépendant · Mâcon</small></span></a><nav class="sp-detail-links" aria-label="Navigation iPhone"><a href="index.html#devis">iPhone</a><a href="'+mainBase+'/reparation-samsung.html">Android</a><a href="ecran.html">Écran</a><a href="batterie.html">Batterie</a><a href="qualirepar.html">QualiRépar</a><a href="'+mainBase+'/reconditionnes.html">Reconditionnés</a><a href="'+mainBase+'/atelier.html">L’atelier</a></nav><a class="sp-detail-wa" href="https://wa.me/33783921884?text=Bonjour%2C%20je%20souhaite%20un%20devis%20iPhone" target="_blank" rel="noopener">WhatsApp ↗</a><button class="sp-detail-menu" type="button" aria-label="Ouvrir le menu" aria-expanded="false">☰</button></div>';
    document.body.insertBefore(header,document.body.firstChild);
    header.querySelector('.sp-detail-back').addEventListener('click',function(){if(history.length>1)history.back();else location.href=mainBase+'/'});
    var panel=document.createElement('nav');panel.className='sp-detail-panel';panel.setAttribute('aria-label','Menu mobile');panel.innerHTML='<a href="'+mainBase+'/">Accueil & devis</a><a href="index.html#devis">Réparation iPhone</a><a href="'+mainBase+'/reparation-samsung.html">Réparation Android</a><a href="ecran.html">Réparation écran</a><a href="batterie.html">Remplacement batterie</a><a href="qualirepar.html">QualiRépar</a><a href="'+mainBase+'/reconditionnes.html">Smartphones reconditionnés</a><a href="'+mainBase+'/atelier.html">Atelier & contact</a><a href="https://wa.me/33783921884" target="_blank" rel="noopener">WhatsApp direct</a>';header.insertAdjacentElement('afterend',panel);
    var button=header.querySelector('.sp-detail-menu');button.addEventListener('click',function(){var open=panel.classList.toggle('open');button.setAttribute('aria-expanded',String(open));button.textContent=open?'×':'☰'});panel.addEventListener('click',function(e){if(e.target.closest('a')){panel.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰'}});document.addEventListener('keydown',function(e){if(e.key==='Escape'){panel.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰'}});
    var conversionDock=document.createElement('div');
    conversionDock.className='sp-detail-conversion-dock';
    conversionDock.setAttribute('aria-label','Demander un devis');
    conversionDock.innerHTML='<a class="sp-detail-dock-wa" href="https://wa.me/33783921884?text='+encodeURIComponent('Bonjour, devis urgent pour '+detailModel)+'" target="_blank" rel="noopener"><span>WhatsApp</span><strong>Devis urgent</strong></a><a class="sp-detail-dock-mail" href="index.html#devis"><span>E-mail</span><strong>Recevoir un devis</strong></a>';
    document.body.appendChild(conversionDock);
    var hero=document.querySelector('.hero-inner');
    if(hero){
      var product=document.createElement('section');
      product.className='sp-detail-product';
      product.innerHTML='<div class="sp-detail-product-visual"><img src="iphone-exploded-repair.jpg" alt="Vue décomposée des composants réparables d’un iPhone" width="1536" height="1024" loading="eager"></div><div class="sp-detail-product-copy"><span>Diagnostic '+detailModel.replace(/</g,'&lt;')+'</span><h2>La bonne pièce.<br>Pas une de plus.</h2><p>Écran, batterie, charge, caméra, audio ou dos : l’équipe identifie la panne, annonce le prix et attend votre accord avant toute intervention.</p><a href="index.html#devis">Obtenir mon tarif</a></div>';
      hero.insertAdjacentElement('afterend',product);
      var reality=document.createElement('figure');
      reality.className='sp-detail-reality';
      reality.innerHTML='<img src="evan-comptoir.webp" alt="L’équipe dans la boutique Solution Phone à Mâcon" width="1448" height="1086" loading="lazy"><figcaption><span>La réparation se passe ici</span><strong>21 rue Gambetta · Mâcon</strong><small>Diagnostic et devis validés par l’équipe avant intervention.</small></figcaption>';
      product.insertAdjacentElement('afterend',reality);
    }
    document.addEventListener('click',function(event){var link=event.target.closest('a[href*="wa.me"]');if(link)track('whatsapp_clicked',{source:'iphone_detail',page:location.pathname})});
    var evanWidget=document.createElement('script');evanWidget.src='evan-cross-widget.js?v=conversion-simple-1';document.body.appendChild(evanWidget);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
