let opt;
let cam;
let hex;
let face;

/**
 * Alias getElementById
 * @param {*} id the element id
 * @returns the element
 */
function eid(id) {
  return document.getElementById(id);
}

/**
 * Calculat the capsid T-number
 */
function tNumber() {
  const [h, k] = [opt.h, opt.k];
  eid("tnumber").innerHTML =
    "&nbsp;&nbsp;=&nbsp;" +
    `${h}<sup>2</sup>&nbsp;+&nbsp;` +
    `(${h})(${k})&nbsp;+&nbsp;` +
    `${k}<sup>2</sup><br>&nbsp;&nbsp;=&nbsp;` +
    `${h * h + h * k + k * k}`;
}

/**
 * Parse the color alpha value.
 * @param {*} value the value [0 255]
 * @returns the hex value
 */
function parseAlpha(value) {
  return Number(value).toString(16).padStart(2, "0");
}

/**
 * Export SVG.
 */
function exportSVG() {
  var link = document.createElement("a");
  link.download = "capsid.svg";
  link.href =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      paper.project.exportSVG({
        "options.bounds": "content",
        asString: true,
        "options.matchShapes": true,
      })
    );
  link.click();
}

/**
 * Update camera matrix.
 */
function updateCam() {
  ["θ", "ψ", "φ"].forEach((e) => {
    cam[e] = (parseFloat(eid(e).value) * Math.PI) / 180;
  });
  cam.update();
}

/**
 * Get the face monomer color.
 * @param {*} i the row index
 * @param {*} j the column
 * @param {*} k the color/alpha index [1, 2]
 * @returns the element
 */
function getMer(i, j, k) {
  return document.querySelector(
    `.tg > ` +
      `tbody:nth-child(2) > ` +
      `tr:nth-child(${i}) > ` +
      `td:nth-child(${j + 1}) > ` +
      `input:nth-child(${k})`
  );
}

/**
 * Get the options from UI.
 */
function getOpt() {
  opt = {
    h: parseInt(eid("h").value),
    k: parseInt(eid("k").value),
    ico: eid("ico").checked,
    net: eid("net").checked,
    levo: eid("levo").checked,
    dextro: eid("dextro").checked,
    R2: parseFloat(eid("R2").value),
    R3: parseFloat(eid("R3").value),
    F: parseFloat(eid("F").value),
    θ: (parseFloat(eid("θ").value) * Math.PI) / 180,
    ψ: (parseFloat(eid("ψ").value) * Math.PI) / 180,
    φ: (parseFloat(eid("φ").value) * Math.PI) / 180,
    interval: parseInt(eid("interval").value),
  };
}

/**
 * Get the style options for the face.
 * @returns the style object
 */
function getFaceStyle() {
  var style = {
    face: {
      strokeColor:
        eid("face.color").value + parseAlpha(eid("face.alpha").value),
      strokeWidth: parseFloat(eid("face.size").value),
    },
    levo: opt.levo,
  };
  for (var i = 1; i <= 3; i++) {
    style["hex.mer-" + i] = {
      fillColor: getMer(i, 1, 1).value + parseAlpha(getMer(i, 1, 2).value),
    };
    style["pen.mer-" + i] = {
      fillColor: getMer(i, 2, 1).value + parseAlpha(getMer(i, 2, 2).value),
    };
  }
  return style;
}

/**
 * Get the style for the icosahedron.
 * @returns the style object
 */
function getIcoStyle() {
  return {
    "fib.mer": {
      strokeColor: eid("fib.color").value + parseAlpha(eid("fib.alpha").value),
      strokeWidth: parseFloat(eid("fib.size").value),
    },
    "knb.mer": {
      R: parseFloat(eid("knb.size").value),
      style: {
        fillColor: eid("knb.color").value + parseAlpha(eid("knb.alpha").value),
      },
    },
  };
}
/**
 * Draw the hexagonal lattice unit.
 */
function drawHex() {
  switch (eid("geometry").value) {
    case "Hex":
      hex = new Hex(opt.R2);
      break;
    case "TriHex":
      hex = new TriHex(opt.R2);
      break;
    case "SnubHex":
      hex = new SnubHex(opt.R2);
      break;
    case "RhombiTriHex":
      hex = new RhombiTriHex(opt.R2);
      break;
    case "DualHex":
      hex = new Hex(opt.R2);
      break;
    case "DualTriHex":
      hex = new DualTriHex(opt.R2);
      break;
    case "DualSnubHex":
      hex = new DualSnubHex(opt.R2);
      break;
    case "DualRhombiTriHex":
      hex = new DualRhombiTriHex(opt.R2);
  }
}

/**
 * Draw the face.
 */
function drawFace() {
  face = hex.face(opt.h, opt.k, getFaceStyle());
}

/**
 * Update scene.
 */
function redraw() {
  project.clear();
  var obj;
  Array.from(document.getElementsByName("topology")).forEach((e) => {
    if (e.checked) {
      switch (e.value) {
        case "ico":
          obj = drawIco(face, opt.R3, opt.F, cam.P, getIcoStyle());
          break;
        case "net":
          obj = drawNet(face);
          break;
        case "face":
          drawFace();
          obj = face;
          break;
      }
    }
  });
  if (obj !== undefined) obj.position = view.center;
}

paper.install(window);

window.onload = function () {
  paper.setup("canvas");

  cam = new Camera();

  getOpt();

  // set event listeners for UI
  Object.keys(opt).forEach((e) => eid(e).addEventListener("change", getOpt));
  ["geometry", "R2"]
    .map(eid)
    .forEach((e) => e.addEventListener("change", drawHex));
  ["h", "k"].map(eid).forEach((e) => e.addEventListener("change", tNumber));
  ["h", "k", "geometry", "levo", "dextro", "R2"]
    .map(eid)
    .concat(Array.from(document.querySelectorAll("[id^='face.']")))
    .concat(Array.from(document.querySelectorAll(".tg > * > * > * > input")))
    .forEach((e) => e.addEventListener("change", drawFace));
  ["θ", "ψ", "φ"]
    .map(eid)
    .forEach((e) => e.addEventListener("change", updateCam));
  [
    "h",
    "k",
    "geometry",
    "levo",
    "dextro",
    "ico",
    "net",
    "face",
    "R2",
    "R3",
    "F",
    "θ",
    "ψ",
    "φ",
  ]
    .map(eid)
    .concat(Array.from(document.querySelectorAll("[id^='face.']")))
    .concat(Array.from(document.querySelectorAll("[id^='fib.']")))
    .concat(Array.from(document.querySelectorAll("[id^='knb.']")))
    .concat(Array.from(document.querySelectorAll(".tg > * > * > * > input")))
    .forEach((e) => e.addEventListener("change", redraw));
  eid("export").addEventListener("click", exportSVG);

  // update
  tNumber();
  drawHex();
  drawFace();
  redraw();

  // animate
  view.onFrame = function (event) {
    getOpt();
    if (opt.ico && event.count % opt.interval === 0) {
      updateCam();
      redraw();
    }
  };
};
