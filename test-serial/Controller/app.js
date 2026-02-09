let port;
let writer;

const logEl = document.getElementById("log");
const messageEl = document.getElementById("message");
const volumeEl = document.getElementById("volume");
const volumeValueEl = document.getElementById("volumeValue");

const log = (msg) => {
  logEl.textContent += msg + "\n";
};

const writeLine = async (line) => {
  if (!writer) {
    log("⚠️ Pas de port connecté");
    return;
  }

  const data = new TextEncoder().encode(line);
  await writer.write(data);
};

document.getElementById("connect").addEventListener("click", async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    writer = port.writable.getWriter();
    log("✅ Port série connecté");
  } catch (e) {
    log("❌ Erreur connexion : " + e);
  }
});

document.getElementById("send").addEventListener("click", async () => {
  const text = messageEl.value + "\n";
  try {
    await writeLine(text);
    if (writer) log("➡️ Envoyé : " + text.trim());
  } catch (e) {
    log("❌ Erreur envoi : " + e);
  }
});

// Slider volume : 0 → 1
const updateVolumeUi = () => {
  volumeValueEl.textContent = Number(volumeEl.value).toFixed(2);
};

updateVolumeUi();

volumeEl.addEventListener("input", async () => {
  updateVolumeUi();
  const value = volumeEl.value;
  const line = `volume=${value}\n`;

  try {
    await writeLine(line);
    if (writer) log("➡️ Envoyé : " + line.trim());
  } catch (e) {
    log("❌ Erreur envoi volume : " + e);
  }
});
