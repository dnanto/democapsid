let opt;
let cam = new Camera();
let hex;
let face;

function eid(id) {
    return document.getElementById(id);
}

function tNumber() {
    const [h, k] = [opt.h, opt.k];
    eid("tnumber").innerHTML = "" +
        "&nbsp;&nbsp;=&nbsp;" +
        `${h}<sup>2</sup>&nbsp;+&nbsp;` +
        `(${h})(${k})&nbsp;+&nbsp;` +
        `${k}<sup>2</sup><br>&nbsp;&nbsp;=&nbsp;` +
        `${h * h + h * k + k * k}`;
}

function parseAlpha(value) {
    return Number(value).toString(16).padStart(2, "0");
}

function exportSVG() {
    var link = document.createElement("a");
    link.download = "capsid.svg";
    link.href = "" +
        "data:image/svg+xml;utf8," +
        encodeURIComponent(paper.project.exportSVG({
            "options.bounds": "content",
            asString: true,
            "options.matchShapes": true
        }));
    link.click();
}

function updateCam() {
    ["θ", "ψ", "φ"].forEach(e => { cam[e] = parseFloat(eid(e).value); });
    cam.update();
}

function getMer(i, j, k) {
    return document.querySelector(
        `.tg > tbody:nth-child(2) > tr:nth-child(${i}) > td:nth-child(${j + 1}) > input:nth-child(${k})`
    )
}

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
        θ: parseFloat(eid("θ").value),
        ψ: parseFloat(eid("ψ").value),
        φ: parseFloat(eid("φ").value),
        interval: parseInt(eid("interval").value)
    };
}

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

function drawFace() {
    var style = {
        "face": {
            strokeColor: eid("line.color").value + parseAlpha(eid("line.alpha").value),
            strokeWidth: parseFloat(eid("line.size").value)
        },
        "levo": opt.levo
    }
    for (var i = 1; i <= 3; i++) {
        style["hex.mer-" + i] = {
            fillColor: getMer(i, 1, 1).value + parseAlpha(getMer(i, 1, 2).value),
        }
        style["pen.mer-" + i] = {
            fillColor: getMer(i, 2, 1).value + parseAlpha(getMer(i, 2, 2).value),
        }
    }
    face = hex.face(opt.h, opt.k, style);
}

function redraw(ele) {
    project.clear();
    var obj;
    Array.from(document.getElementsByName("topology")).forEach(e => {
        if (e.checked) {
            switch (e.value) {
                case "ico":
                    obj = drawIco(face, opt.R3, cam.P);
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

    getOpt();

    Object.keys(opt).forEach(e =>
        eid(e).addEventListener("change", getOpt)
    );

    ["geometry", "R2"]
        .map(eid)
        .forEach(e => e.addEventListener("change", drawHex));
    ["h", "k"]
        .map(eid)
        .forEach(e => e.addEventListener("change", tNumber));
    ["h", "k", "geometry", "levo", "dextro", "R2"]
        .map(eid)
        .concat(Array.from(document.querySelectorAll("[id^='line']")))
        .concat(Array.from(document.querySelectorAll(".tg > * > * > * > input")))
        .forEach(e => e.addEventListener("change", drawFace));
    ["θ", "ψ", "φ"]
        .map(eid)
        .forEach(e => e.addEventListener("change", updateCam));
    ["h", "k", "geometry", "levo", "dextro", "ico", "net", "face", "R2", "R3", "θ", "ψ", "φ"]
        .map(eid).forEach(e => e.addEventListener("change", redraw));

    eid("export").addEventListener("click", exportSVG);

    tNumber();
    drawHex();
    drawFace();
    redraw();

    view.onFrame = function (event) {
        getOpt();
        if (opt.ico && event.count % opt.interval === 0) {
            ["θ", "ψ", "φ"].forEach(e => {
                eid(e).value = parseFloat(eid(e).value) + 0.05;
            });
            updateCam();
            redraw();
        };
    }
}
