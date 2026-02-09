void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ; // attendre la connexion USB
  }
  Serial.println("Teensy prêt 🚀");
}

void loop() {
  if (Serial.available()) {
    String message = Serial.readStringUntil('\n');
    message.trim();

    Serial.print("📥 Reçu : ");
    Serial.println(message);
  }
}
