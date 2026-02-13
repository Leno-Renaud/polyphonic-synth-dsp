import("stdfaust.lib");

// =======================
// PARAMÈTRES
// =======================

freq   = hslider("freq", 440, 27.5, 4186, 0.01);
gain   = hslider("volume", 0.5, 0, 1, 0.001);
strike = button("strike");
mode   = hslider("mode", 0, 0, 9, 1);

// =======================
// OPTIONS SYNTHÉ
// =======================

// ADSR
attack  = hslider("ADSR/Attack", 0.005, 0.001, 2, 0.001);
decay   = hslider("ADSR/Decay", 0.08, 0.001, 2, 0.001);
sustain = hslider("ADSR/Sustain", 0.3, 0, 1, 0.01);
release = hslider("ADSR/Release", 0.2, 0.001, 3, 0.001);

// Vibrato
vibRate  = hslider("Modulation/VibratoRate", 5, 0.1, 20, 0.1);
vibDepth = hslider("Modulation/VibratoDepth", 0.003, 0, 0.02, 0.0001);

// Filtres
lowCut  = hslider("Filter/Lowpass", 10000, 200, 12000, 1);
highCut = hslider("Filter/Highpass", 20, 20, 2000, 1);

// Reverb + WetDry
wet = hslider("FX/WetDry", 0.0, 0, 1, 0.01);
reverbAmt = hslider("FX/ReverbAmount", 0.3, 0, 0.9, 0.01);

// Pan
pan = hslider("Spatial/Pan", 0.5, 0, 1, 0.01);

// =======================
// ENVELOPPE
// =======================

env = strike : en.adsr(attack, decay, sustain, release);

// =======================
// VIBRATO
// =======================

vibrato = freq * (1 + vibDepth * os.osc(vibRate));

// =======================
// TES MODES (INCHANGÉS)
// =======================

warm =
  ( os.osc(vibrato)*0.6
  + os.osc(vibrato*2)*0.3
  + os.osc(vibrato*3)*0.15
  + os.osc(freq*0.5)*0.2
  ) * env;

bright =
  ( os.sawtooth(vibrato)*0.7
  + os.sawtooth(vibrato*2)*0.3
  ) * env;

bass =
  ( os.osc(freq*0.5)*0.7
  + os.square(vibrato)*0.4
  ) * env;

epiano =
  ( os.osc(freq)*0.6
  + os.osc(freq*2)*0.25
  + os.triangle(freq*3)*0.15
  ) * env;

organ =
  ( os.osc(freq)*0.6
  + os.osc(freq*2)*0.4
  + os.osc(freq*4)*0.2
  ) * env;

pad =
  ( os.triangle(freq)*0.6
  + os.triangle(freq*0.5)*0.4
  ) * env;

lead =
  ( os.sawtooth(vibrato)*0.8
  + os.square(vibrato*2)*0.2
  ) * env;

bell =
  ( os.osc(freq)*0.8
  + os.osc(freq*2.7)*0.35
  + os.osc(freq*5.1)*0.20
  ) * env;

strings =
  ( os.sawtooth(freq*1.01)*0.45
  + os.sawtooth(freq*0.99)*0.45
  + os.triangle(freq)*0.20
  ) * env;

brass =
  ( os.sawtooth(freq)*0.75
  + os.square(freq)*0.20
  ) * env;

// =======================
// MODE SELECT
// =======================

synth =
  (mode == 0) * warm   +
  (mode == 1) * bright +
  (mode == 2) * bass   +
  (mode == 3) * epiano +
  (mode == 4) * organ  +
  (mode == 5) * pad    +
  (mode == 6) * lead   +
  (mode == 7) * bell   +
  (mode == 8) * strings+
  (mode == 9) * brass  ;

// =======================
// CHAÎNE EFFETS STABLE
// =======================

// Filtres globaux
filtered = synth : fi.lowpass(2, lowCut) : fi.highpass(1, highCut);

// Pas de reverb pour l'instant
mix = filtered;

// Pan stéréo simple
left  = mix * gain * (1 - pan);
right = mix * gain * pan;

process = left, right;
