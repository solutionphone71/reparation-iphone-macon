#!/bin/sh
# Vérifie qu'aucun visuel interdit (microscope, outils, plan de travail) n'est référencé.
# Utilise grep (présent partout) ; échoue si grep est absent.
set -eu

if ! command -v grep >/dev/null 2>&1; then
  echo "ERREUR : la commande grep est introuvable, vérification impossible." >&2
  exit 2
fi

cd "$(dirname "$0")/.."
pattern='microscope[^)]*\.(jpg|jpeg|png|webp)|microscope-reparation|atelier-solution-phone-outils|plan[-_ ]?de[-_ ]?travail|workbench'

if grep -R -n -i -E --include='*.html' --include='*.css' --include='*.js' "$pattern" .; then
  echo "Visuel interdit détecté : microscope, outils ou plan de travail."
  exit 1
fi

echo "Aucun visuel interdit détecté."
