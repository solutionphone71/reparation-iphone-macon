#!/usr/bin/env python3
"""Génère les pages modèles iPhone (iphone-*.html) et les pages réparations
(ecran.html, batterie.html, …, qualirepar.html) à partir d'un gabarit unique.

Données :
  scripts/modeles.json  : un bloc par modèle (slug, nom, valeur du calculateur de
                          l'accueil, ligne de la base public-catalog, textes).
  scripts/pages.json    : les pages réparations (écran, batterie, …).
Prix :
  récupérés au moment de la génération sur la fonction public-catalog
  (déjà nets des 25 €), écrits en dur dans le HTML, puis rafraîchis en JS
  au chargement de la page. Sans réseau : scripts/prix-cache.json (dernier relevé).

Utilisation (depuis la racine du dépôt) :
  python3 scripts/generer-pages-modeles.py            # relève les prix puis génère
  python3 scripts/generer-pages-modeles.py --cache    # génère avec le dernier relevé
"""
import datetime
import html
import json
import os
import re
import subprocess
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(RACINE, 'scripts')
SITE = 'https://reparation-iphone-macon.fr'
URL_PRIX = 'https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/public-catalog?resource=prices'
WA = 'https://wa.me/33783921884'
TEL = 'tel:+33385330689'
TEL_TXT = '03 85 33 06 89'
NB = ' '
BUSINESS_ID = 'https://solution-phone.fr/#business'
QUALIREPAR = ('Réparateur labellisé QualiRépar. 25 € déjà déduits de nos tarifs de réparation de smartphone : '
              'grâce au Bonus Réparation QualiRépar quand la réparation est éligible, offerts par Solution Phone sinon.')

QUAL_ECRAN = [
    ('compatible', 'Compatible', 'Le choix économique pour un usage courant.'),
    ('ltps', 'LTPS Prime', 'Un écran LCD haut de gamme, lumineux et réactif.'),
    ('softoled', 'Soft OLED', 'Un écran OLED souple : noirs profonds, rendu proche de l’origine.'),
    ('relife', 'ReLife', 'Un écran Apple d’origine reconditionné.'),
]
QUAL_BATTERIE = [
    ('compatible', 'Compatible', 'La solution économique.'),
    ('reconnue', 'Compatible reconnue par l’iPhone', 'Une batterie compatible conçue pour être reconnue par l’iPhone.'),
    ('originale', 'Originale Apple', 'Une batterie d’origine Apple, selon disponibilité.'),
]


# ---------------------------------------------------------------- outils texte
def e(s):
    """Échappe pour un attribut ou un texte HTML."""
    return html.escape(str(s), quote=True)


def typo(s):
    """Typographie française sur un texte (qui peut contenir des balises simples)."""
    s = s.replace("'", '’')
    s = re.sub(r' ([:;!?»€%])', NB + r'\1', s)
    s = s.replace('« ', '«' + NB)
    s = re.sub(r'(\d) (€|%|Hz|mm|W|h\b|ans\b|mois\b|pouces\b|mégapixels\b|Mpx\b|jours\b|km\b)', r'\1' + NB + r'\2', s)
    s = s.replace(' – ', NB + '– ')
    return s


def t(s):
    """Texte simple : typographié puis échappé."""
    return e(typo(str(s)))


def p_html(s):
    """Paragraphe issu des données : on autorise <strong>, <em> et <a href="…">."""
    return typo(s)


def norm(s):
    return re.sub(r'\s+', ' ', str(s or '').lower().replace('iphone', '')).strip()


# ---------------------------------------------------------------- prix
def relever_prix(utiliser_cache):
    cache = os.path.join(SCRIPTS, 'prix-cache.json')
    if not utiliser_cache:
        try:
            brut = subprocess.run(['curl', '-sf', '--max-time', '20', '-H', 'Origin: ' + SITE, URL_PRIX],
                                  capture_output=True, check=True).stdout
            donnees = json.loads(brut)
            prix = donnees['prices']
            releve = {'date': datetime.date.today().isoformat(),
                      'screens': prix.get('screens') or [], 'batteries': prix.get('batteries') or []}
            if not releve['screens'] and not releve['batteries']:
                raise ValueError('catalogue vide')
            with open(cache, 'w', encoding='utf-8') as f:
                json.dump(releve, f, ensure_ascii=False, indent=1)
            print('Prix relevés en direct (%d lignes écran, %d lignes batterie).' % (len(releve['screens']), len(releve['batteries'])))
            return releve
        except Exception as err:  # réseau absent, fonction indisponible…
            print('ATTENTION : relevé des prix impossible (%s), utilisation du dernier relevé.' % err)
    with open(cache, encoding='utf-8') as f:
        releve = json.load(f)
    print('Prix du relevé du %s.' % releve['date'])
    return releve


def ligne(lignes, nom):
    if not nom:
        return None
    for r in lignes:
        if norm(r.get('modele')) == norm(nom):
            return r
    return None


def num(v):
    try:
        v = float(v)
        return int(v) if v > 0 else 0
    except (TypeError, ValueError):
        return 0


def options_ecran(r, lcd):
    if not r:
        return []
    p = [num(x) for x in (r.get('prix') or [])] + [0] * 5
    compat = sorted([x for x in (p[0], p[1]) if x])
    vals = {'compatible': compat[0] if compat else 0, 'ltps': p[2], 'softoled': 0 if lcd else p[3], 'relife': p[4]}
    return [(k, lab, expl, vals[k]) for k, lab, expl in QUAL_ECRAN if vals[k]]


def options_batterie(r):
    if not r:
        return []
    p = [num(x) for x in (r.get('prix') or [])] + [0] * 3
    vals = {'compatible': p[0], 'reconnue': p[1], 'originale': p[2]}
    return [(k, lab, expl, vals[k]) for k, lab, expl in QUAL_BATTERIE if vals[k]]


# ---------------------------------------------------------------- morceaux communs
def wa_lien(texte):
    from urllib.parse import quote
    return WA + '?text=' + quote(texte, safe='')


def devis_lien(m, panne='ecran', email=False):
    from urllib.parse import quote
    q = 'modele=' + quote(m['select'], safe='') if m and m.get('select') else ''
    q += ('&' if q else '') + 'panne=' + panne
    if email:
        q += '&email=1'
    return 'index.html?' + q + '#devis'


def tete(titre, description, chemin, jsonld, og_image='iphone-generations-lineup.jpg'):
    url = SITE + '/' + chemin
    blocs = '\n'.join('<script type="application/ld+json">%s</script>' % json.dumps(j, ensure_ascii=False, separators=(',', ':')) for j in jsonld)
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(titre)}</title>
<meta name="description" content="{e(description)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{url}">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" href="favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Solution Phone">
<meta property="og:title" content="{e(titre)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/{og_image}">
<meta name="theme-color" content="#1d1d1f">
{blocs}
<link rel="stylesheet" href="modele.css?v=3">
<script src="/menu-commun.js?v=4" data-site="iphone"></script>
</head>
<body>
<nav aria-label="Navigation (secours)">
  <a class="n-brand" href="{SITE}/">Solution Phone · Réparation iPhone</a>
  <a href="{SITE}/ecran.html">Écran</a>
  <a href="{SITE}/batterie.html">Batterie</a>
  <a href="{SITE}/qualirepar.html">QualiRépar</a>
  <a href="{SITE}/#tarifs">Tarifs</a>
  <a href="{TEL}">{TEL_TXT}</a>
</nav>
'''


def fil(elements):
    li = []
    for nom, lien in elements:
        li.append(f'<li><a href="{lien}">{t(nom)}</a></li>' if lien else f'<li aria-current="page">{t(nom)}</li>')
    return '<nav class="crumb wrap" aria-label="Fil d’Ariane"><ol>' + ''.join(li) + '</ol></nav>\n'


def jsonld_fil(elements):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': nom, 'item': url} for i, (nom, url) in enumerate(elements)]}


def preuves():
    return ('<ul class="proof">'
            '<li><a href="https://g.page/r/CbyQ_wiFpddjEBM" target="_blank" rel="noopener">'
            + typo('Note Google 4,7/5 · plus de 700 avis') + '</a></li>'
            '<li>' + typo('Généralement en moins d’une heure si la pièce est en stock') + '</li>'
            '<li>' + typo('Réparations garanties 6 mois') + '</li>'
            '<li>' + typo('25 € déjà déduits') + '</li></ul>')


def bloc_qualirepar():
    return ('<section class="block" aria-labelledby="h-qr"><div class="quali">'
            '<img src="qualirepar-label-officiel.jpg" alt="Label QualiRépar" width="72" height="72" loading="lazy">'
            '<div><h2 id="h-qr">' + typo('QualiRépar : 25 € déjà déduits') + '</h2>'
            '<p>' + typo(QUALIREPAR) + ' <a href="qualirepar.html">' + typo('En savoir plus sur QualiRépar') + '</a>.</p>'
            '</div></div></section>\n')


def bloc_deroule():
    return ('<section class="block" aria-labelledby="h-deroule"><h2 id="h-deroule">Comment se passe la réparation ?</h2>'
            '<ol class="steps">'
            '<li>' + typo('Vous passez au <strong>21 rue Gambetta à Mâcon</strong>, sans rendez-vous, ou vous envoyez votre demande sur WhatsApp ou par e-mail.') + '</li>'
            '<li>' + typo('L’équipe vérifie la panne et la pièce disponible, puis vous annonce le prix final. Rien ne commence sans votre accord.') + '</li>'
            '<li>' + typo('La réparation est généralement faite en moins d’une heure si la pièce est en stock. Affichage, tactile, charge et capteurs sont contrôlés avant de vous rendre l’iPhone.') + '</li>'
            '<li>' + typo('La réparation est garantie 6 mois. Paiement par carte, espèces (1 000 € maximum), Apple Pay ou virement.') + '</li>'
            '</ol></section>\n')


def pied():
    return ('<footer class="foot"><div class="wrap">'
            '<p><strong>Solution Phone</strong> · 21 rue Gambetta, 71000 Mâcon · <a href="' + TEL + '">' + TEL_TXT + '</a> · '
            '<a href="mailto:contact@solution-phone.fr">contact@solution-phone.fr</a></p>'
            '<p>' + typo('Lundi 9h15–12h15 et 14h–19h · du mardi au samedi 9h15–19h · fermé le dimanche') + '</p>'
            '<p class="legal">© 2014–2026 Solution Phone · '
            '<a href="https://solution-phone.fr/cgv.html">Mentions légales &amp; CGV</a>'
            '<a href="https://solution-phone.fr/politique-confidentialite.html">Confidentialité</a></p>'
            '</div></footer>\n')


def dock(message_wa, lien_email):
    return ('<div class="dock" role="region" aria-label="Contacter Solution Phone">'
            f'<a class="dock-wa" href="{e(wa_lien(message_wa))}" target="_blank" rel="noopener" aria-label="Demander un devis sur WhatsApp">WhatsApp</a>'
            f'<a href="{TEL}" aria-label="Appeler Solution Phone au {TEL_TXT}">Appeler</a>'
            f'<a href="{e(lien_email)}" aria-label="Demander un devis par e-mail">E-mail</a>'
            '</div>\n')


SCRIPT_PRIX = r'''<script>
/* Rafraîchit les prix écrits dans la page avec la base de l'atelier (prix finaux, 25 € déjà déduits). */
(function(){
  var box=document.getElementById('prix');if(!box||!window.fetch)return;
  var lcd=box.getAttribute('data-lcd')==='1';
  var QE=[['Compatible','Le choix économique pour un usage courant.'],['LTPS Prime','Un écran LCD haut de gamme, lumineux et réactif.'],['Soft OLED','Un écran OLED souple : noirs profonds, rendu proche de l’origine.'],['ReLife','Un écran Apple d’origine reconditionné.']];
  var QB=[['Compatible','La solution économique.'],['Compatible reconnue par l’iPhone','Une batterie compatible conçue pour être reconnue par l’iPhone.'],['Originale Apple','Une batterie d’origine Apple, selon disponibilité.']];
  function n(v){v=Number(v);return v>0?v:0}
  function norm(s){return String(s||'').toLowerCase().replace('iphone','').replace(/\s+/g,' ').trim()}
  function opts(type,p){p=(p||[]).map(n);
    if(type==='ecran'){var c=[p[0],p[1]].filter(Boolean).sort(function(a,b){return a-b})[0]||0;var v=[c,p[2]||0,lcd?0:(p[3]||0),p[4]||0];return QE.map(function(q,i){return [q[0],q[1],v[i]]}).filter(function(o){return o[2]>0})}
    return QB.map(function(q,i){return [q[0],q[1],p[i]||0]}).filter(function(o){return o[2]>0})}
  fetch('https://kdvxcnjfrmvlnrymfyug.supabase.co/functions/v1/public-catalog?resource=prices').then(function(r){return r.ok?r.json():null}).then(function(d){
    if(!d||!d.prices)return;var ok=false;
    box.querySelectorAll('table[data-ligne]').forEach(function(tab){
      var type=tab.getAttribute('data-type'),rows=(type==='ecran'?d.prices.screens:d.prices.batteries)||[],want=norm(tab.getAttribute('data-ligne'));
      var row=rows.filter(function(r){return norm(r.modele)===want})[0];if(!row)return;
      var o=opts(type,row.prix);if(!o.length)return;
      tab.querySelector('tbody').innerHTML=o.map(function(x){return '<tr><th scope="row"><b>'+x[0]+'</b><span>'+x[1]+'</span></th><td>'+x[2]+' €</td></tr>'}).join('');ok=true;
    });
    if(ok){var el=document.getElementById('prix-date');if(el)el.textContent='Prix vérifiés en direct le '+new Date().toLocaleDateString('fr-FR');}
  }).catch(function(){});
})();
</script>
'''


def table_prix(titre, type_, nom_ligne, options):
    lignes = ''.join(f'<tr><th scope="row"><b>{t(lab)}</b><span>{t(expl)}</span></th><td>{v}{NB}€</td></tr>' for k, lab, expl, v in options)
    return (f'<div><table class="prix" data-type="{type_}" data-ligne="{e(nom_ligne)}">'
            f'<caption>{t(titre)}</caption><thead><tr><th scope="col">Qualité</th><th scope="col">Prix</th></tr></thead>'
            f'<tbody>{lignes}</tbody></table></div>')


# ---------------------------------------------------------------- page modèle
def page_modele(m, releve, tous, date_fr):
    nom = m['nom']
    chemin = m['slug'] + '.html'
    url = SITE + '/' + chemin
    lcd = bool(m.get('lcd'))
    r_ecran = ligne(releve['screens'], m.get('ligne_ecran'))
    r_batt = ligne(releve['batteries'], m.get('ligne_batterie'))
    o_ecran = options_ecran(r_ecran, lcd)
    o_batt = options_batterie(r_batt)
    titre = 'Réparation %s à Mâcon | Solution Phone' % m.get('nom_titre', nom)
    assert len(titre) <= 60, titre
    meta = typo(m.get('meta') or ('Réparation %s à Mâcon : écran, batterie, charge et appareil photo. '
                                  'Prix finaux, 25 € déjà déduits, garantie 6 mois, sans rendez-vous.' % nom))
    assert len(meta) <= 160, (m['slug'], len(meta))
    eyebrow = m.get('eyebrow') or '%s · %s' % (nom, m['annee'])

    # JSON-LD
    offres = []
    for k, lab, expl, v in o_ecran:
        offres.append({'@type': 'Offer', 'name': 'Remplacement écran %s – qualité %s' % (nom, lab), 'price': str(v), 'priceCurrency': 'EUR', 'url': url + '#prix'})
    for k, lab, expl, v in o_batt:
        offres.append({'@type': 'Offer', 'name': 'Remplacement batterie %s – qualité %s' % (nom, lab), 'price': str(v), 'priceCurrency': 'EUR', 'url': url + '#prix'})
    service = {'@context': 'https://schema.org', '@type': 'Service', 'name': 'Réparation %s à Mâcon' % nom,
               'serviceType': 'Réparation de smartphone', 'url': url,
               'provider': {'@type': 'LocalBusiness', '@id': BUSINESS_ID, 'name': 'Solution Phone'},
               'areaServed': {'@type': 'City', 'name': 'Mâcon'},
               'description': meta}
    if offres:
        service['offers'] = offres
    fil_el = [('Réparation iPhone Mâcon', SITE + '/'), (nom, url)]

    h = tete(titre, meta, chemin, [service, jsonld_fil(fil_el)])
    h += fil([('Réparation iPhone', SITE + '/'), (nom, None)])
    msg = 'Bonjour Solution Phone, devis %s : ma panne est… ' % nom
    h += '<main>\n<div class="hero"><div class="wrap">'
    h += f'<p class="eyebrow">{t(eyebrow)}</p>'
    h += f'<h1>{t("Réparation " + nom + " à Mâcon")}</h1>'
    h += f'<p class="intro">{p_html(m["intro"])}</p>'
    h += ('<div class="btns">'
          f'<a class="btn btn-main" href="{e(devis_lien(m))}">Voir mon prix / devis</a>'
          f'<a class="btn btn-wa" href="{e(wa_lien(msg))}" target="_blank" rel="noopener">WhatsApp</a>'
          f'<a class="btn" href="{TEL}">Appeler le {TEL_TXT}</a></div>')
    h += preuves() + '</div></div>\n<div class="wrap">\n'

    # Prix
    h += f'<section class="block" id="prix" data-lcd="{1 if lcd else 0}" aria-labelledby="h-prix">'
    h += f'<div class="prix-head"><h2 id="h-prix">{t("Prix de réparation " + nom)}</h2><span class="prix-date" id="prix-date">{t("Prix au " + date_fr)}</span></div>'
    h += '<p class="prix-note">' + typo('Prix finaux, pièce et main-d’œuvre comprises, <strong>25 € déjà déduits</strong>. La disponibilité de la pièce est confirmée avant l’intervention.') + '</p>'
    tabs = []
    if o_ecran:
        tabs.append(table_prix('Écran ' + nom, 'ecran', r_ecran['modele'], o_ecran))
    if o_batt:
        tabs.append(table_prix('Batterie ' + nom, 'batterie', r_batt['modele'], o_batt))
    if tabs:
        h += '<div class="tables">' + ''.join(tabs) + '</div>'
    manque = []
    if not o_ecran:
        manque.append('l’écran')
    if not o_batt:
        manque.append('la batterie')
    if manque:
        quoi = ' et '.join(manque)
        h += ('<p class="confirm" style="margin-top:16px"><b>' + typo('Prix confirmé par l’équipe') + '</b> ' +
              typo('pour %s de votre %s : nous vérifions la pièce disponible et vous répondons avec le prix final, 25 € déjà déduits.' % (quoi, e(nom))) + '</p>')
    if m.get('note_prix'):
        h += '<p class="prix-note" style="margin-top:12px">' + p_html(m['note_prix']) + '</p>'
    h += f'<div class="btns prix-cta"><a class="btn btn-main" href="{e(devis_lien(m))}">Voir mon prix / devis</a><a class="btn" href="{e(devis_lien(m, "batterie"))}">Devis batterie</a></div>'
    h += '</section>\n'

    # Textes propres au modèle
    h += f'<section class="block" aria-labelledby="h-pres"><h2 id="h-pres">{t("Le " + nom + " en bref")}</h2><p>{p_html(m["presentation"])}</p></section>\n'
    h += f'<section class="block" aria-labelledby="h-ecran"><h2 id="h-ecran">{t("Écran " + nom + " cassé")}</h2><p>{p_html(m["ecran"])}</p><p><a href="ecran.html">Tout savoir sur la réparation d’écran d’iPhone</a></p></section>\n'
    h += f'<section class="block" aria-labelledby="h-batt"><h2 id="h-batt">{t("Batterie " + nom)}</h2><p>{p_html(m["batterie"])}</p><p><a href="batterie.html">Tout savoir sur le remplacement de batterie</a></p></section>\n'
    h += f'<section class="block" aria-labelledby="h-autres"><h2 id="h-autres">{t("Les autres réparations du " + nom)}</h2><p>{p_html(m["autres"])}</p>'
    liens_pannes = [('connecteur-charge.html', 'Connecteur de charge'), ('vitre-arriere.html', 'Vitre arrière'), ('desoxydation.html', 'Désoxydation')]
    if m.get('biometrie', 'Face ID') == 'Face ID':
        liens_pannes.insert(1, ('face-id.html', 'Face ID'))
    h += '<ul class="links">' + ''.join(f'<li><a href="{u}">{t(lab)}</a></li>' for u, lab in liens_pannes) + '</ul></section>\n'

    # Qualités expliquées
    h += '<section class="block" aria-labelledby="h-qual"><h2 id="h-qual">Les qualités de pièce, expliquées simplement</h2><h3>Écran</h3><ul>'
    for k, lab, expl in QUAL_ECRAN:
        if lcd and k == 'softoled':
            continue
        h += f'<li><strong>{t(lab)}</strong> : {t(expl)}</li>'
    h += '</ul>'
    if lcd:
        h += '<p>' + typo('Votre %s est équipé d’origine d’un écran LCD : la qualité Soft OLED ne le concerne pas.' % e(nom)) + '</p>'
    else:
        h += '<p>' + typo('Les qualités proposées dépendent des pièces disponibles pour votre modèle : l’équipe vous montre la différence avant que vous choisissiez.') + '</p>'
    h += '<h3>Batterie</h3><ul>'
    for k, lab, expl in QUAL_BATTERIE:
        h += f'<li><strong>{t(lab)}</strong> : {t(expl)}</li>'
    h += '</ul><p>' + typo('Pour la batterie compatible reconnue par l’iPhone, l’équipe vous précise avant l’intervention ce qui s’affichera dans Réglages › Batterie.') + '</p></section>\n'

    h += bloc_deroule()
    h += bloc_qualirepar()

    # Modèles proches
    par_slug = {x['slug']: x for x in tous}
    proches = [par_slug[s] for s in m.get('proches', []) if s in par_slug]
    if proches:
        h += '<section class="block" aria-labelledby="h-proches"><h2 id="h-proches">Modèles proches</h2><ul class="links">'
        h += ''.join(f'<li><a href="{p["slug"]}.html">{t("Réparation " + p["nom"])}</a></li>' for p in proches)
        h += '</ul><p style="margin-top:12px"><a href="index.html#modeles">Voir tous les modèles d’iPhone</a></p></section>\n'
    h += '</div>\n</main>\n'
    h += pied()
    h += dock(msg, devis_lien(m, 'ecran', email=True))
    h += SCRIPT_PRIX
    h += '<script src="evan-cross-widget.js?v=7" defer></script>\n'
    h += MC_FOOTER + '\n</body>\n</html>\n'
    return h


# ---------------------------------------------------------------- page réparation
def page_reparation(pg, modeles):
    chemin = pg['slug'] + '.html'
    url = SITE + '/' + chemin
    titre = pg['titre']
    assert len(titre) <= 60, titre
    assert len(pg['meta']) <= 160, (pg['slug'], len(pg['meta']))
    fil_el = [('Réparation iPhone Mâcon', SITE + '/'), (pg['fil'], url)]
    service = {'@context': 'https://schema.org', '@type': 'Service', 'name': pg['h1'], 'serviceType': 'Réparation de smartphone',
               'url': url, 'provider': {'@type': 'LocalBusiness', '@id': BUSINESS_ID, 'name': 'Solution Phone'},
               'areaServed': {'@type': 'City', 'name': 'Mâcon'}, 'description': typo(pg['meta'])}
    h = tete(titre, typo(pg['meta']), chemin, [service, jsonld_fil(fil_el)])
    h += fil([('Réparation iPhone', SITE + '/'), (pg['fil'], None)])
    msg = 'Bonjour Solution Phone, %s : mon modèle est… ' % pg['wa']
    panne = pg.get('panne', 'autre')
    lien_devis = 'index.html?panne=' + panne + '#devis'
    h += '<main>\n<div class="hero"><div class="wrap">'
    h += f'<p class="eyebrow">{t(pg["eyebrow"])}</p><h1>{t(pg["h1"])}</h1><p class="intro">{p_html(pg["intro"])}</p>'
    h += ('<div class="btns">'
          f'<a class="btn btn-main" href="{lien_devis}">Voir mon prix / devis</a>'
          f'<a class="btn btn-wa" href="{e(wa_lien(msg))}" target="_blank" rel="noopener">WhatsApp</a>'
          f'<a class="btn" href="{TEL}">Appeler le {TEL_TXT}</a></div>')
    h += preuves() + '</div></div>\n<div class="wrap">\n'
    for i, sec in enumerate(pg['sections']):
        h += f'<section class="block" aria-labelledby="h-s{i}"><h2 id="h-s{i}">{t(sec["h2"])}</h2>'
        for bloc in sec['contenu']:
            if isinstance(bloc, list):
                h += '<ul>' + ''.join('<li>' + p_html(x) + '</li>' for x in bloc) + '</ul>'
            else:
                h += '<p>' + p_html(bloc) + '</p>'
        h += '</section>\n'
    if not pg.get('sans_deroule'):
        h += bloc_deroule()
    if pg['slug'] != 'qualirepar':
        h += bloc_qualirepar()
    # Grille de tous les modèles
    filtre = pg.get('filtre')
    h += f'<section class="block" aria-labelledby="h-modeles"><h2 id="h-modeles">{t(pg["grille_titre"])}</h2><ul class="links">'
    for m in modeles:
        if filtre == 'face-id' and m.get('biometrie', 'Face ID') != 'Face ID':
            continue
        h += f'<li><a href="{m["slug"]}.html">{t(pg["prefixe"] + " " + m["nom"])}</a></li>'
    h += '</ul></section>\n'
    autres = [('ecran', 'Écran'), ('batterie', 'Batterie'), ('connecteur-charge', 'Connecteur de charge'), ('face-id', 'Face ID'),
              ('vitre-arriere', 'Vitre arrière'), ('desoxydation', 'Désoxydation'), ('qualirepar', 'QualiRépar')]
    h += '<section class="block" aria-labelledby="h-autres"><h2 id="h-autres">Nos autres réparations d’iPhone</h2><ul class="links">'
    h += ''.join(f'<li><a href="{s}.html">{t(lab)}</a></li>' for s, lab in autres if s != pg['slug'])
    h += '</ul></section>\n</div>\n</main>\n'
    h += pied()
    h += dock(msg, 'index.html?panne=' + panne + '&email=1#devis')
    h += '<script src="evan-cross-widget.js?v=7" defer></script>\n'
    h += MC_FOOTER + '\n</body>\n</html>\n'
    return h


# ---------------------------------------------------------------- sitemap
def sitemap(chemins, date_iso):
    urls = ['']
    urls += chemins
    lignes = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for c in urls:
        prio = '1.0' if c == '' else ('0.8' if not c.startswith('iphone-') else '0.7')
        lignes.append(f'  <url><loc>{SITE}/{c}</loc><lastmod>{date_iso}</lastmod><priority>{prio}</priority></url>')
    lignes.append('</urlset>')
    return '\n'.join(lignes) + '\n'


def lire_mc_footer():
    """Bloc de liens du menu commun, repris tel quel depuis index.html (ne pas le modifier ici)."""
    with open(os.path.join(RACINE, 'index.html'), encoding='utf-8') as f:
        s = f.read()
    m = re.search(r'<!-- menu-commun : liens du pied de page \(HTML statique\) -->\s*<div id="mc-footer".*?</ul></div></div>', s, re.S)
    if not m:
        sys.exit('Bloc mc-footer introuvable dans index.html')
    return m.group(0)


MC_FOOTER = ''


def main():
    global MC_FOOTER
    MC_FOOTER = lire_mc_footer()
    releve = relever_prix('--cache' in sys.argv)
    d = datetime.date.fromisoformat(releve['date'])
    date_fr = d.strftime('%d/%m/%Y')
    with open(os.path.join(SCRIPTS, 'modeles.json'), encoding='utf-8') as f:
        modeles = json.load(f)['modeles']
    with open(os.path.join(SCRIPTS, 'pages.json'), encoding='utf-8') as f:
        pages = json.load(f)['pages']
    ecrits = []
    for m in modeles:
        with open(os.path.join(RACINE, m['slug'] + '.html'), 'w', encoding='utf-8') as f:
            f.write(page_modele(m, releve, modeles, date_fr))
        ecrits.append(m['slug'] + '.html')
    for pg in pages:
        with open(os.path.join(RACINE, pg['slug'] + '.html'), 'w', encoding='utf-8') as f:
            f.write(page_reparation(pg, modeles))
        ecrits.append(pg['slug'] + '.html')
    ordre = [pg['slug'] + '.html' for pg in pages] + [m['slug'] + '.html' for m in modeles]
    with open(os.path.join(RACINE, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write(sitemap(ordre, datetime.date.today().isoformat()))
    print('%d pages écrites + sitemap.xml' % len(ecrits))


if __name__ == '__main__':
    main()
