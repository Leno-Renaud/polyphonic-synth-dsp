let writer;

const $ = (id) => document.getElementById(id);
const log = (msg) => console.log(msg);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const presetNameEl = $("preset-name");
const prevPresetBtn = $("preset-prev");
const nextPresetBtn = $("preset-next");

let presets = [];
let currentPresetIndex = 0;

const controlBindings = new Map();
const valueEls = new Map(
  Array.from(document.querySelectorAll(".knobValue[data-param]")).map((el) => [el.dataset.param, el])
);

const presetKeyToParam = {
  mode: "mode",
  Attack: "attack",
  Decay: "decay",
  Sustain: "sustain",
  Release: "release",
  Lowpass: "lowCut",
  Highpass: "highCut",
  WetDry: "wetDry",
  ReverbAmount: "reverbAmount",
  VibratoRate: "vibRate",
  VibratoDepth: "vibDepth",
};

const write = async (line) => {
  if (!writer) return (log("⚠️ Pas de port connecté"), false);
  await writer.write(new TextEncoder().encode(line));
  return true;
};

const sendParamLine = async (param, value) => {
  const numeric = Number(value);
  const serialized = Number.isFinite(numeric) ? `${numeric}` : `${value}`;
  const line = `${param}=${serialized}\n`;
  try {
    if (await write(line)) log("➡️ Envoyé : " + line.trim());
  } catch (e) {
    log("❌ Erreur envoi " + param + " : " + e);
  }
};

const loadPresets = async () => {
  if (presets.length) return presets;
  const response = await fetch("presets.json", { cache: "no-store" });
  const data = await response.json();
  presets = Array.isArray(data?.presets) ? data.presets : [];
  return presets;
};

const renderPresetLabel = () => {
  if (!presetNameEl) return;
  const preset = presets[currentPresetIndex];
  presetNameEl.textContent = preset?.name || "Mode 0";
};

const applyControlValue = (param, value) => {
  const binding = controlBindings.get(param);
  if (!binding) return;
  binding.setValue(value);
};

const applyPreset = async (index, sendSerial = true) => {
  if (!presets.length) return;
  currentPresetIndex = ((index % presets.length) + presets.length) % presets.length;
  const preset = presets[currentPresetIndex];
  renderPresetLabel();

  Object.entries(preset).forEach(([key, rawValue]) => {
    const param = presetKeyToParam[key];
    if (!param) return;
    applyControlValue(param, rawValue);
  });

  if (!sendSerial) return;

  for (const [key, rawValue] of Object.entries(preset)) {
    const param = presetKeyToParam[key];
    if (!param) continue;
    await sendParamLine(param, rawValue);
  }
};

const goToPreset = async (delta) => {
  await loadPresets();
  await applyPreset(currentPresetIndex + delta, true);
};

$("connect").onclick = async () => {
  try {
    $("connect").classList.remove("is-connected");
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    writer = port.writable.getWriter();
    log("✅ Port série connecté");
    $("connect").classList.add("is-connected");
    await loadPresets();
    await applyPreset(0, true);
  } catch (e) {
    $("connect").classList.remove("is-connected");
    log("❌ Erreur connexion : " + e);
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

const initKnob = (el) => {
  const param = el.dataset.param;
  const min = num(el.dataset.min, 0);
  const max = num(el.dataset.max, 1);
  const step = num(el.dataset.step, 0.01);
  const decimals = num(el.dataset.decimals, 2);
  const size = num(el.dataset.size, 80);
  const valueEl = valueEls.get(param);
  let silent = false;

  const updateUi = (v) => {
    const value = clamp(num(v, min), min, max);
    const norm = max === min ? 0 : (value - min) / (max - min);
    valueEl && (valueEl.textContent = value.toFixed(decimals));
    el.style.setProperty("--angle", `${norm * 270 - 135}deg`);
    el.style.setProperty("--arc", `${norm * 270}deg`);
    el.dataset.value = `${value}`;
    return value;
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
  dial.on("change", (v) => {
    const value = updateUi(v);
    if (!interacted || silent) return;
    sendParamLine(param, value);
  });

  controlBindings.set(param, {
    setValue: (v) => {
      const value = updateUi(v);
      silent = true;
      try {
        dial.value = value;
      } finally {
        silent = false;
      }
    },
  });
};

const initSlider = (el) => {
  const param = el.dataset.param;
  const min = num(el.dataset.min, 0);
  const max = num(el.dataset.max, 1);
  const step = num(el.dataset.step, 0.01);
  const decimals = num(el.dataset.decimals, 2);
  const sizeStr = el.dataset.size || "40,400";
  const [w, h] = sizeStr.split(",").map(s => num(s));
  const valueEl = valueEls.get(param);
  let silent = false;

  const updateUi = (v) => {
    const value = clamp(num(v, min), min, max);
    const norm = max === min ? 0 : (value - min) / (max - min);
    valueEl && (valueEl.textContent = value.toFixed(decimals));
    el.style.setProperty("--norm", norm);
    el.dataset.value = `${value}`;
    return value;
  };
  
  const initial = updateUi(num(el.dataset.value, (min + max) / 2));
  const slider = new Nexus.Slider(el, {
    size: [w, h],
    mode: "relative",
    min,
    max,
    step,
    value: initial
  });

  let interacted = false;
  el.addEventListener("pointerdown", () => (interacted = true), true);
  slider.on("change", (v) => {
    const value = updateUi(v);
    if (!interacted || silent) return;
    sendParamLine(param, value);
  });

  controlBindings.set(param, {
    setValue: (v) => {
      const value = updateUi(v);
      silent = true;
      try {
        slider.value = value;
      } finally {
        silent = false;
      }
    },
  });
};

document.querySelectorAll(".knob[data-param]").forEach(initKnob);
document.querySelectorAll(".slider[data-param]").forEach(initSlider);

if (prevPresetBtn) {
  prevPresetBtn.addEventListener("click", () => goToPreset(-1));
}

if (nextPresetBtn) {
  nextPresetBtn.addEventListener("click", () => goToPreset(1));
}

loadPresets()
  .then(() => applyPreset(0, false))
  .catch((e) => log("❌ Erreur chargement presets : " + e));
