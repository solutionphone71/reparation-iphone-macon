(function(){
  function init(){
    var mainBase=location.hostname==='localhost'?'http://localhost:4175':'https://solution-phone.fr';
    document.querySelectorAll('body>nav').forEach(function(nav){nav.classList.add('sp-detail-legacy')});
    var header=document.createElement('header');header.className='sp-detail-header';
    header.innerHTML='<div class="sp-detail-inner"><button class="sp-detail-back" type="button" aria-label="Revenir à la page précédente"><span aria-hidden="true">←</span><b>Retour</b></button><a class="sp-detail-brand" href="'+mainBase+'/"><span class="sp-detail-mark">SP</span><span><strong>Solution Phone</strong><small>Atelier indépendant · Mâcon</small></span></a><nav class="sp-detail-links" aria-label="Navigation iPhone"><a href="index.html#devis">iPhone</a><a href="'+mainBase+'/reparation-samsung.html">Android</a><a href="ecran.html">Écran</a><a href="batterie.html">Batterie</a><a href="qualirepar.html">QualiRépar</a><a href="'+mainBase+'/reconditionnes.html">Reconditionnés</a><a href="'+mainBase+'/atelier.html">L’atelier</a></nav><a class="sp-detail-wa" href="https://wa.me/33783921884?text=Bonjour%2C%20je%20souhaite%20un%20devis%20iPhone" target="_blank" rel="noopener">WhatsApp ↗</a><button class="sp-detail-menu" type="button" aria-label="Ouvrir le menu" aria-expanded="false">☰</button></div>';
    document.body.insertBefore(header,document.body.firstChild);
    header.querySelector('.sp-detail-back').addEventListener('click',function(){if(history.length>1)history.back();else location.href=mainBase+'/'});
    var panel=document.createElement('nav');panel.className='sp-detail-panel';panel.setAttribute('aria-label','Menu mobile');panel.innerHTML='<a href="'+mainBase+'/">Accueil & devis</a><a href="index.html#devis">Réparation iPhone</a><a href="'+mainBase+'/reparation-samsung.html">Réparation Android</a><a href="ecran.html">Réparation écran</a><a href="batterie.html">Remplacement batterie</a><a href="qualirepar.html">QualiRépar</a><a href="'+mainBase+'/reconditionnes.html">Smartphones reconditionnés</a><a href="'+mainBase+'/atelier.html">Atelier & contact</a><a href="https://wa.me/33783921884" target="_blank" rel="noopener">WhatsApp direct</a>';header.insertAdjacentElement('afterend',panel);
    var button=header.querySelector('.sp-detail-menu');button.addEventListener('click',function(){var open=panel.classList.toggle('open');button.setAttribute('aria-expanded',String(open));button.textContent=open?'×':'☰'});panel.addEventListener('click',function(e){if(e.target.closest('a')){panel.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰'}});document.addEventListener('keydown',function(e){if(e.key==='Escape'){panel.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰'}});
    var hero=document.querySelector('.hero-inner');
    if(hero){
      var product=document.createElement('section');
      product.className='sp-detail-product';
      var model=(document.querySelector('h1')?.textContent||document.title||'Votre iPhone').replace(/\s+/g,' ').trim();
      product.innerHTML='<div class="sp-detail-product-visual"><img src="iphone-exploded-repair.jpg" alt="Vue décomposée des composants réparables d’un iPhone" width="1536" height="1024" loading="eager"></div><div class="sp-detail-product-copy"><span>Diagnostic '+model.replace(/</g,'&lt;')+'</span><h2>La bonne pièce.<br>Pas une de plus.</h2><p>Écran, batterie, charge, caméra, audio ou dos : l’équipe identifie la panne, annonce le prix et attend votre accord avant toute intervention.</p><a href="index.html#devis">Obtenir mon tarif</a></div>';
      hero.insertAdjacentElement('afterend',product);
      var reality=document.createElement('figure');
      reality.className='sp-detail-reality';
      reality.innerHTML='<img src="evan-comptoir.webp" alt="L’équipe dans la boutique Solution Phone à Mâcon" width="1448" height="1086" loading="lazy"><figcaption><span>La réparation se passe ici</span><strong>21 rue Gambetta · Mâcon</strong><small>Diagnostic et devis validés par l’équipe avant intervention.</small></figcaption>';
      product.insertAdjacentElement('afterend',reality);
    }
    var evanWidget=document.createElement('script');evanWidget.src='evan-cross-widget.js?v=3';document.body.appendChild(evanWidget);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
