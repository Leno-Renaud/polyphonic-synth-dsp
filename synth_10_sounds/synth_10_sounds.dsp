import("stdfaust.lib");

// =======================
// PARAMÈTRES
// =======================
freq   = hslider("freq", 440, 27.5, 4186, 0.01);
gain   = hslider("volume", 0.5, 0, 1, 0.001);
strike = button("strike");

// Sélecteur de son (10 modes)
mode   = hslider(
  "mode (0:Warm 1:Bright 2:Bass 3:EPiano 4:Organ 5:Pad 6:Lead 7:Bell 8:Strings 9:Brass)",
  0, 0, 9, 1
);

// =======================
// ENVELOPPE ADSR (commune)
// =======================
env = strike : en.adsr(0.005, 0.08, 0.3, 0.2);

// =======================
// VIBRATO (commun)
// =======================
vibrato = freq * (1 + 0.003 * os.osc(5));

// =======================
// MODE 0 : WARM
// =======================
warm =
  ( os.osc(vibrato)*0.6
  + os.osc(vibrato*2)*0.3
  + os.osc(vibrato*3)*0.15
  + os.osc(freq*0.5)*0.2
  )
  : fi.lowpass(2, 5000) : fi.highpass(1, 50)
  * env;

// =======================
// MODE 1 : BRIGHT
// =======================
bright =
  ( os.sawtooth(vibrato)*0.7
  + os.sawtooth(vibrato*2)*0.3
  )
  : fi.lowpass(2, 9000) : fi.highpass(1, 80)
  * env;

// =======================
// MODE 2 : BASS
// =======================
bass =
  ( os.osc(freq*0.5)*0.7
  + os.square(vibrato)*0.4
  )
  : fi.lowpass(2, 800) : fi.highpass(1, 30)
  * env;

// =======================
// MODE 3 : EPIANO / SOFT KEYS
// =======================
epEnv = strike : en.adsr(0.005, 0.35, 0.15, 0.4);

epiano =
  ( os.osc(freq)*0.6
  + os.osc(freq*2)*0.25
  + os.triangle(freq*3)*0.15
  )
  : fi.lowpass(2, 4200)
  : fi.highpass(1, 120)
  * epEnv;

// =======================
// MODE 4 : ORGAN
// =======================
organ =
  ( os.osc(freq)*0.6
  + os.osc(freq*2)*0.4
  + os.osc(freq*4)*0.2
  )
  : fi.lowpass(1, 6000)
  * (strike : en.adsr(0.01, 0.08, 1.0, 0.2));

// =======================
// MODE 5 : PAD
// =======================
padEnv = strike : en.adsr(0.3, 1.2, 0.8, 1.8);
pad =
  ( os.triangle(freq)*0.6
  + os.triangle(freq*0.5)*0.4
  )
  : fi.lowpass(2, 2000)
  * padEnv;

// =======================
// MODE 6 : LEAD
// =======================
lead =
  ( os.sawtooth(vibrato)*0.8
  + os.square(vibrato*2)*0.2
  )
  : fi.lowpass(2, 4500) : fi.highpass(1, 120)
  * env;

// =======================
// MODE 7 : BELL
// =======================
bellEnv = strike : en.adsr(0.001, 1.5, 0.0, 0.2);
bell =
  ( os.osc(freq)*0.8
  + os.osc(freq*2.7)*0.35
  + os.osc(freq*5.1)*0.20
  )
  : fi.lowpass(1, 9000)
  * bellEnv;

// =======================
// MODE 8 : STRINGS
// =======================
stringsEnv = strike : en.adsr(0.15, 0.8, 0.9, 1.2);

chorusLfo = 0.002 * os.osc(0.6);
fUp   = freq * (1 + 0.004 + chorusLfo);
fDown = freq * (1 - 0.004 + chorusLfo);

strings =
  ( os.sawtooth(fUp)*0.45
  + os.sawtooth(fDown)*0.45
  + os.triangle(freq)*0.20
  )
  : fi.lowpass(2, 2500)
  : fi.highpass(1, 80)
  * stringsEnv;

// =======================
// MODE 9 : BRASS
// =======================
brassEnv = strike : en.adsr(0.02, 0.25, 0.7, 0.25);
brass =
  ( os.sawtooth(freq)*0.75
  + os.square(freq)*0.20
  )
  : fi.lowpass(2, 3500)
  : fi.highpass(1, 120)
  * brassEnv;

// =======================
// SÉLECTION DU MODE
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
// SORTIE STÉRÉO
// =======================
process = synth * gain <: _,_;
