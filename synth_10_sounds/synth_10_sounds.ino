#include <Audio.h>
#include "synth_10_sounds.h"

// ================= AUDIO =================
AudioOutputI2S audioOut;
synth_10_sounds faustDSP;

AudioConnection patchCord1(faustDSP, 0, audioOut, 0);
AudioConnection patchCord2(faustDSP, 1, audioOut, 1);

// Timer pour déclencher strike
elapsedMillis timer;

void setup() {
  Serial.begin(9600);
  AudioMemory(40);

  // Paramètres initiaux
  faustDSP.setParamValue("/synth_10_sounds/volume", 0.2f);
  faustDSP.setParamValue("/synth_10_sounds/freq", 440.0f);
  faustDSP.setParamValue("/synth_10_sounds/mode", 7.0f);  //  


  // strike au repos
  faustDSP.setParamValue("/synth_10_sounds/strike", 0.0f);
  timer = 0;
}

void loop() {
  // Toutes les 700 ms → impulsion strike
  if (timer > 700) {
    timer = 0;

    faustDSP.setParamValue("/synth_10_sounds/strike", 1.0f);
    delay(10); // IMPULSION
    faustDSP.setParamValue("/synth_10_sounds/strike", 0.0f);
  }
}
