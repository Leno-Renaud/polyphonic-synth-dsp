declare name "SuperSynth_Filters";
import("stdfaust.lib");

// =======================
// 1. PARAMÈTRES GÉNÉRAUX
// =======================
freq   = hslider("freq", 440, 27.5, 4186, 0.01);
gain   = hslider("volume", 0.5, 0, 1, 0.001);
strike = button("gate"); 
mode   = hslider("mode", 0, 0, 9, 1);

// =======================
// 2. ENVELOPPES ADSR
// =======================
attack  = hslider("attack", 0.01, 0.001, 2, 0.001);
decay   = hslider("decay", 0.3, 0.001, 2, 0.001);
sustain = hslider("sustain", 0.5, 0, 1, 0.01);
release = hslider("release", 1.0, 0.001, 5, 0.001);

// =======================
// 3. MODULATION (Vibrato)
// =======================
vibRate  = hslider("vibRate", 6.0, 0.1, 20, 0.1);
vibDepth = hslider("vibDepth", 0.002, 0, 0.02, 0.0001);

// =======================
// 4. FILTRES (NOUVEAU)
// =======================
// Lowpass : Coupe les aigus. 20000 = Tout passe.
cut_low = hslider("lowpass", 20000, 20, 20000, 1);

// Highpass : Coupe les graves. 20 = Tout passe.
cut_high = hslider("highpass", 20, 20, 2000, 1);

// =======================
// 5. MOTEUR AUDIO
// =======================
env = strike : en.adsr(attack, decay, sustain, release);
vibrato = freq * (1 + vibDepth * os.osc(vibRate));

// =======================
// 6. INSTRUMENTS (10 Modes)
// =======================
supersaw = (os.sawtooth(vibrato)*0.5 + os.sawtooth(vibrato*1.01)*0.25 + os.sawtooth(vibrato*0.99)*0.25) * env;
celestial = (os.osc(vibrato)*0.4 + os.osc(vibrato*2.0)*0.3 + os.triangle(vibrato*4.0)*0.2 + os.osc(vibrato*8.0)*0.1) * env;
cyberbass = (os.osc(freq*0.5 + os.osc(freq)*200)*0.8 + os.sawtooth(freq*0.505)*0.2) * env;
crystal = (os.osc(freq + os.osc(freq*4.0)*(freq*0.5))) * env;
vapor = (os.triangle(vibrato)*0.6 + os.triangle(vibrato*1.02)*0.3 + no.noise*0.05) * env;
abyss = (os.square(vibrato*0.5)*0.4 + os.osc(vibrato*0.25)*0.5 + os.sawtooth(vibrato*1.01)*0.1) * env;
koto = (os.sawtooth(freq)*0.5 + os.pulsetrain(freq, 0.2)*0.5) * env;
bell = (os.osc(freq)*0.8 + os.osc(freq*2.7)*0.35 + os.osc(freq*5.1)*0.20) * env;
galactic = (os.square(vibrato) * os.osc(vibrato*0.5)) * env;
orchestra = (os.sawtooth(freq)*0.3 + os.sawtooth(freq*1.005)*0.2 + os.sawtooth(freq*0.995)*0.2 + os.osc(freq*2.0)*0.1 + os.osc(freq*0.5)*0.2) * env;

synth =
  (mode == 0) * supersaw   +
  (mode == 1) * celestial  +
  (mode == 2) * cyberbass  +
  (mode == 3) * crystal    +
  (mode == 4) * vapor      +
  (mode == 5) * abyss      +
  (mode == 6) * koto       +
  (mode == 7) * bell       +
  (mode == 8) * galactic   +
  (mode == 9) * orchestra  ;

// =======================
// 7. TRAITEMENT SIGNAL
// =======================
// Synth (Mono) -> Passe-Bas -> Passe-Haut -> Stéréo -> Volume
process = synth 
        : fi.lowpass(2, cut_low) 
        : fi.highpass(1, cut_high) 
        <: _,_ 
        : *(gain), *(gain);
