# Projet Son – Synthétiseur Teensy piloté par interface Web

Projet de synthèse sonore temps réel combinant :
- un **synthétiseur embarqué** sur Teensy (généré avec **FAUST**),
- une **interface de contrôle Web** (JavaScript) avec envoi des paramètres en **Serial**,
- un pilotage **MIDI USB** pour le jeu des notes.

---

## 1) Description
### Ce que j’ai réalisé
- Développement d’une chaîne audio embarquée sur **Teensy + Audio Shield**.
- Intégration d’un moteur de synthèse **FAUST** (10 presets/instruments).
- Création d’une interface Web de contrôle (ADSR, filtres, vibrato, panoramique, volume).
- Communication **Web Serial → Teensy** en temps réel pour l'échange des paramètres.
- Gestion de la **polyphonie 4 voix** et du **MIDI NoteOn/NoteOff**.

### Compétences mobilisées
- C/C++ embarqué (Arduino/Teensy)
- DSP / synthèse audio (FAUST)
- JavaScript/HTML/CSS front-end (UI interactive)
- Protocoles MIDI et série
- Intégration hardware/software

---

## 2) Aperçu visuel

### Interface de contrôle Web
![Interface Web](Ressources/JS_interface.png)

### Setup global du projet
![Setup du projet](Ressources/setup.jpg)

### Carte Teensy utilisée
![Teensy](Ressources/teensy.jpg)

---

## 3) Architecture du projet

- `Arduino/synth/` : firmware principal Teensy (`synth.ino`) + code FAUST généré (`synth.cpp`, `synth.h`)
- `Controller/` : interface Web (`index.html`, `app.js`, `styles.css`) + presets (`presets.json`)
- `FAUSTconfigs/` : sources/configs FAUST (dont `new_instruments.txt`)
- `Ressources/` : images de documentation

Flux principal :
1. Le navigateur envoie les paramètres (`attack`, `decay`, `mode`, etc.) via **Serial**.
2. Le Teensy applique ces paramètres sur les 4 voix du synthé.
3. Les notes sont jouées via **MIDI USB**.
4. La sortie audio stéréo passe par l’I2S / SGTL5000.

---

## 4) Configuration à mettre en place

## 4.1 Prérequis matériel
- 1x carte **Teensy** compatible Audio (ex: Teensy 4.x)
- 1x **Teensy Audio Shield (SGTL5000)**
- Câble USB
- Sortie casque/enceintes reliée à l’Audio Shield
- Optionnel : clavier ou séquenceur **MIDI USB**

## 4.2 Prérequis logiciel
- **Arduino IDE**
- **Teensyduino** installé
- Navigateur Chromium compatible **Web Serial** (Chrome / Edge)
- Python 3 (ou n’importe quel serveur HTTP local) pour servir `Controller/`

## 4.3 Flash du firmware Teensy
1. Ouvrir `Arduino/synth/synth.ino` dans Arduino IDE.
2. Sélectionner la carte Teensy correspondante.
3. Vérifier que les librairies Teensy Audio sont disponibles.
4. Compiler et téléverser sur la carte.
5. Ouvrir le moniteur série (optionnel) pour vérifier le message `Teensy Ready`.

## 4.4 Lancement de l’interface Web
Depuis le dossier `Controller/`, lancer un serveur local :

```bash
cd Controller
python3 -m http.server 8000
```

Puis ouvrir dans le navigateur :
- `http://localhost:8000`

## 4.5 Connexion et utilisation
1. Cliquer sur **Connect** dans l’interface.
2. Choisir le port série de la Teensy.
3. Les presets sont chargés automatiquement.
4. Jouer des notes en MIDI et ajuster les paramètres en direct.

---

## 5) Paramètres contrôlables

- **Mode / Preset** (0 à 9)
- **ADSR** : Attack, Decay, Sustain, Release
- **Modulation** : Vibrato Rate, Vibrato Depth
- **Filtres** : Low Cut, High Cut
- **Spatialisation** : Pan
- **Niveau** : Volume
- **FX** : Wet/Dry (selon implémentation active)

---

## 6) Points techniques notables

- Polyphonie 4 voix avec allocation simple et remplacement de voix si saturation.
- Communication série texte `param=value` robuste et lisible.
- Synthé généré par FAUST puis intégré dans une architecture Teensy Audio.
- Interface UI dynamique avec gestion de presets JSON et synchronisation des contrôles.

---

## 7) Améliorations possibles

- Ajouter une sauvegarde de presets utilisateur.
- Intégrer reverb complète côté DSP.
- Ajouter retour d’état Teensy → interface (bidirectionnel).
- Étendre la gestion MIDI (CC, pitch bend, aftertouch).

---

## Auteur

Projet réalisé dans le cadre d’un projet pédagogique (TC) – groupe 66.
