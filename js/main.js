let ftri;
let mobj;
let qr;

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function get_palette() {
    return [...this.document.querySelectorAll(".swatch")].map(
        (e) =>
            //
            e.children[0].value + parseInt(e.children[1].value).toString(16).padStart(2, "0"),
    );
}

function set_palette(name) {
    if (name !== "custom") {
        const inputs = [...document.querySelectorAll('#palette > .swatch > input[type="color"]')];
        const colors = chroma.scale(name).colors(inputs.length);
        inputs.forEach((e, i) => (e.value = colors[i] + "FF"));
    }
}

function get_params() {
    return Object.fromEntries(
        //
        [
            //
            ...[...document.querySelectorAll('[id^="param_"]')].map((e) => [e.id.split("_")[1], parse_number(e.value)]),
            ["palette", get_palette()],
        ],
    );
}

function calc_tile(model) {
    const key = document.getElementById("param_L").value;
    let tile;
    if (key === "snubhex") {
        tile = calc_snub_tile();
    } else if (key === "dualsnubhex") {
        tile = calc_flor_tile();
    } else {
        tile = model.calc_tile();
    }
    return tile.rotate(30);
}

function ico_preview(paper) {
    const P = get_params();
    const basis = [
        [2, 0],
        [1, SQRT3],
    ];
    const ck = ck_vectors(basis, P.h, P.k, P.H, P.K, P.t === "levo");
    const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][P.a](ck);
    const CAMERA = camera(...[P.θ, P.ψ, P.φ].map(radians));
    new paper.Group({
        //
        children: ico_coors.map((e) => new paper.Path.Circle({ center: mmul(CAMERA, e.mul(P.R).concat(1).T()), radius: 4, fillColor: "black" })),
        position: paper.view.center,
    });
}

function update_qr_code(papers, mode) {
    const qr_config = {
        width: 200,
        height: 200,
        type: "svg",
        data: document.getElementById("link").href,
        name: "qr-code.png",
        dotsOptions: {
            color: "#000000",
            type: "extra-rounded",
        },
        cornersSquareOptions: {
            type: "extra-rounded",
        },
    };
    if (mode !== "none") {
        const bytes = new TextEncoder().encode(papers[mode].project.exportSVG({ asString: true, bounds: "content" }));
        qr_config.image = `data:image/svg+xml;base64,${btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))}`;
    }
    qr = new QRCodeStyling(qr_config);
    const container = document.getElementById("qr-code-container");
    container.replaceChildren();
    qr.append(container);
}

function update_papers(papers, model, update_facets = true) {
    const P = get_params();

    // update kaleidoscope
    const tile = calc_tile(model);
    papers.kaleidoscope.activate();
    papers.kaleidoscope.project.clear();
    render_lattice(papers.kaleidoscope, tile).scale(model.mir.bounds.width / 2.6);

    // update model
    papers.model.activate();
    papers.model.project.clear();
    // expensive operation, check if necessary!
    if (update_facets) {
        ftri = render_facets(papers.model, tile.scale(P.R), P.P);
    }
    let error = false;
    if (document.getElementById("param_mode").value === "icosahedron") {
        try {
            mobj = render_capsid(papers.model, ftri);
        } catch (e) {
            error = e;
        }
    } else {
        const facets = ftri[0];
        facets.forEach((e) => (e.position = e.position.subtract(papers.model.view.center)));
        mobj = render_net(papers.model, facets);
        facets.forEach((e) => e.remove());
    }

    // update console
    if (error) {
        document.getElementById("console").value = error;
    } else {
        // calculate surface area
        const cfg = ico_config(P.a);
        const sa_exp = cfg.t_idx.map((e, i) => cfg.t_rep[i] * ftri[1][e - 1].area).reduce((a, b) => a + b);
        const sa_obs = mobj.children.map((e) => e.data.area).reduce((a, b) => a + b);
        // calculate T/Q-numbers
        const [h, k, H, K] = [P.h, P.k, P.H, P.K];
        // calculate state
        const L = this.document.getElementById("param_L").value;
        const [mir, ref, gen] = L.indexOf("snub") > -1 ? [NaN, NaN, NaN] : model.get_state();
        document.getElementById("console").value = [
            //
            `T=(${h})²+(${h})(${k})+(${k})²=${h * h + h * k + k * k}`,
            `Q=(${H})²+(${H})(${K})+(${K})²=${H * H + H * K + K * K}`,
            `sa_exp=${sa_exp.toFixed(3)}`,
            `sa_obs=${sa_obs.toFixed(3)}`,
            `sa_err=${(Math.abs(1 - sa_obs / sa_exp) * 100).toFixed(3)}%`,
            `tri.mir=[${mir}]`,
            `tri.ref=[${ref}]`,
            `tri.gen=[${Number.isNaN(gen) ? gen : gen.map((e) => e.toFixed(3))}]`,
        ].join("\r\n");
    }

    // update shareable link
    const href =
        location.protocol +
        "//" +
        location.host +
        location.pathname +
        "?" +
        new URLSearchParams({ ...get_params(), state: model.get_state(), palette: get_palette().map((e) => e.substring(1)) }).toString();
    document.getElementById("link").href = href;

    // update qr-code
    update_qr_code(papers, document.getElementById("qr-code-image").value);
}

function wythoff_model_init(papers) {
    const model = new Wythoff(
        //
        papers.wythoff.view.center,
        papers.wythoff.view.bounds.width / 2.6,
    ).construct(...Wythoff.constructions["hex"]);
    [...model.mir.children, ...model.ref.children].forEach((e) => {
        e.onClick = function (event) {
            this.data.selected = +!this.data.selected;
            this.strokeColor = this.data.selected ? model.color_on : model.color_off;
            update_papers(papers, model);
            document.getElementById("param_L").value = "custom";
        };
    });
    model.gen.onMouseDrag = function (event) {
        const nodes = model.mir.children.map((e) => [e.segments[0].point.x, e.segments[0].point.y]);
        const t = new paper.Path({ segments: nodes, closed: true, insert: false });
        model.set_generator(t.contains(event.point) ? event.point : t.getNearestPoint(event.point));
        papers.kaleidoscope.activate();
        papers.kaleidoscope.project.clear();
        render_lattice(papers.kaleidoscope, calc_tile(model)).scale(model.mir.bounds.width / 2.6);
        document.getElementById("param_L").value = "custom";
    };
    model.gen.onMouseUp = function (event) {
        papers.model.activate();
        papers.model.project.clear();
        update_papers(papers, model);
    };
    return model;
}

window.onload = function (opt) {
    // init color scale options
    ["custom", ...Object.keys(chroma.brewer).sort()].forEach((e) =>
        //
        document.getElementById("scale").add(new Option(e, e, e === "Viridis", e === "Viridis")),
    );

    // init lattice options
    ["custom", ...["dualsnubhex", "snubhex", ...Object.keys(Wythoff.constructions)].sort()].forEach((e) =>
        //
        document.getElementById("param_L").add(new Option(e, e, e === "hex", e === "hex")),
    );

    // init canvas papers
    const papers = Object.fromEntries(
        ["wythoff", "kaleidoscope", "model"].map((e) =>
            //
            [e, new paper.PaperScope().setup(document.getElementById(e))],
        ),
    );

    // init palette
    set_palette("viridis");

    // init wythoff model
    papers.wythoff.activate();
    let model = wythoff_model_init(papers);
    this.document.getElementById("param_L").addEventListener("input", (event) => {
        if (Wythoff.constructions.hasOwnProperty(event.target.value)) {
            papers.wythoff.activate();
            papers.wythoff.project.clear();
            model = wythoff_model_init(papers);
            model.construct(...Wythoff.constructions[event.target.value]);
            papers.model.activate();
            papers.model.project.clear();
        } else {
            papers.wythoff.activate();
            papers.wythoff.project.clear();
            let lines = null;
            if (event.target.value === "snubhex") lines = calc_snub_lines();
            else if (event.target.value === "dualsnubhex") lines = calc_flor_lines();
            if (lines !== null) {
                const tile = new paper.Group({
                    children: [
                        ...lines.map((e) => new paper.Path.Line({ from: e[0], to: e[1], insert: false, strokeColor: model.color_on })),
                        ...[...Wythoff.vec.cycle((e) => e.slice(1)), [[0, 0], [0, COS30].rot(-Math.PI / 3)], [[0, COS30].rot(-Math.PI / 3), [0.5, COS30]]].map(
                            (e) => new paper.Path.Line({ from: e[0], to: e[1], insert: false, strokeColor: model.color_off }),
                        ),
                    ],
                    position: papers.wythoff.view.center,
                    strokeWidth: 8,
                    strokeCap: "round",
                    strokeJoin: "round",
                });
                tile.scale(this.document.getElementById("wythoff").width);
            }
        }
    });

    // init param events
    this.document.getElementById("scale").addEventListener("input", (event) => {
        set_palette(event.target.value);
        update_papers(papers, model);
    });
    [...this.document.querySelectorAll('#palette > .swatch > input[type="color"]')].forEach((e) =>
        e.addEventListener("change", (event) => {
            this.document.getElementById("scale").value = "custom";
        }),
    );
    const doninput = debounce(update_papers, 250);
    document.querySelectorAll('[id^="param_"], .swatch > input').forEach((e) =>
        e.addEventListener("input", (event) =>
            //
            doninput(papers, model, e.id === "" || /[^tlθψφ]$/.test(e.id)),
        ),
    );
    this.document.getElementById("param_s").addEventListener(
        "input",
        (event) =>
            //
            (this.document.getElementById("display_s").innerText = (event.target.value * 100).toFixed(2).padStart(3, "0") + "%"),
    );
    this.document.getElementById("param_s").dispatchEvent(new Event("input", { bubbles: true }));
    this.document.getElementById("reverse").addEventListener("click", (event) => {
        [...this.document.querySelectorAll(".swatch")].reverse().map((e, i) => this.document.getElementById("palette").appendChild(e));
        update_papers(papers, model);
    });

    // init resize events
    const observer = new ResizeObserver((entries) => {
        entries.forEach((e) => {
            const size = e.devicePixelContentBoxSize[0];
            const paper = papers[e.target.querySelector("canvas").id];
            const item = paper.project.activeLayer;
            if (item !== null && size.inlineSize > 0 && size.blockSize > 0) {
                item.fitBounds(new paper.Size(size.inlineSize, size.blockSize).divide(2.5));
                item.position = paper.view.bounds.center;
            }
        });
    });
    [...document.getElementsByClassName("resize")].forEach((e) => observer.observe(e));

    this.document.getElementById("qr-code-image").addEventListener("change", (event) => update_qr_code(papers, event.target.value));

    // ico preview controller
    papers.model.activate();
    const tool = new paper.Tool();
    let drag = null;
    tool.onMouseDrag = function (event) {
        if (document.getElementById("param_mode").value === "icosahedron") {
            if (drag) {
                const delta = event.point.subtract(drag);
                document.getElementById("param_ψ").value = (parse_number(document.getElementById("param_ψ").value) + delta.x) % 360;
                document.getElementById("param_φ").value = (parse_number(document.getElementById("param_φ").value) - delta.y) % 360;
                papers.model.activate();
                papers.model.project.clear();
                ico_preview(papers.model);
            }
            drag = event.point;
        }
    };
    tool.onMouseUp = function (event) {
        if (document.getElementById("param_mode").value === "icosahedron") {
            drag = null;
            update_papers(papers, model, (update_facets = false));
        }
    };
    tool.activate();

    // download
    document.getElementById("download-btn").addEventListener("click", function () {
        let href = null;
        const fmt = document.getElementById("download-fmt").value;
        const mode = document.getElementById("param_mode").value;
        /****/ if (fmt === "model.svg") {
            href = "data:image/svg+xml;utf8," + encodeURIComponent(papers.model.project.exportSVG({ asString: true, bounds: "content", matchShapes: true }));
        } else if (fmt === "qr-code.svg") {
            qr.download({ name: "qr-code", extension: "svg" });
        } else if (fmt === "csv" || fmt === "tsv") {
            const [sep, mime] = fmt === "csv" ? [",", "csv"] : ["\t", "tab-separated-values"];
            let arr = [];
            if (mode === "icosahedron") {
                arr = mobj.children.map((e, i) =>
                    e.children
                        .filter((e) => e.closed)
                        .map((e, j) => e.data.segments_3D.map((e, k) => [...e, i + 1, j + 1, k + 1].join(sep)).join("\r\n"))
                        .join("\r\n"),
                );
            } else if (mode === "lattice") {
                arr = mobj.children.map((e, i) =>
                    e.children
                        .map((e, j) =>
                            //
                            e.children[0].segments.map((e, k) => [...p2c(e.point), i + 1, j + 1, k + 1].join(sep)).join("\r\n"),
                        )
                        .join("\r\n"),
                );
            }
            href = `data:text/${mime};charset=utf-8,` + encodeURIComponent([["x", "y", "z", "facet", "polygon", "segment"].join(sep)].concat(arr).join("\r\n"));
        } else if (fmt === "json") {
            let obj;
            if (mode === "icosahedron") {
                obj = mobj.children.map((e) => e.children.filter((e) => e.closed).map((e) => e.data.segments_3D));
            } else if (mode === "lattice") {
                obj = mobj.children.map((e) => e.children.map((e) => e.children[0].segments.map((e) => p2c(e.point))));
            }
            href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 4));
        } else if (fmt == "py") {
            let data;
            if (mode === "icosahedron") {
                data = mobj.children.map((e) => e.children.filter((e) => e.closed).map((e) => e.data.segments_3D));
            } else if (mode === "lattice") {
                data = mobj.children.map((e) => e.children.map((e) => e.children[0].segments.map((e) => p2c(e.point))));
            }
            href =
                "data:text/x-python;charset=utf-8," +
                encodeURIComponent(
                    [
                        ["import bpy"],
                        ["facets = " + JSON.stringify(data, null, 4)],
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
        } else if (fmt === "bib") {
            href =
                "data:text/x-bibtex;charset=utf-8," +
                encodeURI(
                    [
                        ["@misc{negronDemocapsid2026,"],
                        ["    title = {Democapsid},"],
                        ["    url = {http://arxiv.org/abs/2606.28969},"],
                        ["    doi = {10.48550/arXiv.2606.28969},"],
                        ["    urldate = {2026-06-30},"],
                        ["    publisher = {arXiv},"],
                        ["    author = {Negrón, Daniel Antonio and Luque, Antoni},"],
                        ["    month = jun,"],
                        ["    year = {2026},"],
                        ["    note = {arXiv:2606.28969 [q-bio.QM]"],
                        ["version: 1},"],
                        ["    keywords = {Quantitative Biology - Quantitative Methods},"],
                        ["}"],
                    ].join("\r\n"),
                );
        }
        if (href !== null) {
            const ele = document.getElementById("download-fmt");
            var link = document.createElement("a");
            link.download = ele.options[ele.selectedIndex].text;
            link.href = href;
            link.click();
        }
    });

    // get parameters
    const params = new URLSearchParams(window.location.search);
    if (params.size > 0) {
        // lattice/ico
        [...document.querySelectorAll('[id^="param_"]')].forEach((e) => {
            const tokens = e.id.split("_");
            const value = params.get(tokens[1]);
            if (value !== null) {
                e.value = value;
            }
        });
        // palette
        const palette = params.get("palette");
        if (palette !== null) {
            const colors = this.document.querySelectorAll(".swatch > input[type='color']");
            const alphas = this.document.querySelectorAll(".swatch > input[type='number']");
            palette.split(",").forEach((e, i) => {
                colors[i].value = "#" + e.substring(0, 6);
                alphas[i].value = parseInt(e.substring(6, 8), 16);
            });
        }
        // wythoff
        const state = params.get("state");
        if (state !== undefined) {
            const tokens = state.split(",");
            model.construct(
                tokens.slice(0, 3).map((e) => parseInt(e)),
                tokens.slice(3, 6).map((e) => parseInt(e)),
                tokens.slice(6, 8).map((e) => parseFloat(e)),
            );
        }
    }
};
