function parse_number(value) {
    return Number.isNaN((result = parseFloat(value))) ? value : result;
}

function set_palette(name) {
    if (name !== "custom") {
        const inputs = [...document.querySelectorAll('.swatch > input[type="color"]')];
        const colors = chroma.scale(name).colors(inputs.length);
        inputs.forEach((e, i) => (e.value = colors[i] + "FF"));
    }
}

function get_palette() {
    return [...this.document.querySelectorAll(".swatch")].map(
        (e) =>
            //
            e.children[0].value + parseInt(e.children[1].value).toString(16),
    );
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

function ico_preview(paper) {
    const P = get_params();
    const basis = [
        [2, 0],
        [1, SQRT3],
    ];
    const ck = ck_vectors(basis, P.h, P.k, P.H, P.K, P.t === "levo");
    const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][P.a](ck);
    const CAMERA = camera(...[P.θ, P.ψ, P.φ].map(radians));
    const scale = paper.view.bounds.width / (2.0 * Math.max(...ico_coors.flat()));
    new paper.Group({
        //
        children: ico_coors.map((e) => new paper.Path.Circle({ center: mmul(CAMERA, e.mul(scale).concat(1).T()), radius: 4, fillColor: "black" })),
        position: paper.view.center,
    });
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function get_tile(model) {
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

function update_papers(papers, model) {
    papers.kaleidoscope.activate();
    papers.kaleidoscope.project.clear();
    render_lattice(papers.kaleidoscope, get_tile(model)).scale(model.mir.bounds.width / 3.25);
    papers.model.activate();
    papers.model.project.clear();
    render_capsid(papers.model, get_tile(model).scale(get_params().R));
}

window.onload = function (opt) {
    // init color scale options
    ["custom", ...Object.keys(chroma.brewer).sort()].forEach((e) =>
        //
        document.getElementById("scale").add(new Option(e, e, e === "Viridis", e === "Viridis")),
    );
    // init lattice options
    ["custom", ...["dualsnubhex", "snubhex", ...Object.keys(constructions)].sort()].forEach((e) =>
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

    // init model
    papers.wythoff.activate();
    papers.wythoff.project.clear();
    const model = new Wythoff(papers.wythoff.view.center, papers.wythoff.view.bounds.width / COS30).construct(...constructions["hex"]);
    [...model.mir.children, ...model.ref.children].forEach((e) => {
        e.onClick = function (event) {
            this.data.selected = !this.data.selected;
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
        render_lattice(papers.kaleidoscope, get_tile(model)).scale(model.mir.bounds.width / 3.25);
        document.getElementById("param_L").value = "custom";
    };
    model.gen.onMouseUp = function (event) {
        papers.model.activate();
        papers.model.project.clear();
        render_capsid(papers.model, get_tile(model).scale(get_params().R));
    };
    this.document.getElementById("param_L").addEventListener("input", (event) => {
        if (constructions.hasOwnProperty(event.target.value)) {
            model.construct(...constructions[event.target.value]);
            papers.model.activate();
            papers.model.project.clear();
        }
    });

    // init param events
    this.document.getElementById("scale").addEventListener("input", (event) => {
        set_palette(event.target.value);
        update_papers(papers, model);
    });
    [...this.document.querySelectorAll('.swatch > input[type="color"]')].forEach((e) =>
        e.addEventListener("change", (event) => {
            this.document.getElementById("scale").value = "custom";
        }),
    );
    const doninput = debounce(update_papers, 250);
    document.querySelectorAll('[id^="param_"], .swatch > input').forEach((e) =>
        e.addEventListener("input", (event) => {
            doninput(papers, model);
        }),
    );

    // ico preview controller
    papers.model.activate();
    const tool = new paper.Tool();
    let drag = null;
    tool.onMouseDrag = function (event) {
        if (drag) {
            const delta = event.point.subtract(drag);
            document.getElementById("param_ψ").value = (parse_number(document.getElementById("param_ψ").value) + delta.x) % 360;
            document.getElementById("param_φ").value = (parse_number(document.getElementById("param_φ").value) + delta.y) % 360;
            papers.model.activate();
            papers.model.project.clear();
            ico_preview(papers.model);
        }
        drag = event.point;
    };
    tool.onMouseUp = function (event) {
        drag = null;
        document.getElementById("param_θ").dispatchEvent(new Event("input", { bubbles: true }));
    };
    tool.activate();

    // download
    document.getElementById("download-btn").addEventListener("click", function () {
        var link = document.createElement("a");
        link.href = URL.createObjectURL(
            new Blob(
                //
                [papers.model.project.exportSVG({ asString: true })],
                { type: "image/svg+xml;charset=utf-8" },
            ),
        );
        link.download = "my-paperjs-project.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    });

    // init each canvas
    update_papers(papers, model);
};
