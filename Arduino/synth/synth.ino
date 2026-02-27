#include <Audio.h>
#include "synth.h"
#include <math.h>

// ================= AUDIO =================
// envoi son au codec
AudioOutputI2S audioOut;         
// controle le codec audio
AudioControlSGTL5000 sgtl5000;

// claase synth de faust
synth voice1;
synth voice2;
synth voice3;
synth voice4;

AudioMixer4 mixerL;
AudioMixer4 mixerR;

// Connexions voix -> mixers
// source, sortieindex, dest, entréeindex
AudioConnection patchCord1(voice1, 0, mixerL, 0);
AudioConnection patchCord2(voice2, 0, mixerL, 1);
AudioConnection patchCord3(voice3, 0, mixerL, 2);
AudioConnection patchCord4(voice4, 0, mixerL, 3);

AudioConnection patchCord5(voice1, 1, mixerR, 0);
AudioConnection patchCord6(voice2, 1, mixerR, 1);
AudioConnection patchCord7(voice3, 1, mixerR, 2);
AudioConnection patchCord8(voice4, 1, mixerR, 3);

AudioConnection patchCordOutL(mixerL, 0, audioOut, 0);
AudioConnection patchCordOutR(mixerR, 0, audioOut, 1);
//variables globales
float masterVolume = 1.0f;
float baseVibDepth = 0.0f;
float baseVibRate  = 5.0f;

// ================= POLYPHONIE =================
//Tableau de pointeurs vers les 4 voix (pour faire la boucle)
synth* voices[4] = { &voice1, &voice2, &voice3, &voice4 };
//Sert au voice stealing intelligent.
int voiceNote[4] = { -1, -1, -1, -1 };
int voiceAge[4]  = {  0,  0,  0,  0 };
int globalAge = 0;

// ================= SETUP =================
void setup() {
  //Initialise communication série (Web interface).
  Serial.begin(9600);
  // Attends que la connexion USB série soit prête, mais pas plus de 3 secondes.
  while (!Serial && millis() < 3000);
  Serial.println("Teensy Ready");

  //Alloue 60 blocs audio (buffer audio interne) pour objets (synth, mixer filtre...)
  AudioMemory(60);

  // active codec
  sgtl5000.enable();
  sgtl5000.volume(0.5);

  for (int i = 0; i < 4; i++) {
    mixerL.gain(i, 0.25);
    mixerR.gain(i, 0.25);

    voices[i]->setParamValue("/synth/volume", 0.3f);
    voices[i]->setParamValue("/synth/mode", 1.0f);
    voices[i]->setParamValue("/synth/strike", 0.0f);
  }
}

// ================= LOOP =================
void loop() {
  // ===== MIDI =====
  while (usbMIDI.read()) {
    byte type = usbMIDI.getType();
    Serial.println(usbMIDI.getData2());

    // getData1() = numéro note et getData2() = véloc
    if (type == usbMIDI.NoteOn && usbMIDI.getData2() > 0) {
      noteOn(usbMIDI.getData1(), usbMIDI.getData2());
    } 
    else if (type == usbMIDI.NoteOff || 
              (type == usbMIDI.NoteOn && usbMIDI.getData2() == 0)) {
      noteOff(usbMIDI.getData1());
    }
    else if (type == usbMIDI.ControlChange && usbMIDI.getData1() == 1) {
      applyMusicalVibrato(usbMIDI.getData2());
    }
  }

  // ===== SERIAL =====
  if (Serial.available()) {
    String msg = Serial.readStringUntil('\n');
    adjustParameter(msg);
  }
}

// ================= NOTE ON =================
void noteOn(int midiNote, int velocity) {
  // Convertit vélocité MIDI (0–127) → 0.0–1.0
  float amp = (velocity / 127.0) * masterVolume;
  // Conversion note MIDI → fréquence
  float frequency = 440.0 * pow(2.0, (midiNote - 69) / 12.0);

  // Cherche voix libre
  for (int i = 0; i < 4; i++) {
    if (voiceNote[i] == -1) {
      voiceNote[i] = midiNote;
      voiceAge[i]  = ++globalAge;

      voices[i]->setParamValue("/synth/freq", frequency);
      voices[i]->setParamValue("/synth/volume", amp);
      voices[i]->setParamValue("/synth/strike", amp);

      return;
    }
  }

  int oldest = 0;
  for (int i = 1; i < 4; i++) {
    if (voiceAge[i] < voiceAge[oldest]) oldest = i;
  }

  voiceNote[oldest] = midiNote;
  voiceAge[oldest]  = ++globalAge;

  voices[oldest]->setParamValue("/synth/freq", frequency);
  voices[oldest]->setParamValue("/synth/volume", amp);
  voices[oldest]->setParamValue("/synth/strike", amp);
}

// ================= NOTE OFF =================
void noteOff(int midiNote) {
  for (int i = 0; i < 4; i++) {
    if (voiceNote[i] == midiNote) {
      voices[i]->setParamValue("/synth/strike", 0.0f);
      voiceNote[i] = -1;
      voiceAge[i]  =  0;
      return;
    }
  }
}

// ================= SERIAL PARAMS =================
void adjustParameter(String msg) {
  // sépare attack=0.5
  int sep = msg.indexOf('=');
  if (sep <= 0) return;

  // prend nom
  String param = msg.substring(0, sep);
  // prend val
  float value = msg.substring(sep + 1).toFloat();

  Serial.println(msg);

  for (int i = 0; i < 4; i++) {
    if (param == "volume")
      masterVolume = value;
    else if (param == "mode")
      voices[i]->setParamValue("/synth/mode", value);
    else if (param == "attack")
      voices[i]->setParamValue("ADSR/Attack", value);
    else if (param == "decay")
      voices[i]->setParamValue("ADSR/Decay", value);
    else if (param == "sustain")
      voices[i]->setParamValue("ADSR/Sustain", value);
    else if (param == "release")
      voices[i]->setParamValue("ADSR/Release", value);
    else if (param == "vibRate"){
      voices[i]->setParamValue("Modulation/VibratoRate", value);
      baseVibRate = value;
    }
    else if (param == "vibDepth"){
      voices[i]->setParamValue("Modulation/VibratoDepth", value);
      baseVibDepth = value;
    }
    else if (param == "lowCut")
      voices[i]->setParamValue("Filter/Lowpass", value);
    else if (param == "highCut")
      voices[i]->setParamValue("Filter/Highpass", value);
    else if (param == "pan")
      voices[i]->setParamValue("Spatial/Pan", value);
  }
}

void applyMusicalVibrato(byte ccValue)
// Reçoit valeur 0–127
{
    float x = ccValue / 127.0f;
    float curve = x * x;
    // coubre quadra + Pour que la modulation soit plus progressive et musicale.


    float addDepth = 0.025f * curve;
    float addRate  = 1 * curve;

    float finalDepth = baseVibDepth + addDepth;
    float finalRate  = baseVibRate  + addRate;

    for (int i = 0; i < 4; i++) {
        voices[i]->setParamValue("Modulation/VibratoDepth", finalDepth);
        voices[i]->setParamValue("Modulation/VibratoRate", finalRate);
    }
}
