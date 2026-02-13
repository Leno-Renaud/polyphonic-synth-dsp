#include <Audio.h>
#include "v2_10_sounds.h"
#include <math.h>

// ================= AUDIO =================
AudioOutputI2S audioOut;
AudioControlSGTL5000 sgtl5000;

v2_10_sounds voice1;
v2_10_sounds voice2;
v2_10_sounds voice3;
v2_10_sounds voice4;

AudioMixer4 mixerL;
AudioMixer4 mixerR;

// Connexions voix -> mixers
AudioConnection patchCord1(voice1, 0, mixerL, 0);
AudioConnection patchCord2(voice2, 0, mixerL, 1);
AudioConnection patchCord3(voice3, 0, mixerL, 2);
AudioConnection patchCord4(voice4, 0, mixerL, 3);

AudioConnection patchCord5(voice1, 1, mixerR, 0);
AudioConnection patchCord6(voice2, 1, mixerR, 1);
AudioConnection patchCord7(voice3, 1, mixerR, 2);
AudioConnection patchCord8(voice4, 1, mixerR, 3);

// Mixers -> sortie audio
AudioConnection patchCordOutL(mixerL, 0, audioOut, 0);
AudioConnection patchCordOutR(mixerR, 0, audioOut, 1);

// ================= POLYPHONIE =================

v2_10_sounds* voices[4] = { &voice1, &voice2, &voice3, &voice4 };
int voiceNote[4] = { -1, -1, -1, -1 };

// ================= SETUP =================
void setup() {

  Serial.begin(9600);
  while (!Serial && millis() < 3000); // attendre le port série
  Serial.println("Teensy MIDI Ready");
  AudioMemory(60);

  // Activer le codec
  sgtl5000.enable();
  sgtl5000.volume(0.5);

  // Gains mixer
  for (int i = 0; i < 4; i++) {
    mixerL.gain(i, 0.25);
    mixerR.gain(i, 0.25);
  }

  // Initialiser chaque voix
  for (int i = 0; i < 4; i++) {
    voices[i]->setParamValue("/v2_10_sounds/volume", 0.3f);
    voices[i]->setParamValue("/v2_10_sounds/mode", 7.0f);
    voices[i]->setParamValue("/v2_10_sounds/strike", 0.0f);
  }
}

// ================= LOOP =================
void loop() {
  // Lire tous les messages reçus
  while (usbMIDI.read()) {
    byte type = usbMIDI.getType();
    if (type == usbMIDI.NoteOn) {
      noteOn(usbMIDI.getData1(), usbMIDI.getData2());
    } 
    else if (type == usbMIDI.NoteOff) {
      noteOff(usbMIDI.getData1());
    }
  }
}

// ================= NOTE ON =================
void noteOn(int midiNote, int velocity) {

  // Conversion MIDI -> fréquence
  float frequency = 440.0 * pow(2.0, (midiNote - 69) / 12.0);

  // Chercher voix libre
  for (int i = 0; i < 4; i++) {
    if (voiceNote[i] == -1) {
      voiceNote[i] = midiNote;
      voices[i]->setParamValue("/v2_10_sounds/freq", frequency);
      voices[i]->setParamValue("/v2_10_sounds/strike", 1.0f);
      return;
    }
  }

  // Voice stealing simple
  voiceNote[0] = midiNote;
  voices[0]->setParamValue("/v2_10_sounds/freq", frequency);
  voices[0]->setParamValue("/v2_10_sounds/strike", 1.0f);
}

// ================= NOTE OFF =================
void noteOff(int midiNote) {

  for (int i = 0; i < 4; i++) {
    if (voiceNote[i] == midiNote) {
      voices[i]->setParamValue("/v2_10_sounds/strike", 0.0f);
      voiceNote[i] = -1;
      return;
    }
  }
}
