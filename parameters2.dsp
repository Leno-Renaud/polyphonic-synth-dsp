import("stdfaust.lib");

// =======================
// PARAMÈTRES
// =======================

freq   = hslider("freq", 440, 27.5, 4186, 0.01);
gain   = hslider("volume", 0.5, 0, 1, 0.001);
strike = button("strike");
mode   = hslider("mode", 0, 0, 9, 1);

// =======================
// OPTIONS GLOBALES (par défaut = ancien son)
// =======================

// Vibrato global
vibRate  = hslider("Modulation/VibratoRate", 5, 0.1, 20, 0.1);
vibDepth = hslider("Modulation/VibratoDepth", 0.003, 0, 0.02, 0.0001);

// Filtres globaux (ne changent rien par défaut)
lowCut  = hslider("Filter/Lowpass", 20000, 200, 20000, 1);
highCut = hslider("Filter/Highpass", 20, 20, 2000, 1);

// Pan
pan = hslider("Spatial/Pan", 0.5, 0, 1, 0.01);

// =======================
// VIBRATO
// =======================

vibrato = freq * (1 + vibDepth * os.osc(vibRate));

// =======================
// ENVELOPPES EXACTES ORIGINALES
// =======================

env      = strike : en.adsr(0.005, 0.08, 0.3, 0.2);
epEnv    = strike : en.adsr(0.005, 0.35, 0.15, 0.4);
padEnv   = strike : en.adsr(0.3, 1.2, 0.8, 1.8);
bellEnv  = strike : en.adsr(0.001, 1.5, 0.0, 0.2);
stringsEnv = strike : en.adsr(0.15, 0.8, 0.9, 1.2);
brassEnv   = strike : en.adsr(0.02, 0.25, 0.7, 0.25);

// =======================
// MODES ORIGINAUX (INCHANGÉS)
// =======================

warm =
  ( os.osc(vibrato)*0.6
  + os.osc(vibrato*2)*0.3
  + os.osc(vibrato*3)*0.15
  + os.osc(freq*0.5)*0.2
  )
  : fi.lowpass(2, 5000)
  : fi.highpass(1, 50)
  * env;

bright =
  ( os.sawtooth(vibrato)*0.7
  + os.sawtooth(vibrato*2)*0.3
  )
  : fi.lowpass(2, 9000)
  : fi.highpass(1, 80)
  * env;

bass =
  ( os.osc(freq*0.5)*0.7
  + os.square(vibrato)*0.4
  )
  : fi.lowpass(2, 800)
  : fi.highpass(1, 30)
  * env;

epiano =
  ( os.osc(freq)*0.6
  + os.osc(freq*2)*0.25
  + os.triangle(freq*3)*0.15
  )
  : fi.lowpass(2, 4200)
  : fi.highpass(1, 120)
  * epEnv;

organ =
  ( os.osc(freq)*0.6
  + os.osc(freq*2)*0.4
  + os.osc(freq*4)*0.2
  )
  : fi.lowpass(1, 6000)
  * env;

pad =
  ( os.triangle(freq)*0.6
  + os.triangle(freq*0.5)*0.4
  )
  : fi.lowpass(2, 2000)
  * padEnv;

lead =
  ( os.sawtooth(vibrato)*0.8
  + os.square(vibrato*2)*0.2
  )
  : fi.lowpass(2, 4500)
  : fi.highpass(1, 120)
  * env;

bell =
  ( os.osc(freq)*0.8
  + os.osc(freq*2.7)*0.35
  + os.osc(freq*5.1)*0.20
  )
  : fi.lowpass(1, 9000)
  * bellEnv;

strings =
  ( os.sawtooth(freq*1.01)*0.45
  + os.sawtooth(freq*0.99)*0.45
  + os.triangle(freq)*0.20
  )
  : fi.lowpass(2, 2500)
  : fi.highpass(1, 80)
  * stringsEnv;

brass =
  ( os.sawtooth(freq)*0.75
  + os.square(freq)*0.20
  )
  : fi.lowpass(2, 3500)
  : fi.highpass(1, 120)
  * brassEnv;

// =======================
// SÉLECTION MODE
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
// FILTRE GLOBAL (ne change rien par défaut)
// =======================

filtered = synth
  : fi.lowpass(2, lowCut)
  : fi.highpass(1, highCut);

// =======================
// PAN + GAIN
// =======================

left  = filtered * gain * (1 - pan);
right = filtered * gain * pan;

process = left, right;
