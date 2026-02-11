void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000); // attendre le port série
  Serial.println("Teensy MIDI Ready");
}

// Callback personnalisé
void handleNoteOn(byte channel, byte note, byte velocity) {
  Serial.print("Note ON  - Channel: ");
  Serial.print(channel);
  Serial.print(" Note: ");
  Serial.print(note);
  Serial.print(" Velocity: ");
  Serial.println(velocity);
}

void handleNoteOff(byte channel, byte note, byte velocity) {
  Serial.print("Note OFF - Channel: ");
  Serial.print(channel);
  Serial.print(" Note: ");
  Serial.print(note);
  Serial.print(" Velocity: ");
  Serial.println(velocity);
}

void loop() {
  // Lire tous les messages reçus
  while (usbMIDI.read()) {
    byte type = usbMIDI.getType();
    if (type == usbMIDI.NoteOn) {
      handleNoteOn(usbMIDI.getChannel(), usbMIDI.getData1(), usbMIDI.getData2());
    } 
    else if (type == usbMIDI.NoteOff) {
      handleNoteOff(usbMIDI.getChannel(), usbMIDI.getData1(), usbMIDI.getData2());
    }
  }
}