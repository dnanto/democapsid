/*!
 * democapsid v2.2.4 - Render viral capsids in the browser and export SVG.
 * MIT License
 * Copyright (c) 2020 <=, Daniel Antonio Negrón (dnanto/remaindeer)
 */

const DRAW_MODES = {
    lattice: draw_lattice,
    facets: draw_facets,
    net: draw_net,
    capsid: draw_capsid,
};

const PARSERS = {
    color: (e) => e.value,
    alpha: (e) => Number(e.value).toString(16).padStart(2, "0"),
    toggle: (e) => e.checked,
    size: (e) => parseFloat(e.value),
    length: (e) => parseFloat(e.value),
};

const DEFAULTS = Object.assign(
    {},
    {
        h: (e) => parseInt(e.value),
        k: (e) => parseInt(e.value),
        H: (e) => parseInt(e.value),
        K: (e) => parseInt(e.value),
        a: (e) => parseInt(e.value),
        R: (e) => parseFloat(e.value),
        L: (e) => e.value,
        s: (e) => parseInt(e.value) / 1000,
        l: PARSERS.toggle,
        d: PARSERS.toggle,
        θ: (e) => parseFloat(e.value),
        ψ: (e) => parseFloat(e.value),
        φ: (e) => parseFloat(e.value),
    },
    Object.fromEntries([
        ...Object.keys(DRAW_MODES).map((e) => ["mode_" + e, PARSERS.toggle]),
        ...["penton_fiber", "knob", "facet"].map((e) => [e + "_toggle", PARSERS.toggle]),
        ...["line", "fiber", "knob"].flatMap((e) => ["color", "alpha", "size"].map((f) => [e + "_" + f, PARSERS[f]])),
        ...["color", "alpha", "size", "length"].map((e) => ["fiber_" + e, PARSERS[e]]),
        ...["color", "alpha", "toggle"].flatMap((e) => Array.from({ length: 6 }, (_, i) => ["mer_" + e + "_" + (i + 1), PARSERS[e]])),
    ]),
);

function params() {
    const PARAMS = Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, DEFAULTS[k](document.getElementById(k))]));
    PARAMS.t = PARAMS.l;
    return PARAMS;
}

function params_to_tag(PARAMS) {
    return [
        PARAMS.h,
        PARAMS.k,
        PARAMS.H,
        PARAMS.K,
        "a=" + PARAMS.a,
        "L=" + PARAMS.L,
        `s=${(PARAMS.s * 100).toFixed(2)}%`,
        "t=" + (PARAMS.t ? "levo" : "dextro"),
        "@(" + [PARAMS.θ, PARAMS.ψ, PARAMS.φ].map((e) => e + "°").join(",") + ")",
    ].join(",");
}

function download(e) {
    const PARAMS = params();
    const mode = Object.keys(DRAW_MODES).find((e) => PARAMS["mode_" + e]);
    const draw = DRAW_MODES[mode];
    let name = ["h", "k", "H", "K", "a", "L", "s", "t"].map((k) => PARAMS[k]);
    name[6] = name[6].toFixed(2);
    name = mode + "[" + name.join("_") + "]";
    const ext = e.target.id.split("_")[1];
    // only care about facet outline for SVG...

    let href;
    if (ext === "svg") {
        href =
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
                paper.project.exportSVG({
                    "options.bounds": "content",
                    asString: true,
                    "options.matchShapes": true,
                }),
            );
    } else {
        const g = draw(Object.assign({}, PARAMS, { facet_toggle: ext === "svg" ? PARAMS.facet_toggle : true }));
        /****/ if (ext === "csv" || ext === "tsv") {
            const sep = ext === "csv" ? "," : "\t";
            const mime = ext === "csv" ? "csv" : "tab-separated-values";
            const coordinates = PARAMS.mode_capsid
                ? g.children.filter((e) => e.data.type === "facet").flatMap((e, i) => e.children.flatMap((f, j) => f.data.segments_3D.map((g, k) => [...g, i + 1, j + 1, k + 1].join(sep))))
                : g.children.flatMap((e, i) => e.children.flatMap((f, j) => f.segments.map((g, k) => [g.point.x, g.point.y, 1, i + 1, j + 1, k + 1].join(sep))));
            href = `data:text/${mime};charset=utf-8,` + encodeURIComponent([["x", "y", "z", "facet", "polygon", "segment"].join(sep)].concat(coordinates).join("\r\n"));
        } else if (ext === "json") {
            href =
                "data:application/json;charset=utf-8," +
                encodeURIComponent(
                    JSON.stringify(
                        g.children
                            .filter((e) => e.data.type === "facet" || !PARAMS.mode_capsid)
                            .map((e) => e.children.map((f) => (!PARAMS.mode_capsid ? f.segments.map((e) => [e.point.x, e.point.y, 1]) : f.data.segments_3D))),
                        null,
                        4,
                    ),
                );
        } else if (ext === "py") {
            const data = JSON.stringify(
                g.children
                    .filter((e) => e.data.type === "facet" || !PARAMS.mode_capsid)
                    .map((e) => e.children.map((f) => (!PARAMS.mode_capsid ? f.segments.map((e) => [e.point.x, e.point.y, 1]) : f.data.segments_3D))),
                null,
                4,
            );
            href =
                "data:text/x-python;charset=utf-8," +
                encodeURIComponent(
                    [
                        ["import bpy"],
                        ["facets = " + data],
                        ["n = 1"],
                        ["for i, facet in enumerate(facets, start = 1):"],
                        ['    collection = bpy.data.collections.new(f"facet-{i}")'],
                        ["    bpy.context.scene.collection.children.link(collection)"],
                        ["    for j, polygon in enumerate(facet, start = 1):"],
                        ['        mesh = bpy.data.meshes.new(name=f"polygon_msh-{n}")'],
                        ["        mesh.from_pydata(polygon, [], [list(range(len(polygon)))])"],
                        ["        mesh.validate(verbose=True)"],
                        ['        obj = bpy.data.objects.new(f"polygon_obj-{n}", mesh)'],
                        ["        collection.objects.link(obj)"],
                        ["        n += 1"],
                    ].join("\r\n"),
                );
        }
        g.remove();
    }

    var link = document.createElement("a");
    link.download = name + "." + ext;
    link.href = href;
    link.click();
}

function update() {
    paper.clear();
    paper.setup("view");
    const PARAMS = params();
    const msg = document.getElementById("msg");
    const mode = Object.keys(DRAW_MODES).find((e) => PARAMS["mode_" + e]);
    try {
        document.getElementById("view_title").innerText = mode;
        DRAW_MODES[mode](PARAMS);
        const [h, k, H, K] = ["h", "k", "H", "K"].map((e) => PARAMS[e]);
        msg.children[1].innerText = [
            `${mode}[${params_to_tag(PARAMS)}]`,
            `model_sa_error=${model_sa_error(PARAMS) * 100}%`,
            `T-Number=(${h})²+(${h})(${k})+(${k})²=${h * h + h * k + k * k}`,
            `Q-Number=(${H})²+(${H})(${K})+(${K})²=${H * H + H * K + K * K}`,
        ].join("\n");
    } catch (e) {
        console.log(e);
        paper.clear();
        const canvas = document.getElementById("view");
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        msg.children[1].innerText = e;
    }
}

window.onload = function (opt) {
    // register events
    Object.keys(DEFAULTS).forEach((e) => document.getElementById(e).addEventListener("change", update));
    document.getElementById("normalize").addEventListener("click", () => {
        const L = this.document.getElementById("L2").value;
        const R = this.document.getElementById("R2").value;
        const obj = params();
        const ratio = ck_vectors(calc_tile(obj.L, obj.R).basis, 1, 0, 0, 0)[0].norm() / ck_vectors(calc_tile(L, R).basis, 1, 0, 0, 0)[0].norm();
        const ele = document.getElementById("R");
        ele.value = obj.R / ratio;
        ele.dispatchEvent(new Event("change", { bubbles: true }));
    });
    [("svg", "csv", "tsv", "json", "py")].forEach((e) => document.getElementById("download_" + e).addEventListener("click", download));
    const greek = ["θ", "ψ", "φ"];
    const latin = ["theta", "psi", "phi"];
    document.getElementById("show_link").addEventListener("click", () => {
        const obj = params();
        greek.forEach((e, i) => {
            obj[latin[i]] = obj[e];
            delete obj[e];
        });
        link_value.innerText = location.protocol + "//" + location.host + location.pathname + "?data=" + btoa(JSON.stringify(obj));
        document.getElementById("link_dialog").showModal();
    });
    document.getElementById("link_close").addEventListener("click", () => document.getElementById("link_dialog").close());
    document.getElementById("show_citation").addEventListener("click", () => document.getElementById("citation").showModal());
    document.getElementById("close_citation").addEventListener("click", () => document.getElementById("citation").close());
    // read query parameters
    let query = new URLSearchParams(document.location.search);
    if (query.has("data")) {
        query = Object.entries(JSON.parse(atob(query.get("data"))));
    }
    query.forEach((v, k) => {
        let [K, V] = Array.isArray(v) ? v : [k, v];
        const i = latin.indexOf(K);
        K = i > -1 ? greek[i] : K;
        if (K in DEFAULTS) {
            /**/ if (K.includes("color")) document.getElementById(K).value = (V.startsWith("#") ? "" : "#") + V;
            else if (K.includes("alpha")) document.getElementById(K).value = parseInt(V, 16);
            else if (K.includes("toggle")) document.getElementById(K).checked = V === true;
            else if (K.includes("mode")) document.getElementById(K).checked = V === true;
            else if (K === "s") document.getElementById(K).value = 1000 * V;
            else document.getElementById(K).value = V;
        }
    });
    update();
};
