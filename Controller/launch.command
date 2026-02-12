#!/bin/zsh
set -euo pipefail

# ---- Config (ajuste si besoin) ----
PORT=5173
WIDTH=1645
HEIGHT=900
URL="http://localhost:${PORT}/"

cd "${0:A:h}"

# Démarre un serveur local si rien n'écoute déjà sur le port
if ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  nohup python3 -m http.server "$PORT" --bind 127.0.0.1 >"./.httpserver.log" 2>&1 &
  disown
  # petite attente pour laisser le temps au serveur de monter
  sleep 0.2
fi

# Ouvre Chrome en mode "app" avec une taille de fenêtre initiale
# Note: le navigateur peut toujours laisser l'utilisateur redimensionner.
open -na "Google Chrome" --args \
  "--app=${URL}" \
  "--window-size=${WIDTH},${HEIGHT}" \
  "--force-device-scale-factor=1" \
  "--disable-pinch"
