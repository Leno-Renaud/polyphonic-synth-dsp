let writer;

const $ = (id) => document.getElementById(id);
const log = (msg) => console.log(msg);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const presetNameEl = $("preset-name");
const prevPresetBtn = $("preset-prev");
const nextPresetBtn = $("preset-next");
const newPresetNameEl = $("preset-new-name");
const addPresetBtn = $("preset-add-btn");

let presets = [];
let currentPresetIndex = 0;

const USER_PRESETS_STORAGE_KEY = "teensySynth.userPresets.v1";

const controlBindings = new Map();
const valueInputs = new Map(
  Array.from(document.querySelectorAll(".param-input[data-param]")).map((el) => [el.dataset.param, el])
);

const paramMeta = new Map();

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

const paramToPresetKey = Object.fromEntries(Object.entries(presetKeyToParam).map(([k, v]) => [v, k]));

const loadUserPresets = () => {
  try {
    const raw = sessionStorage.getItem(USER_PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveUserPresets = (userPresets) => {
  try {
    sessionStorage.setItem(USER_PRESETS_STORAGE_KEY, JSON.stringify(userPresets));
  } catch {
    // ignore
  }
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
  let base = [];
  try {
    const response = await fetch("presets.json", { cache: "no-store" });
    const data = await response.json();
    base = Array.isArray(data?.presets) ? data.presets : [];
  } catch {
    base = [];
  }
  const user = loadUserPresets();
  presets = [...base, ...user];
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

const getControlElByParam = (param) =>
  document.querySelector(`.knob[data-param="${param}"], .slider[data-param="${param}"]`);

const syncInputAttributes = (param) => {
  const input = valueInputs.get(param);
  const meta = paramMeta.get(param);
  if (!input || !meta) return;
  input.type = "number";
  input.inputMode = "decimal";
  input.min = `${meta.min}`;
  input.max = `${meta.max}`;
  input.step = `${meta.step}`;
};

const validateInputAndSend = async (input) => {
  const param = input?.dataset?.param;
  if (!param) return;
  const meta = paramMeta.get(param);
  const controlEl = getControlElByParam(param);
  if (!meta || !controlEl) return;

  const raw = input.value;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) {
    // revert to current control value
    const current = num(controlEl.dataset.value, meta.min);
    input.value = current.toFixed(meta.decimals);
    return;
  }

  const clamped = clamp(numeric, meta.min, meta.max);
  applyControlValue(param, clamped);
  input.value = clamped.toFixed(meta.decimals);
  await sendParamLine(param, clamped);
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
  const valueInput = valueInputs.get(param);
  let silent = false;

  paramMeta.set(param, { min, max, step, decimals });
  syncInputAttributes(param);

  const updateUi = (v) => {
    const value = clamp(num(v, min), min, max);
    const norm = max === min ? 0 : (value - min) / (max - min);
    valueInput && (valueInput.value = value.toFixed(decimals));
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
  const valueInput = valueInputs.get(param);
  let silent = false;

  paramMeta.set(param, { min, max, step, decimals });
  syncInputAttributes(param);

  const updateUi = (v) => {
    const value = clamp(num(v, min), min, max);
    const norm = max === min ? 0 : (value - min) / (max - min);
    valueInput && (valueInput.value = value.toFixed(decimals));
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

// Validation des inputs (Entrée / blur)
document.querySelectorAll(".param-input[data-param]").forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    input.blur();
  });
  input.addEventListener("blur", () => validateInputAndSend(input));
});

if (prevPresetBtn) {
  prevPresetBtn.addEventListener("click", () => goToPreset(-1));
}

if (nextPresetBtn) {
  nextPresetBtn.addEventListener("click", () => goToPreset(1));
}

loadPresets()
  .then(() => applyPreset(0, false))
  .catch((e) => log("❌ Erreur chargement presets : " + e));

const buildPresetFromCurrentUi = (name) => {
  const preset = { name };

  // Conserver le mode du preset courant si dispo (sinon index courant)
  preset.mode = presets[currentPresetIndex]?.mode ?? currentPresetIndex;

  for (const [param, presetKey] of Object.entries(paramToPresetKey)) {
    if (presetKey === "name") continue;
    if (presetKey === "mode") continue;
    const controlEl = getControlElByParam(param);
    if (!controlEl) continue;
    const meta = paramMeta.get(param);
    const value = num(controlEl.dataset.value, 0);

    // garder un nombre (pas une string), arrondi selon decimals pour stabilité
    const stable = meta ? Number(value.toFixed(meta.decimals)) : value;
    preset[presetKey] = stable;
  }

  return preset;
};

if (addPresetBtn && newPresetNameEl) {
  addPresetBtn.addEventListener("click", async () => {
    await loadPresets();
    const name = `${newPresetNameEl.value || ""}`.trim();
    if (!name) return;

    const newPreset = buildPresetFromCurrentUi(name);

    const userPresets = loadUserPresets();
    userPresets.push(newPreset);
    saveUserPresets(userPresets);

    presets.push(newPreset);
    currentPresetIndex = presets.length - 1;
    renderPresetLabel();
    newPresetNameEl.value = "";
  });
}
