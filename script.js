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
const buildInfo = document.getElementById("buildInfo");

const cardStates = [];
const ORIENTATIONS = [0, 90, 180, 270];

const randomAngle = () => ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)];
const normalizeToCardinal = (angle) => {
  const normalized = ((Number(angle) % 360) + 360) % 360;
  const snapped = Math.round(normalized / 90) * 90;
  return snapped % 360;
};

const applyTheme = () => {
  document.documentElement.style.setProperty("--bg", backgroundColorInput.value);
  document.documentElement.style.setProperty("--ring", ringColorInput.value);
};

const toPx = (mm, pxPerMm, scale) => mm * pxPerMm * scale;

function drawLandoltRing(state, color, orientation, outerPx) {
  const { canvas, card } = state;
  const ctx = canvas.getContext("2d");
  const padding = Math.max(12, outerPx * 0.35);
  const size = Math.ceil(outerPx + padding * 2);

  canvas.width = size;
  canvas.height = size;

  // 視力0.1などの大きい環でも規定サイズを縮小しない（縦横比は正方形固定）
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const unit = outerPx / 5;
  card.style.width = `${Math.max(260, size + 36)}px`;
  const outerRadius = outerPx / 2;
  const innerRadius = (outerPx * 3) / 10;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((orientation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  // 切れ目の縁で黒が残らないよう、destination-out の塗りで余裕を持って除去する
  const gapBleed = Math.max(2, outerPx * 0.015);
  const gapStartX = cx + innerRadius - gapBleed;
  const gapStartY = cy - unit / 2 - gapBleed;
  const gapWidth = outerRadius - innerRadius + padding + gapBleed * 2;
  const gapHeight = unit + gapBleed * 2;

  ctx.beginPath();
  ctx.rect(gapStartX, gapStartY, gapWidth, gapHeight);
  ctx.fill();

  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}


function updateBuildInfo() {
  if (!buildInfo) return;
  const now = new Date();
  buildInfo.textContent = `最終描画時刻: ${now.toLocaleString("ja-JP")}`;
}

function updateRings() {
  const rawScale = Number(sizeScaleInput.value);
  const rawPxPerMm = Number(pxPerMmInput.value);
  const scale = Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 1;
  const pxPerMm = Number.isFinite(rawPxPerMm) && rawPxPerMm > 0 ? rawPxPerMm : 3.78;
  const ringColor = ringColorInput.value;

  sizeValueLabel.textContent = `${scale.toFixed(1)}x`;

  updateBuildInfo();

  cardStates.forEach((state) => {
    const outerMm = OUTER_MM_FOR_1_0 / state.acuity;
    const outerPx = toPx(outerMm, pxPerMm, scale);

    drawLandoltRing(state, ringColor, state.orientation, outerPx);

    state.meta.textContent = `外径 ${outerMm.toFixed(2)} mm（${outerPx.toFixed(1)} px） / 切れ目幅 ${
      (outerMm / 5).toFixed(2)
    } mm`;
  });
}

function setOrientation(state, angle) {
  state.orientation = normalizeToCardinal(angle);
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
    card,
    canvas,
    meta,
    orientation: normalizeToCardinal(randomAngle()),
  };

  title.textContent = `視力 ${acuity.toFixed(1)}`;

  button.addEventListener("click", () => {
    setOrientation(state, randomAngle());
  });

  cardStates.push(state);
  chart.appendChild(card);
});

randomizeAllButton.addEventListener("click", () => {
  updateBuildInfo();

  cardStates.forEach((state) => {
    state.orientation = normalizeToCardinal(randomAngle());
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
