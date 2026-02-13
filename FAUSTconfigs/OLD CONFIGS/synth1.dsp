import("stdfaust.lib");

// =======================
// PARAMÈTRES
// =======================
freq   = hslider("freq", 440, 27.5, 4186, 0.01);
gain   = hslider("volume", 0.5, 0, 1, 0.001);
strike = button("strike");

// =======================
// ENVELOPPE ADSR
// =======================
env = strike : en.adsr(0.005, 0.08, 0.3, 0.2);

// =======================
// OSCILLATEURS MULTIPLES (riches harmoniques)
// =======================
osc1 = os.osc(freq) * 0.6;
osc2 = os.osc(freq*2) * 0.3;
osc3 = os.osc(freq*3) * 0.15;
osc4 = os.osc(freq*0.5) * 0.2; // sous-harmonique pour chaleur

wave = osc1 + osc2 + osc3 + osc4;

// =======================
// LFO subtil pour vibrato / vie
// =======================
vibrato = freq * (1 + 0.003 * os.osc(5)); // 5 Hz vibrato léger
osc1_vib = os.osc(vibrato) * 0.6;
osc2_vib = os.osc(vibrato*2) * 0.3;
osc3_vib = os.osc(vibrato*3) * 0.15;
wave_vib = osc1_vib + osc2_vib + osc3_vib + osc4;

// =======================
// FILTRAGE doux (corps chaud)
// =======================
filtered = wave_vib : fi.lowpass(2, 5000) : fi.highpass(1, 50);

// =======================
// APPLICATION DE L’ENVELOPPE
// =======================
synth = filtered * env;

// =======================
// SORTIE STÉRÉO
// =======================
process = synth * gain <: _,_;
