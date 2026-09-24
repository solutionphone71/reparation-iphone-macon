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
    var detailModel=(document.querySelector('h1')?.textContent||document.title||'votre iPhone').replace(/\s+/g,' ').trim();
    var detailFile=(location.pathname.split('/').pop()||'').toLowerCase();
    var detailModelValue=detailFile.indexOf('iphone-')===0?((document.querySelector('h1 .gradient')||{}).textContent||'').trim():'';
    var detailIssue=detailFile.indexOf('batterie')>=0?'batterie':detailFile.indexOf('connecteur')>=0?'connecteur':detailFile.indexOf('ecran')>=0?'ecran':'autre';
    var emailQuoteUrl='index.html?email=1&panne='+encodeURIComponent(detailIssue)+(detailModelValue?'&modele='+encodeURIComponent(detailModelValue):'')+'#devis';
    /* L'en-tête et le menu sont fournis par menu-commun.js (menu commun des 3 sites). */
    var conversionDock=document.createElement('div');
    conversionDock.className='sp-detail-conversion-dock';
    conversionDock.setAttribute('aria-label','Demander un devis');
    conversionDock.innerHTML='<a class="sp-detail-dock-wa" href="https://wa.me/33783921884?text='+encodeURIComponent('Bonjour, devis urgent pour '+detailModel)+'" target="_blank" rel="noopener"><span>WhatsApp</span><strong>Devis urgent</strong></a><a class="sp-detail-dock-mail" href="'+emailQuoteUrl+'"><span>E-mail</span><strong>Recevoir un devis</strong></a>';
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
