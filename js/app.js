let opt;
let cam;
let hex;
let ico;

/**
 * Alias getElementById
 * @param {*} id the element id
 * @returns the element
 */
function eid(id) {
    return document.getElementById(id);
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
 * Get the options from UI.
 */
function getOpt() {
    opt = {
        h: parseInt(eid("h").value),
        k: parseInt(eid("k").value),
        H: parseInt(eid("H").value),
        K: parseInt(eid("K").value),
        R2: parseFloat(eid("R2").value),
        R3: parseFloat(eid("R3").value),
        F: parseFloat(eid("F").value),
        θ: radians(parseFloat(eid("θ").value)),
        ψ: radians(parseFloat(eid("ψ").value)),
        φ: radians(parseFloat(eid("φ").value)),
        rotation: eid("rotation").value,
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
            strokeColor: eid("face.color").value + parseAlpha(eid("face.alpha").value),
            strokeWidth: parseFloat(eid("face.size").value),
        },
        levo: eid("rotation").value === "levo",
    };
    for (var i = 1; i <= 3; i++) {
        style["hex.mer-" + i] = {
            fillColor: eid("hex.color-" + i).value + parseAlpha(eid("hex.alpha-" + i).value),
        };
        style["pen.mer-" + i] = {
            fillColor: eid("pen.color-" + i).value + parseAlpha(eid("pen.alpha-" + i).value),
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
 * Update camera matrix.
 */
function updateCam() {
    ["θ", "ψ", "φ"].forEach((e) => {
        cam[e] = radians(parseFloat(eid(e).value));
    });
    cam.update();
}

/**
 * Set the projection.
 */
function setProjection(name) {
    const b = 1 / (2 * phi);
    eid("θ").value = 0;
    eid("ψ").value = 0;
    eid("φ").value = 0;
    switch (name) {
        case "Face-1":
            // TODO: algebraic construction
            eid("θ").value = 60;
            eid("φ").value = 10.8123169636;
            break;
        case "Face-2":
            // TODO: algebraic construction
            eid("φ").value = 100.8123169636;
            break;
        case "Edge-1":
            eid("φ").value = degrees(Math.atan2(b, 0.5));
            break;
        case "Edge-2":
            eid("θ").value = 90;
            eid("φ").value = degrees(Math.atan2(b, 0.5));
            break;
        case "Vertex-1":
            eid("φ").value = 90;
            break;
        case "Vertex-2":
            // default
            break;
    }
    updateCam();
}

/**
 * Set the projection from event.
 */
function setProjectionEvent(ele) {
    setProjection(ele.target.value);
}

function updateIco() {
    if (eid("symmetry").value === "equilateral") {
        ico.setEdges(opt.R3, opt.R3, -radians(60));
    } else {
        const face = drawFace();
        const pa = pointReduce(face.children[1].children, (a, b) => (a.y > b.y ? a : b));
        const pb = face.children[0].bounds.bottomRight;
        const pc = face.children[0].bounds.bottomLeft;
        const C = angle(pc, pa, pb);
        const B = angle(pb, pa, pc);
        const A = radians(180) - B - C;
        ico.setEdges(opt.R3, (opt.R3 * Math.sin(B)) / Math.sin(A), -C);
        face.remove();
    }
}

/**
 * Draw the hexagonal lattice unit.
 */
function drawHex() {
    switch (eid("geometry").value) {
        case "Hex":
            hex = new Hex(opt.h, opt.k, opt.H, opt.K);
            break;
        case "TriHex":
            hex = new TriHex(opt.h, opt.k, opt.H, opt.K);
            break;
        case "SnubHex":
            hex = new SnubHex(opt.h, opt.k, opt.H, opt.K);
            break;
        case "RhombiTriHex":
            hex = new RhombiTriHex(opt.h, opt.k, opt.H, opt.K);
            break;
        case "DualHex":
            hex = new DualHex(opt.h, opt.k, opt.H, opt.K);
            break;
        case "DualTriHex":
            hex = new DualTriHex(opt.h, opt.k, opt.H, opt.K);
            break;
        case "DualSnubHex":
            hex = new DualSnubHex(opt.h, opt.k, opt.H, opt.K);
            break;
        case "DualRhombiTriHex":
            hex = new DualRhombiTriHex(opt.h, opt.k, opt.H, opt.K);
    }
}

/**
 * Draw the face.
 */
function drawFace() {
    var face;
    if (eid("symmetry").value === "equilateral") {
        face = hex.face(getFaceStyle());
        face = new Group([face, face.clone().rotate(60, face.bounds.bottomLeft)]);
    } else {
        face = hex.face5(getFaceStyle());
    }
    return face;
}

/**
 * Update scene.
 */
function redraw() {
    project.clear();

    tNumber();
    qNumber();
    updateCam();

    var obj;
    var face = drawFace();
    switch (eid("mode").value) {
        case "ico":
            if (eid("symmetry").value === "equilateral") {
                obj = drawIco(face, ico, opt.F, cam.P, getIcoStyle());
            } else {
                // NOTE: not sure why scale(-1, 1) is necessary here, need to refactor, etc...
                obj = drawIco(face.scale(-1, 1), ico, opt.F, cam.P, getIcoStyle());
                obj.scale(-1, 1);
            }
            break;
        case "net":
            obj = drawNet(face).scale(opt.R2);
            break;
        case "face":
            obj = drawFace().scale(opt.R2);
            break;
    }
    obj.position = view.center;
    face.remove();
}

/**
 * Calculate the capsid T-number
 */
function tNumber() {
    const [h, k] = [opt.h, opt.k];
    eid("tnumber").innerHTML = `=&nbsp;${h}<sup>2</sup>&nbsp;+&nbsp;(${h})(${k})&nbsp;+&nbsp;${k}<sup>2</sup>&nbsp=&nbsp${h * h + h * k + k * k}`;
}

function qNumber() {
    const [h, k, H, K] = [opt.h, opt.k, opt.H, opt.K];
    eid("qnumber").innerHTML = `=&nbsp;${H}<sup>2</sup>&nbsp;+&nbsp;(${H})(${K})&nbsp;+&nbsp;${K}<sup>2</sup>&nbsp=&nbsp${h * H + h * K + k * K}`;
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

paper.install(window);

window.onload = function () {
    paper.setup("canvas");

    cam = new Camera();

    // set event listeners for UI
    ["h", "k", "H", "K", "geometry", "R2"].map(eid).forEach((e) => e.addEventListener("change", drawHex));
    eid("projection").addEventListener("change", setProjectionEvent);
    ["h", "k", "H", "K"].map(eid).forEach((e) => e.addEventListener("change", tNumber));
    ["h", "k", "H", "K", "geometry", "symmetry", "rotation", "R2"]
        .map(eid)
        .concat(Array.from(document.querySelectorAll("[id^='face.']")))
        .concat(Array.from(document.querySelectorAll("[id^='hex.']")))
        .concat(Array.from(document.querySelectorAll("[id^='pen.']")))
        .forEach((e) => e.addEventListener("change", drawFace));
    ["θ", "ψ", "φ"].map(eid).forEach((e) => e.addEventListener("change", updateCam));
    ["h", "k", "H", "K", "symmetry", "rotation", "R3", "F"].map(eid).forEach((e) => e.addEventListener("change", updateIco));
    ["h", "k", "H", "K", "geometry", "projection", "rotation", "mode", "symmetry", "R2", "R3", "F", "θ", "ψ", "φ"]
        .map(eid)
        .concat(Array.from(document.querySelectorAll("[id^='face.']")))
        .concat(Array.from(document.querySelectorAll("[id^='fib.']")))
        .concat(Array.from(document.querySelectorAll("[id^='knb.']")))
        .concat(Array.from(document.querySelectorAll("[id^='hex.']")))
        .concat(Array.from(document.querySelectorAll("[id^='pen.']")))
        .forEach((e) => e.addEventListener("change", redraw));
    eid("export").addEventListener("click", exportSVG);

    //init
    getOpt();
    setProjection(eid("projection").value);
    ico = new Icosahedron(opt.R3);

    // draw
    drawHex();
    drawFace();
    updateIco();
    redraw();

    // animate
    view.onFrame = function (event) {
        getOpt();
        if (eid("mode").value === "ico" && event.count % opt.interval === 0) {
            ["θ", "ψ", "φ"].map(eid).forEach((e) => (e.value = parseFloat(e.value) + 1));
            redraw();
        }
    };
};
