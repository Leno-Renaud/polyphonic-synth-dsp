#include <Audio.h>
#include "test.h"

AudioOutputI2S audioOut;
test faustDSP;
AudioConnection patchCord1(faustDSP, 0, audioOut, 0);
AudioConnection patchCord2(faustDSP, 1, audioOut, 1);

void setup() {
  Serial.begin(9600);
  AudioMemory(20);

  // Paramètres initiaux
  faustDSP.setParamValue("/test/strike", 1.0f);  // note tenue
  faustDSP.setParamValue("/test/freq", 440.0f);  // La fréquence
  faustDSP.setParamValue("/test/volume", 0.7f);  // volume
}

void loop() {
  if (Serial.available()) {
    String msg = Serial.readStringUntil('\n');
    adjustParameter(msg);
  }
}

void adjustParameter(String msg) {
  int sep = msg.indexOf('=');
  if (sep > 0) {
    String param = msg.substring(0, sep);
    float value = msg.substring(sep + 1).toFloat();

    if (param == "volume") {
      faustDSP.setParamValue("/test/volume", value);
    } 
    else if (param == "freq") {
      faustDSP.setParamValue("/test/freq", value);
    } 
    else if (param == "strike") {
      faustDSP.setParamValue("/test/strike", value);
    }
  }
}