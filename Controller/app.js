let writer;

const $ = (id) => document.getElementById(id);
const logEl = $("log");
const messageEl = $("message");

const log = (msg) => (logEl.textContent += msg + "\n");
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const write = async (line) => {
  if (!writer) return (log("⚠️ Pas de port connecté"), false);
  await writer.write(new TextEncoder().encode(line));
  return true;
};

$("connect").onclick = async () => {
  try {
    $("connect").classList.remove("is-connected");
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    log("✅ Port série connecté");
    $("connect").classList.add("is-connected");
  } catch (e) {
    $("connect").classList.remove("is-connected");
    log("❌ Erreur connexion : " + e);
  }
};

$("send").onclick = async () => {
  const text = messageEl.value + "\n";
  try {
    if (await write(text)) log("➡️ Envoyé : " + text.trim());
  } catch (e) {
    log("❌ Erreur envoi : " + e);
  }
};

const activeOff = () => document.querySelectorAll(".knob.is-active").forEach((el) => el.classList.remove("is-active"));

document.addEventListener("pointerdown", (e) => {
  const k = e.target.closest(".knob");
  if (!k) return;
  activeOff();
  k.classList.add("is-active");
});
document.addEventListener("pointerup", activeOff);
document.addEventListener("pointercancel", activeOff);

const valueEls = new Map(
  Array.from(document.querySelectorAll(".knobValue[data-param]")).map((el) => [el.dataset.param, el])
);

const initKnob = (el) => {
  const param = el.dataset.param;
  const min = num(el.dataset.min, 0);
  const max = num(el.dataset.max, 1);
  const step = num(el.dataset.step, 0.01);
  const decimals = num(el.dataset.decimals, 2);
  const size = num(el.dataset.size, 80); // Defaults to 80 if not set
  const valueEl = valueEls.get(param);

  const updateUi = (v) => {
    const value = clamp(num(v, min), min, max);
    const norm = max === min ? 0 : (value - min) / (max - min);
    valueEl && (valueEl.textContent = value.toFixed(decimals));
    el.style.setProperty("--angle", `${norm * 270 - 135}deg`);
    el.style.setProperty("--arc", `${norm * 270}deg`);
    return value;
  };

  const send = async (v) => {
    const value = updateUi(v);
    const line = `${param}=${value.toFixed(decimals)}\n`;
    try {
      if (await write(line)) log("➡️ Envoyé : " + line.trim());
    } catch (e) {
      log("❌ Erreur envoi " + param + " : " + e);
    }
  };

  let pending, timer;
  const schedule = (v) => {
    pending = v;
    if (timer) return;
    timer = setTimeout(() => ((timer = null), send(pending)), 25);
  };

  const initial = updateUi(num(el.dataset.value, (min + max) / 2));
  const dial = new Nexus.Dial(el, {
    size: [size, size],
    interaction: "radial",
    mode: "relative",
    min,
    max,
    step,
    value: initial,
  });

  let interacted = false;
  el.addEventListener("pointerdown", () => (interacted = true), true);
  el.addEventListener("keydown", () => (interacted = true), true);
  dial.on("change", (v) => (updateUi(v), interacted && schedule(v)));
};

// Gestion bouton Strike
if($("btn-strike")) {
  $("btn-strike").onclick = async () => {
     try {
       const line = "strike=1\n";
       if (await write(line)) log("➡️ Strike!");
     } catch(e) { log("❌ Erreur strike: " + e); }
  };
}

// Gestion bouton Strike
if($("btn-strike")) {
  $("btn-strike").onclick = async () => {
     try {
       const line = "strike=1\n";
       if (await write(line)) log("➡️ Strike!");
     } catch(e) { log("❌ Erreur strike: " + e); }
  };
}

document.querySelectorAll(".knob[data-param]").forEach(initKnob);
