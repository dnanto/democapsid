let opt;
let cam;
let hex;
let face;
let ico;
let fib;

/**
 * Alias getElementById
 * @param {*} id the element id
 * @returns the element
 */
function eid(id) {
    return document.getElementById(id);
}

/**
 * Calculate the capsid T-number
 */
function tNumber() {
    const [h, k] = [opt.h, opt.k];
    eid("tnumber").innerHTML = `=&nbsp;${h}<sup>2</sup>&nbsp;+&nbsp;(${h})(${k})&nbsp;+&nbsp;${k}<sup>2</sup>&nbsp=&nbsp${h * h + h * k + k * k}`;
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
        cam[e] = radians(parseFloat(eid(e).value));
    });
    cam.update();
}

/**
 * Get the options from UI.
 */
function getOpt() {
    opt = {
        h: parseInt(eid("h").value),
        k: parseInt(eid("k").value),
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
 * Set the projection.
 */
function setProjection(name) {
    const b = 1 / (2 * phi);
    eid("θ").value = 0;
    eid("ψ").value = 0;
    eid("φ").value = 0;
    switch (name) {
        case "Face-1":
            eid("φ").value = 90 - degrees(Math.atan2((b + 0.5 + 0.5) / 3, 0.5 / 3)) + 90;
            break;
        case "Face-2":
            eid("φ").value = 90 - degrees(Math.atan2((b + 0.5 + 0.5) / 3, 0.5 / 3));
            break;
        case "Edge-1":
            eid("ψ").value = 90;
            break;
        case "Edge-2":
            // default
            break;
        case "Vertex-1":
            eid("φ").value = degrees(Math.atan2(b, 0.5));
            break;
        case "Vertex-2":
            eid("φ").value = 90 - degrees(Math.atan2(b, 0.5));
            break;
    }
    updateCam();
}

function pyth(a, b, C) {
    return Math.sqrt(b * b + a * a - 2 * b * a * Math.cos(C));
}

function foo(G, cmp) {
    return G.flatMap((e) => {
        return e.segments.map((f) => {
            return f.point;
        });
    }).reduce((a, b) => {
        return a.y < b.y ? b : a;
    });
}

function updateIco() {
    if (eid("symmetry").value === "equilateral") {
        ico.setEdge(opt.R3, opt.R3, -radians(60));
        fib.setEdge(opt.F);
    } else {
        const pa = foo(face.children[1].children, (a, b) => (a.y > b.y ? a : b));
        const pb = face.children[0].bounds.bottomRight;
        const pc = face.children[0].bounds.bottomLeft;
        const C = angle(pc, pa, pb);
        const B = angle(pb, pa, pc);
        const A = radians(180) - B - C;
        const a = opt.R3;
        const b = (a * Math.sin(B)) / Math.sin(A);
        const c = (a * Math.sin(C)) / Math.sin(A);
        console.log(a, b, c, degrees(A), degrees(B), degrees(C));
        ico.setEdge(a, b, -C);
        fib.setEdge(opt.F, (opt.F * Math.sin(B)) / Math.sin(A), C);
    }
}

/**
 * Set the projection from event.
 */
function setProjectionEvent(ele) {
    setProjection(ele.target.value);
}

/**
 * Draw the hexagonal lattice unit.
 */
function drawHex() {
    switch (eid("geometry").value) {
        case "Hex":
            hex = new Hex(opt.R2, opt.h, opt.k, opt.K);
            break;
        case "TriHex":
            hex = new TriHex(opt.R2, opt.h, opt.k, opt.K);
            break;
        case "SnubHex":
            hex = new SnubHex(opt.R2, opt.h, opt.k, opt.K);
            break;
        case "RhombiTriHex":
            hex = new RhombiTriHex(opt.R2, opt.h, opt.k, opt.K);
            break;
        case "DualHex":
            hex = new Hex(opt.R2, opt.h, opt.k, opt.K);
            break;
        case "DualTriHex":
            hex = new DualTriHex(opt.R2, opt.h, opt.k, opt.K);
            break;
        case "DualSnubHex":
            hex = new DualSnubHex(opt.R2, opt.h, opt.k, opt.K);
            break;
        case "DualRhombiTriHex":
            hex = new DualRhombiTriHex(opt.R2, opt.h, opt.k, opt.K);
    }
}

/**
 * Draw the face.
 */
function drawFace() {
    console.log(eid("symmetry").value);
    face =
        eid("symmetry").value === "equilateral" //
            ? hex.face(getFaceStyle())
            : hex.face5(getFaceStyle());
}

/**
 * Update scene.
 */
function redraw() {
    project.clear();

    tNumber();
    updateCam();

    var obj;
    switch (eid("mode").value) {
        case "ico":
            obj =
                eid("symmetry").value === "equilateral" //
                    ? drawIco(face, ico, fib, cam.P, getIcoStyle())
                    : drawIco5(face, ico, fib, cam.P, getIcoStyle());
            break;
        case "net":
            obj =
                eid("symmetry").value === "equilateral" //
                    ? drawNet(face)
                    : drawNet5(face);
            break;
        case "face":
            drawFace();
            obj = face;
            break;
    }
    obj.position = view.center;
}

paper.install(window);

window.onload = function () {
    paper.setup("canvas");

    cam = new Camera();

    // set event listeners for UI
    ["h", "k", "K", "geometry", "R2"].map(eid).forEach((e) => e.addEventListener("change", drawHex));
    eid("projection").addEventListener("change", setProjectionEvent);
    ["h", "k", "K"].map(eid).forEach((e) => e.addEventListener("change", tNumber));
    ["h", "k", "K", "geometry", "symmetry", "rotation", "R2"]
        .map(eid)
        .concat(Array.from(document.querySelectorAll("[id^='face.']")))
        .concat(Array.from(document.querySelectorAll("[id^='hex.']")))
        .concat(Array.from(document.querySelectorAll("[id^='pen.']")))
        .forEach((e) => e.addEventListener("change", drawFace));
    ["θ", "ψ", "φ"].map(eid).forEach((e) => e.addEventListener("change", updateCam));
    ["h", "k", "K", "symmetry", "rotation", "R3", "F"].map(eid).forEach((e) => e.addEventListener("change", updateIco));
    ["h", "k", "K", "geometry", "projection", "rotation", "mode", "symmetry", "R2", "R3", "F", "θ", "ψ", "φ"]
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
    fib = new Icosahedron(opt.F);

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
