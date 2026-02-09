#include <Audio.h>
#include "test.h"   // ton DSP Faust

AudioOutputI2S audioOut;
test faustDSP;
AudioConnection patchCord1(faustDSP, 0, audioOut, 0);
AudioConnection patchCord2(faustDSP, 1, audioOut, 1);

void setup() {
  AudioMemory(20);

  // Note tenue
  faustDSP.setParamValue("/test/strike", 1.0f);  // ON en permanence
  faustDSP.setParamValue("/test/freq", 440.0f);  // La
  faustDSP.setParamValue("/test/volume", 0.7f);
}

void loop() {
  // rien à faire, le DSP tourne tout seul
}
