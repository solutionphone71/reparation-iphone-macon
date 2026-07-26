(function(){
  if(document.querySelector('.sp-sebastien-mini'))return;
  var mainBase=location.hostname==='localhost'?'http://localhost:4175':'https://solution-phone.fr';
  function selectedModel(){
    var select=document.getElementById('hero-model');
    var value=select&&select.value?String(select.value).trim():'';
    return value&&value.toLowerCase()!=='choisir'?'iPhone '+value.replace(/^iphone\s*/i,''):'';
  }
  var style=document.createElement('style');
  style.textContent=`
    .sp-sebastien-mini{position:fixed;left:16px;bottom:16px;z-index:2147483000;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .sp-sebastien-launch{display:flex;align-items:center;gap:9px;border:1px solid #d8d8dc;border-radius:999px;background:#fff;color:#171719;padding:7px 14px 7px 7px;box-shadow:0 14px 34px rgba(0,0,0,.16);font-weight:750;cursor:pointer}
    .sp-sebastien-avatar{display:block;width:40px;height:40px;border-radius:50%;background:url("sebastien-avatar-anime-v1.jpg") left top/200% 200% no-repeat}
    .sp-sebastien-panel{display:none;position:absolute;left:0;bottom:62px;width:min(360px,calc(100vw - 32px));overflow:hidden;border:1px solid #d8d8dc;border-radius:20px;background:#f5f5f7;box-shadow:0 24px 65px rgba(0,0,0,.22)}
    .sp-sebastien-mini.open .sp-sebastien-panel{display:block}
    .sp-sebastien-head{display:flex;align-items:center;padding:13px 15px;background:#171719;color:#fff}.sp-sebastien-head b{font-size:13px}.sp-sebastien-close,.sp-sebastien-back{border:0;background:transparent;color:#fff;font-size:21px;cursor:pointer}.sp-sebastien-close{margin-left:auto}.sp-sebastien-back{display:none;margin-left:auto}
    .sp-sebastien-start{padding:18px}.sp-sebastien-start>b{display:block;font-size:19px;line-height:1.12;margin-bottom:12px}.sp-sebastien-panel button[data-q]{display:block;width:100%;border:0;border-top:1px solid #d4d4d7;background:transparent;padding:11px 2px;text-align:left;font-size:12px;font-weight:650;cursor:pointer}
    .sp-sebastien-form{display:grid;grid-template-columns:1fr 44px;border:1px solid #171719;border-radius:12px;overflow:hidden;background:#fff;margin-top:10px}.sp-sebastien-form input{min-width:0;border:0;padding:12px;outline:0}.sp-sebastien-form button{border:0;background:#d92d28;color:#fff;font-size:18px}
    .sp-sebastien-frame{display:none;height:min(650px,calc(100vh - 160px))}.sp-sebastien-frame iframe{display:block;width:100%;height:100%;border:0}.sp-sebastien-mini.conversation .sp-sebastien-panel{width:min(440px,calc(100vw - 32px))}.sp-sebastien-mini.conversation .sp-sebastien-start{display:none}.sp-sebastien-mini.conversation .sp-sebastien-frame,.sp-sebastien-mini.conversation .sp-sebastien-back{display:block}.sp-sebastien-mini.conversation .sp-sebastien-close{margin-left:0}
    @media(max-width:720px){.sp-sebastien-mini{bottom:74px;left:10px}.sp-sebastien-launch span:last-child{display:none}.sp-sebastien-mini.conversation .sp-sebastien-panel{position:fixed;inset:8px 8px 74px;width:auto}.sp-sebastien-mini.conversation .sp-sebastien-frame{height:calc(100% - 50px)}}`;
  document.head.appendChild(style);
  var root=document.createElement('aside');
  root.className='sp-sebastien-mini';
  root.innerHTML='<div class="sp-sebastien-panel"><div class="sp-sebastien-head"><b>Sébastien · Solution Phone</b><button class="sp-sebastien-back" aria-label="Poser une autre question">←</button><button class="sp-sebastien-close" aria-label="Fermer">×</button></div><div class="sp-sebastien-start"><b>Une question sur votre iPhone ?</b><button data-topic="screen">Tarif de l’écran</button><button data-topic="battery">Tarif de la batterie</button><button data-topic="quality">Choisir la qualité d’écran</button><form class="sp-sebastien-form"><input aria-label="Question à l’assistant de Sébastien" placeholder="Votre question…"><button aria-label="Envoyer">→</button></form></div><div class="sp-sebastien-frame"></div></div><button class="sp-sebastien-launch" aria-expanded="false"><span class="sp-sebastien-avatar" aria-hidden="true"></span><span>Demandez à Sébastien</span></button>';
  document.body.appendChild(root);
  var frameBox=root.querySelector('.sp-sebastien-frame');
  function ask(q){if(!q)return;root.classList.add('conversation','open');frameBox.innerHTML='<iframe title="Conversation avec l’assistant de Sébastien" src="'+mainBase+'/concept-evan.html?embed=1&q='+encodeURIComponent(q)+'&from=iphone"></iframe>'}
  function topicQuestion(topic){
    var model=selectedModel();
    if(topic==='screen')return model?'Quel est le tarif écran pour '+model+' ?':'Je cherche le tarif d’un écran iPhone. Quel modèle dois-je vous préciser ?';
    if(topic==='battery')return model?'Quel est le tarif batterie pour '+model+' ?':'Je cherche le tarif d’une batterie iPhone. Quel modèle dois-je vous préciser ?';
    return model?'Quelle qualité d’écran choisir pour '+model+' ?':'Expliquez-moi les qualités d’écran iPhone, puis demandez-moi mon modèle.';
  }
  function reset(){root.classList.remove('conversation');frameBox.innerHTML=''}
  var launch=root.querySelector('.sp-sebastien-launch');
  launch.setAttribute('aria-label','Demandez à Sébastien');
  launch.addEventListener('click',function(){var open=root.classList.toggle('open');launch.setAttribute('aria-expanded',String(open))});
  root.querySelector('.sp-sebastien-close').addEventListener('click',function(){root.classList.remove('open');launch.setAttribute('aria-expanded','false')});
  root.querySelector('.sp-sebastien-back').addEventListener('click',reset);
  root.querySelectorAll('[data-topic]').forEach(function(button){button.addEventListener('click',function(){ask(topicQuestion(button.dataset.topic))})});
  root.querySelector('form').addEventListener('submit',function(event){event.preventDefault();ask(root.querySelector('input').value.trim())});
})();
