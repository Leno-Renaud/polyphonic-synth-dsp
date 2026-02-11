#include <Audio.h>
#include "parameters_sounds.h"
#include <math.h>

// ================= AUDIO =================
AudioOutputI2S audioOut;
AudioControlSGTL5000 sgtl5000;

parameters_sounds voice1;
parameters_sounds voice2;
parameters_sounds voice3;
parameters_sounds voice4;

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

AudioConnection patchCordOutL(mixerL, 0, audioOut, 0);
AudioConnection patchCordOutR(mixerR, 0, audioOut, 1);

// ================= POLYPHONIE =================
parameters_sounds* voices[4] = { &voice1, &voice2, &voice3, &voice4 };
int voiceNote[4] = { -1, -1, -1, -1 };

// ================= SETUP =================
void setup() {

  Serial.begin(9600);
  while (!Serial && millis() < 3000);
  Serial.println("Teensy Ready");

  AudioMemory(60);

  sgtl5000.enable();
  sgtl5000.volume(0.5);

  for (int i = 0; i < 4; i++) {
    mixerL.gain(i, 0.25);
    mixerR.gain(i, 0.25);

    voices[i]->setParamValue("/parameters_sounds/volume", 0.3f);
    voices[i]->setParamValue("/parameters_sounds/mode", 7.0f);
    voices[i]->setParamValue("/parameters_sounds/strike", 0.0f);
  }
}

// ================= LOOP =================
void loop() {

  // ===== MIDI =====
  while (usbMIDI.read()) {
    byte type = usbMIDI.getType();

    if (type == usbMIDI.NoteOn && usbMIDI.getData2() > 0) {
      noteOn(usbMIDI.getData1(), usbMIDI.getData2());
    }
    else if (type == usbMIDI.NoteOff || 
            (type == usbMIDI.NoteOn && usbMIDI.getData2() == 0)) {
      noteOff(usbMIDI.getData1());
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

  float frequency = 440.0 * pow(2.0, (midiNote - 69) / 12.0);

  for (int i = 0; i < 4; i++) {
    if (voiceNote[i] == -1) {
      voiceNote[i] = midiNote;
      voices[i]->setParamValue("/parameters_sounds/freq", frequency);
      voices[i]->setParamValue("/parameters_sounds/strike", 1.0f);
      return;
    }
  }

  voiceNote[0] = midiNote;
  voices[0]->setParamValue("/parameters_sounds/freq", frequency);
  voices[0]->setParamValue("/parameters_sounds/strike", 1.0f);
}

// ================= NOTE OFF =================
void noteOff(int midiNote) {

  for (int i = 0; i < 4; i++) {
    if (voiceNote[i] == midiNote) {
      voices[i]->setParamValue("/parameters_sounds/strike", 0.0f);
      voiceNote[i] = -1;
      return;
    }
  }
}

// ================= SERIAL PARAMS =================
void adjustParameter(String msg) {

  int sep = msg.indexOf('=');
  if (sep <= 0) return;

  String param = msg.substring(0, sep);
  float value = msg.substring(sep + 1).toFloat();

  Serial.println(msg);

  for (int i = 0; i < 4; i++) {

    if (param == "volume")
      voices[i]->setParamValue("/parameters_sounds/volume", value);

    else if (param == "mode")
      voices[i]->setParamValue("/parameters_sounds/mode", value);

    else if (param == "vibRate")
      voices[i]->setParamValue("/parameters_sounds/Modulation/VibratoRate", value);

    else if (param == "vibDepth")
      voices[i]->setParamValue("/parameters_sounds/Modulation/VibratoDepth", value);

    else if (param == "lowCut")
      voices[i]->setParamValue("/parameters_sounds/Filter/Lowpass", value);

    else if (param == "highCut")
      voices[i]->setParamValue("/parameters_sounds/Filter/Highpass", value);

    else if (param == "pan")
      voices[i]->setParamValue("/parameters_sounds/Spatial/Pan", value);
  }
}
