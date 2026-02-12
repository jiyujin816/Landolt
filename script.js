const visualAcuities = Array.from({ length: 10 }, (_, i) => (i + 1) / 10);

const VIEWING_DISTANCE_MM = 5000;
const ARC_MINUTE = Math.PI / 10800;
const GAP_MM_FOR_1_0 = VIEWING_DISTANCE_MM * Math.tan(ARC_MINUTE);
const OUTER_MM_FOR_1_0 = GAP_MM_FOR_1_0 * 5;

const ringTemplate = document.getElementById("ringTemplate");
const chart = document.getElementById("chart");

const backgroundColorInput = document.getElementById("backgroundColor");
const ringColorInput = document.getElementById("ringColor");
const sizeScaleInput = document.getElementById("sizeScale");
const sizeValueLabel = document.getElementById("sizeValue");
const pxPerMmInput = document.getElementById("pxPerMm");
const randomizeAllButton = document.getElementById("randomizeAll");

const cardStates = [];
const ORIENTATIONS = [0, 90, 180,270];

const randomAngle = () => ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)];

const applyTheme = () => {
  document.documentElement.style.setProperty("--bg", backgroundColorInput.value);
  document.documentElement.style.setProperty("--ring", ringColorInput.value);
};

const toPx = (mm, pxPerMm, scale) => mm * pxPerMm * scale;

function drawLandoltRing(canvas, color, orientation, outerPx) {
  const ctx = canvas.getContext("2d");
  const padding = Math.max(12, outerPx * 0.35);
  const size = Math.ceil(outerPx + padding * 2);

  canvas.width = size;
  canvas.height = size;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const unit = outerPx / 5;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((orientation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, outerPx / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, (outerPx * 3) / 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.clearRect(cx + (outerPx * 3) / 10, cy - unit / 2, unit * 2, unit);

  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function updateRings() {
  const scale = Number(sizeScaleInput.value);
  const pxPerMm = Number(pxPerMmInput.value);
  const ringColor = ringColorInput.value;

  sizeValueLabel.textContent = `${scale.toFixed(1)}x`;

  cardStates.forEach((state) => {
    const outerMm = OUTER_MM_FOR_1_0 / state.acuity;
    const outerPx = toPx(outerMm, pxPerMm, scale);

    drawLandoltRing(state.canvas, ringColor, state.orientation, outerPx);

    state.meta.textContent = `外径 ${outerMm.toFixed(2)} mm（${outerPx.toFixed(1)} px） / 切れ目幅 ${
      (outerMm / 5).toFixed(2)
    } mm`;
  });
}

function setOrientation(state, angle) {
  state.orientation = angle;
  updateRings();
}

visualAcuities.forEach((acuity) => {
  const node = ringTemplate.content.cloneNode(true);
  const card = node.querySelector(".ring-card");
  const title = card.querySelector("h2");
  const button = card.querySelector("button");
  const meta = card.querySelector(".meta");
  const canvas = card.querySelector("canvas");

  const state = {
    acuity,
    canvas,
    meta,
    orientation: randomAngle(),
  };

  title.textContent = `視力 ${acuity.toFixed(1)}`;

  button.addEventListener("click", () => {
    setOrientation(state, randomAngle());
  });

  cardStates.push(state);
  chart.appendChild(card);
});

randomizeAllButton.addEventListener("click", () => {
  cardStates.forEach((state) => {
    state.orientation = randomAngle();
  });
  updateRings();
});

backgroundColorInput.addEventListener("input", applyTheme);
ringColorInput.addEventListener("input", () => {
  applyTheme();
  updateRings();
});
sizeScaleInput.addEventListener("input", updateRings);
pxPerMmInput.addEventListener("input", updateRings);

applyTheme();
updateRings();
