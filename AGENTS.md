# Site reparation-iphone-macon.fr — consignes de travail

## But
Site vitrine de Solution Phone (21 rue Gambetta, Mâcon) pour la réparation d’iPhone :
calculateur de prix sur l’accueil, une page par modèle d’iPhone, une page par type de réparation.
Tout est rédigé en français, en vouvoiement. Le dirigeant n’est pas technicien : lui parler simplement.

## Fichiers
- `index.html` : accueil (calculateur `#devis`, tableaux de prix, FAQ, contact). Styles : `premium-v2.css`, `offre-25.css`, `confiance.css`, `accueil.css` (chargé en dernier).
- `iphone-*.html`, `ecran.html`, `batterie.html`, `connecteur-charge.html`, `face-id.html`, `vitre-arriere.html`, `desoxydation.html`, `qualirepar.html` : **pages GÉNÉRÉES**, ne pas les modifier à la main.
- `scripts/generer-pages-modeles.py` : générateur (gabarit unique + `modele.css`).
- `scripts/modeles.json` : données par modèle (slug, nom, valeur exacte du menu du calculateur, ligne de la base de prix, textes). `scripts/pages.json` : pages réparations.
- `scripts/prix-cache.json` : dernier relevé des prix (utilisé si la base ne répond pas).
- `menu-commun.js` + bloc `#mc-footer` : menu commun aux 3 sites, géré par un autre chantier (ne pas le modifier ici ; toute modification doit être copiée à l’identique sur les 3 sites).
- `404.html`, `robots.txt`, `llms.txt`, `sitemap.xml` (régénéré par le script), `_config.yml` (exclut ce fichier, CLAUDE.md, README.md et `scripts/` de la publication).

## Régénérer les pages modèles
    python3 scripts/generer-pages-modeles.py           # relève les prix en direct puis génère
    python3 scripts/generer-pages-modeles.py --cache   # sans réseau : dernier relevé
Les prix viennent de la fonction `public-catalog` (déjà nets des 25 €) : ils sont écrits en dur
dans le HTML (« Prix au JJ/MM/AAAA ») puis rafraîchis en JavaScript au chargement.
Relancer le script après chaque changement de tarif dans la base, puis vérifier et publier.
Pour un nouveau modèle : ajouter un bloc dans `scripts/modeles.json` (et l’option dans le menu du calculateur de `index.html` si besoin).

## Faits métier
La source unique est le document de règles communes du dirigeant (adresse, horaires, téléphones,
garanties, délais, formulation QualiRépar, note Google, interdits). En résumé :
- toujours afficher le PRIX FINAL (jamais « X € − 25 € ») ;
- QualiRépar : « Réparateur labellisé QualiRépar. 25 € déjà déduits de nos tarifs de réparation de smartphone : grâce au Bonus Réparation QualiRépar quand la réparation est éligible, offerts par Solution Phone sinon. » Le Bonus est financé par les éco-organismes agréés (jamais « l’État ») ;
- délai : « généralement en moins d’une heure si la pièce est en stock » ; garantie réparation 6 mois ;
- note Google : « 4,7/5 · plus de 700 avis » ; pas de note en JSON-LD ;
- WhatsApp : message prérempli « Bonjour Solution Phone, … », jamais « urgent » ;
- ne publier aucune caractéristique technique d’iPhone non vérifiée.

## Vérifier avant publication
- `python3 -m http.server 4175` (seul port où la base de prix répond en local), tester sur mobile (375 px) et ordinateur : 0 erreur console, pas de défilement horizontal.
- JSON-LD valide, liens internes valides, `sh scripts/check-forbidden-visuals.sh`.

## Publication
Publier = pousser sur la branche `main` (GitHub Pages). Uniquement avec l’accord explicite du dirigeant.

## Pièges connus
- `menu-commun.js` masque certains anciens en-têtes (`header.wrap`, `nav.nav`, `body > nav` sans classe…) : ne pas utiliser ces sélecteurs pour du contenu.
- La base regroupe des modèles (« 12/12 PRO », « X/XS/XS MAX », « 7/7+/8/8+ »). « SE » dans « 5S/SE/5C/6… » est l’iPhone SE de 2016, pas les SE 2020/2022.
- Colonnes écran de la base : [Compatible HD, Compatible LTPS, LTPS Prime, Soft OLED, ReLife] ; « Compatible » = le moins cher des deux premières. Batteries : [Compatible, reconnue par l’iPhone, Originale].
- GitHub Pages ne fait pas de redirection 301 : une page supprimée est remplacée par une redirection meta refresh + canonical.

## Règle visuelle
- Ne jamais utiliser de photo de microscope, d’outils alignés, de tapis ou de plan de travail dans une page publique.
- Préférer les photos humaines de la boutique, les appareils, les composants propres ou un bloc typographique sans photo.
- Avant de terminer une modification visuelle, exécuter `sh scripts/check-forbidden-visuals.sh`.
