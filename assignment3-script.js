/* =====================================================
   SETTINGS - change these to match your files
   ===================================================== */
const STICKER_FOLDER = "images/";          // put your sticker images in a folder called "stickers"
const STICKER_FILES = [                      // exact file names (case + spaces matter)
  "sticker 1.png", "sticker 2.png", "sticker 3.png",
  "sticker 4.png", "sticker 5.png", "sticker 6.png",
  "sticker 7.png", "sticker 8.png", "sticker 9.png"
];
const COLOURS = [
  "#ffffff", "#000000", "#e07570",
  "#edc79f", "#171a45", "#b388f5",
  "#66ad56", "#e08fdf", "#c0392b"
];

/* =====================================================
   Setup
   ===================================================== */
const strip = document.getElementById("strip");
const hint = document.getElementById("hint");
const slots = [...document.querySelectorAll(".slot")];
const SLOT_COLOURS = ["#c4c4c4", "#c4c4c4", "#c4c4c4"];
let frameColour = getComputedStyle(strip).backgroundColor;
let selected = null;

/* simple placeholder shown if a sticker file can't be found */
function placeholder(n) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="6" y="6" width="88" height="88" rx="18" fill="#b9473f"/><text x="50" y="62" font-size="38" text-anchor="middle" fill="#fff" font-family="serif">${n}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* ---- build colour swatches ---- */
const colourPanel = document.getElementById("colour-panel");
COLOURS.forEach(c => {
  const s = document.createElement("div");
  s.className = "swatch";
  s.style.background = c;
  s.draggable = true;
  s.title = "Drag onto the strip";
  s.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/colour", c);
    e.dataTransfer.effectAllowed = "copy";
    strip.classList.add("drop-ready");
  });
  s.addEventListener("dragend", () => strip.classList.remove("drop-ready"));
  s.addEventListener("click", () => setFrame(c));   // click works too
  colourPanel.appendChild(s);
});

function setFrame(c) {
  strip.style.background = c;
  frameColour = c;
}

/* ---- build sticker panel ---- */
const stickerPanel = document.getElementById("sticker-panel");
STICKER_FILES.forEach((file, i) => {
  const box = document.createElement("div");
  box.className = "sticker-item";
  const img = document.createElement("img");
  img.src = STICKER_FOLDER + encodeURIComponent(file);
  img.draggable = false;
  img.onerror = () => { img.onerror = null; img.src = placeholder(i + 1); };
  box.appendChild(img);
  box.draggable = true;
  box.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/sticker", img.src);
    e.dataTransfer.effectAllowed = "copy";
    strip.classList.add("drop-ready");
  });
  box.addEventListener("dragend", () => strip.classList.remove("drop-ready"));
  box.addEventListener("click", () => addSticker(img.src, 110, 500));  // click adds near the bottom
  stickerPanel.appendChild(box);
});

/* =====================================================
   Dropping onto the strip
   ===================================================== */
strip.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
strip.addEventListener("drop", e => {
  e.preventDefault();
  strip.classList.remove("drop-ready");
  const colour = e.dataTransfer.getData("text/colour");
  const sticker = e.dataTransfer.getData("text/sticker");
  if (colour) { setFrame(colour); return; }
  if (sticker) {
    const r = strip.getBoundingClientRect();
    addSticker(sticker, e.clientX - r.left - 40, e.clientY - r.top - 40);
  }
});

/* =====================================================
   Placed stickers: move, resize, delete
   ===================================================== */
function addSticker(src, x, y) {
  const el = document.createElement("div");
  el.className = "placed";
  el.style.width = "80px";
  el.style.left = Math.max(0, Math.min(220, x)) + "px";
  el.style.top = Math.max(0, Math.min(580, y)) + "px";

  const img = document.createElement("img");
  img.src = src;
  const handle = document.createElement("div");
  handle.className = "handle";
  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "×";
  del.title = "Remove sticker";
  el.append(img, handle, del);
  strip.appendChild(el);
  select(el);

  /* move */
  el.addEventListener("pointerdown", e => {
    if (e.target === handle || e.target === del) return;
    select(el);
    const startX = e.clientX, startY = e.clientY;
    const origL = parseFloat(el.style.left), origT = parseFloat(el.style.top);
    el.setPointerCapture(e.pointerId);
    const move = ev => {
      el.style.left = (origL + ev.clientX - startX) + "px";
      el.style.top = (origT + ev.clientY - startY) + "px";
    };
    const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  });

  /* resize (keeps proportions) */
  handle.addEventListener("pointerdown", e => {
    e.stopPropagation();
    select(el);
    const startX = e.clientX;
    const origW = el.offsetWidth;
    handle.setPointerCapture(e.pointerId);
    const move = ev => {
      el.style.width = Math.max(30, Math.min(400, origW + (ev.clientX - startX))) + "px";
    };
    const up = () => { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  });

  del.addEventListener("click", e => { e.stopPropagation(); el.remove(); selected = null; });
}

function select(el) {
  if (selected) selected.classList.remove("selected");
  selected = el;
  if (el) el.classList.add("selected");
}
/* click empty space = deselect */
document.addEventListener("pointerdown", e => { if (!e.target.closest(".placed")) select(null); });
document.addEventListener("keydown", e => {
  if ((e.key === "Delete" || e.key === "Backspace") && selected) { selected.remove(); selected = null; }
});

/* =====================================================
   Photo uploads
   ===================================================== */
const fileInput = document.getElementById("file-input");
const singleInput = document.getElementById("single-input");
let slotToReplace = null;

document.getElementById("upload-btn").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const files = [...fileInput.files].slice(0, 3);
  files.forEach((f, i) => readInto(f, i));
  if (fileInput.files.length > 3) hint.textContent = "Only the first 3 pictures were used - the strip has 3 spots.";
  fileInput.value = "";
});

slots.forEach((slot, i) => slot.addEventListener("click", () => { slotToReplace = i; singleInput.click(); }));
singleInput.addEventListener("change", () => {
  if (singleInput.files[0] && slotToReplace !== null) readInto(singleInput.files[0], slotToReplace);
  singleInput.value = "";
});

function readInto(file, index) {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const slot = slots[index];
    let img = slot.querySelector("img");
    if (!img) { img = document.createElement("img"); slot.appendChild(img); }
    img.src = reader.result;
    slot.classList.add("has-photo");
  };
  reader.readAsDataURL(file);
}

/* =====================================================
   Download the strip as a PNG
   ===================================================== */
document.getElementById("download-btn").addEventListener("click", () => {
  select(null);
  const SCALE = 2;
  const canvas = document.createElement("canvas");
  canvas.width = strip.offsetWidth * SCALE;
  canvas.height = strip.offsetHeight * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  /* frame */
  ctx.fillStyle = frameColour;
  ctx.fillRect(0, 0, strip.offsetWidth, strip.offsetHeight);

  /* photos */
  slots.forEach((slot, i) => {
    const x = slot.offsetLeft, y = slot.offsetTop, w = slot.offsetWidth, h = slot.offsetHeight;
    ctx.save();
    roundRect(ctx, x, y, w, h, 8);
    ctx.clip();
    const img = slot.querySelector("img");
    if (img) {
  ctx.fillStyle = SLOT_COLOURS[i];
  ctx.fillRect(x, y, w, h);
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);   // "contain" fit
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = SLOT_COLOURS[i];
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#3a2410";
      ctx.font = "22px 'Times New Roman', Times, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("photo " + (i + 1), x + w / 2, y + h / 2);
    }
    ctx.restore();
  });

  /* stickers */
  strip.querySelectorAll(".placed").forEach(el => {
    const img = el.querySelector("img");
    ctx.drawImage(img, el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight);
  });

  try {
    const link = document.createElement("a");
    link.download = "my-photobooth-strip.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    hint.textContent = "Saved! Check your downloads folder.";
  } catch (err) {
    hint.textContent = "The browser blocked the download because the stickers were loaded from local files. Run the page through a local server (e.g. VS Code's Live Server) and try again.";
  }
});

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}