// sticker images attribution (all from Pinterest, accessed October 2026):
// sticker 1 - https://in.pinterest.com/pin/8936899258660903/
// sticker 2 - https://in.pinterest.com/pin/1119285313675289801/
// sticker 3 - https://in.pinterest.com/pin/1128855462873976087/
// sticker 4 - https://in.pinterest.com/pin/1121326007268148712/
// sticker 5 - https://in.pinterest.com/pin/1115485401471817962/
// sticker 6 - https://in.pinterest.com/pin/13792342604495848/
// sticker 7 - https://in.pinterest.com/pin/706361522850546409/
// sticker 8 - https://in.pinterest.com/pin/1121326007268148712/
// sticker 9 - https://in.pinterest.com/pin/785104147593537525/

const STICKER_FOLDER = "images/";        
const STICKER_FILES = [                      
  "sticker 1.png", "sticker 2.png", "sticker 3.png",
  "sticker 4.png", "sticker 5.png", "sticker 6.png",
  "sticker 7.png", "sticker 8.png", "sticker 9.png"
];
const COLOURS = [
  "#ffffff", "#000000", "#e07570",
  "#edc79f", "#171a45", "#bd44f1",
  "#123204", "#e08faf", "#590c03"
];
// photos can be shrunk to half size or enlarged five times
const MIN_ZOOM = 0.5, MAX_ZOOM = 5;

/* =====================================================
   Setup
   ===================================================== */

// Context: I based this on a real photobooth, where you get a tall strip of three
// photos and choose the frame colour before it prints. That is why the strip is one
// fixed box with three slots, and why the colour and sticker panels sit either side
// of it, like the controls around a machine.

const strip = document.getElementById("strip");
const hint = document.getElementById("hint");
const slots = [...document.querySelectorAll(".slot")];
const SLOT_COLOURS = ["#c4c4c4", "#c4c4c4", "#c4c4c4"];
let frameColour = getComputedStyle(strip).backgroundColor;
let selected = null;

/* simple placeholder shown if a sticker file can't be found */
// Feedback: if a sticker file is missing, a numbered placeholder appears, so a wrong
// file name is obvious instead of leaving a blank gap.
function placeholder(n) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect x="6" y="6" width="88" height="88" rx="18" fill="#b9473f"/><text x="50" y="62" font-size="38" text-anchor="middle" fill="#fff" font-family="serif">${n}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/* ---- build colour swatches ---- */
// built from the COLOURS list so adding a colour needs no HTML
const colourPanel = document.getElementById("colour-panel");

/* ---- drag and drop: colours and stickers ---- */
// Usability: I used drag and drop so you can pick up a colour or sticker and put it on the strip, 
// like decorating a real photo strip. I used the HTML Drag and Drop API for this (MDN, 'HTML Drag and Drop API').

COLOURS.forEach(c => {
  const s = document.createElement("div");
  s.className = "swatch";
  s.style.background = c;
  s.draggable = true;
  s.title = "Drag onto the strip";
  s.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/colour", c);
    e.dataTransfer.effectAllowed = "copy";
    // Feedback: the strip gets a dashed outline while something is dragged over it.
    strip.classList.add("drop-ready");
  });
  s.addEventListener("dragend", () => strip.classList.remove("drop-ready"));
  colourPanel.appendChild(s);
});

function setFrame(c) {
  strip.style.background = c;
  frameColour = c;   // remembered so the download uses the same colour
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
  box.addEventListener("click", () => addSticker(img.src, 110, 500));   // click adds near the bottom
  stickerPanel.appendChild(box);
});

/* ---- sticker pack dropdown: only the trial pack is free ---- */
// a mock-up of a subscription: locked packs show a message and the
// dropdown snaps back to the trial pack
const packSelect = document.getElementById("pack-select");
const packMsg = document.getElementById("pack-msg");

packSelect.addEventListener("change", () => {
  const locked = packSelect.selectedOptions[0].hasAttribute("data-locked");
  packMsg.hidden = !locked;
  if (locked) packSelect.selectedIndex = 0;   // snap back to the trial pack
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
    addSticker(sticker, e.clientX - r.left - 40, e.clientY - r.top - 40);   // 40 = half the sticker, so it lands under the cursor
  }
});

/* =====================================================
   Placed stickers: move, resize, rotate, delete
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
  const rotate = document.createElement("div");
  rotate.className = "rotate";
  rotate.textContent = "↻";
  rotate.title = "Drag to rotate (hold Shift to snap)";
  el.dataset.rot = "0";   // rotation is stored here so the download can use it
  el.append(img, handle, del, rotate);
  strip.appendChild(el);
  select(el);

  /* move */
  // Usability: I used pointer events rather than separate mouse and touch code, so one
  // set of handlers covers both (MDN, 'Pointer events').
  el.addEventListener("pointerdown", e => {
    if (e.target === handle || e.target === del || e.target === rotate) return;
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

  /* rotate: the angle comes from where the pointer is relative to the sticker's centre I added this so that users can rotate stickers
  and adjust them to their liking */
  rotate.addEventListener("pointerdown", e => {
    e.stopPropagation();
    select(el);
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    rotate.setPointerCapture(e.pointerId);
    const move = ev => {
      let deg = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI + 90;
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;   // snap to 15° steps
      el.dataset.rot = deg;
      el.style.transform = `rotate(${deg}deg)`;
    };
    const up = () => { rotate.removeEventListener("pointermove", move); rotate.removeEventListener("pointerup", up); };
    rotate.addEventListener("pointermove", move);
    rotate.addEventListener("pointerup", up);
  });

  del.addEventListener("click", e => { e.stopPropagation(); el.remove(); selected = null; });
}

// Feedback: a selected sticker shows its handles, so you can see what you are editing.
function select(el) {
  if (selected) selected.classList.remove("selected");
  selected = el;
  if (el) el.classList.add("selected");
}
/* click empty space = deselect */
document.addEventListener("pointerdown", e => { if (!e.target.closest(".placed")) select(null); });

// Future use: dragging is hard for keyboard users. Delete is the only key control so
// far, so I would add more keyboard controls and alt text.
document.addEventListener("keydown", e => {
  if ((e.key === "Delete" || e.key === "Backspace") && selected) { selected.remove(); selected = null; }
});

/* =====================================================
   Photo slots: upload, zoom (buttons / scroll wheel), pan (drag)
   ===================================================== */
const fileInput = document.getElementById("file-input");
const singleInput = document.getElementById("single-input");
let slotToReplace = null;

/* per-photo zoom + position, in slot pixels
   (s = scale, x and y = how far the photo has been dragged) */
// Future use: photos only live in memory, so large images could slow the page and
// nothing is saved between visits.
const view = slots.map(() => ({ s: 1, x: 0, y: 0 }));

function applyView(i) {
  const img = slots[i].querySelector("img.photo");
  if (!img) return;
  const v = view[i];
  img.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
}
function zoomBy(i, factor) {
  const v = view[i];
  v.s = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v.s * factor));
  applyView(i);
}
function resetView(i) {
  view[i] = { s: 1, x: 0, y: 0 };
  applyView(i);
}
function chooseFor(i) { slotToReplace = i; singleInput.click(); }

slots.forEach((slot, i) => {
  /* toolbar */
  // Feedback: the photo toolbar fades in when you hover over a photo.
  const tools = document.createElement("div");
  tools.className = "tools";
  const defs = [
    ["−", "Zoom out", () => zoomBy(i, 1 / 1.15)],
    ["+", "Zoom in", () => zoomBy(i, 1.15)],
    ["⟲", "Reset", () => resetView(i)],
    ["⇄", "Swap photo", () => chooseFor(i)]
  ];
  defs.forEach(([label, title, fn]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.title = title;
    b.addEventListener("pointerdown", e => e.stopPropagation());
    b.addEventListener("click", e => { e.stopPropagation(); fn(); });
    tools.appendChild(b);
  });
  slot.appendChild(tools);

  /* empty slot: click to upload */
  slot.addEventListener("click", () => {
    if (!slot.classList.contains("has-photo")) chooseFor(i);
  });

  /* scroll wheel zoom */
  slot.addEventListener("wheel", e => {
    if (!slot.classList.contains("has-photo")) return;
    e.preventDefault();   // stops the whole page scrolling while zooming
    zoomBy(i, e.deltaY < 0 ? 1.08 : 1 / 1.08);
  }, { passive: false });

  /* drag to pan */
  slot.addEventListener("pointerdown", e => {
    if (!slot.classList.contains("has-photo") || e.target.closest(".tools")) return;
    const startX = e.clientX, startY = e.clientY;
    const origX = view[i].x, origY = view[i].y;
    slot.setPointerCapture(e.pointerId);
    slot.classList.add("panning");
    const move = ev => {
      view[i].x = origX + ev.clientX - startX;
      view[i].y = origY + ev.clientY - startY;
      applyView(i);
    };
    const up = () => {
      slot.classList.remove("panning");
      slot.removeEventListener("pointermove", move);
      slot.removeEventListener("pointerup", up);
      slot.removeEventListener("pointercancel", up);
    };
    slot.addEventListener("pointermove", move);
    slot.addEventListener("pointerup", up);
    slot.addEventListener("pointercancel", up);
  });
});

document.getElementById("upload-btn").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const files = [...fileInput.files].slice(0, 3);
  files.forEach((f, i) => readInto(f, i));
  if (fileInput.files.length > 3) hint.textContent = "Only the first 3 pictures were used - the strip has 3 spots.";
  fileInput.value = "";
});

singleInput.addEventListener("change", () => {
  if (singleInput.files[0] && slotToReplace !== null) readInto(singleInput.files[0], slotToReplace);
  singleInput.value = "";
});

function readInto(file, index) {
  if (!file.type.startsWith("image/")) return;
  // Photos are read in the browser with FileReader (MDN, 'FileReader'), so nothing
  // is uploaded to a server.
  const reader = new FileReader();
  reader.onload = () => {
    const slot = slots[index];
    let img = slot.querySelector("img.photo");
    if (!img) {
      img = document.createElement("img");
      img.className = "photo";
      img.draggable = false;
      slot.insertBefore(img, slot.querySelector(".tools"));
    }
    img.src = reader.result;
    slot.classList.add("has-photo");
    resetView(index);   // a new photo starts at normal size
  };
  reader.readAsDataURL(file);
}

/* =====================================================
   Download the strip as a PNG
   ===================================================== */
// Download: the strip is redrawn onto a canvas at twice the size instead of being
// screenshotted, so the PNG is sharper than the screen and keeps my zoom, pan and
// rotation (MDN, 'Canvas API').
document.getElementById("download-btn").addEventListener("click", () => {
  select(null);   // hide the sticker handles so they are not in the picture
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
    ctx.fillStyle = SLOT_COLOURS[i];
    ctx.fillRect(x, y, w, h);
    const img = slot.querySelector("img.photo");
    if (img) {
      const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);   // "contain" fit
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      const v = view[i];
      ctx.translate(x + w / 2 + v.x, y + h / 2 + v.y);
      ctx.scale(v.s, v.s);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
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
    const w = el.offsetWidth, h = el.offsetHeight;
    const rot = (parseFloat(el.dataset.rot) || 0) * Math.PI / 180;
    ctx.save();
    ctx.translate(el.offsetLeft + w / 2, el.offsetTop + h / 2);   // rotate around the centre
    ctx.rotate(rot);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  });

  // Feedback: the hint text at the top says 'Saved!' or explains why the download
  // failed, so the button never just does nothing.
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