const construction = {
    hex: [0, 1, 0, 0, 0, 0, null],
    dualhex: [0, 1, 1, 0, 0, 0, null],
    trihex: [0, 0, 0, 0, 1, 1, [0, COS30]],
    dualtrihex: [0, 0, 1, 0, 0, 0, null],
    rhombitrihex: [0, 0, 0, 1, 1, 0, [1, Math.tan(Math.PI / 3)].mul((3.0 - SQRT3) / 4.0)],
    dualrhombitrihex: [1, 1, 0, 0, 0, 0, null],
    truncatedhex: [0, 1, 0, 0, 0, 1, [0.25, COS30]],
    triakistri: [1, 0, 1, 0, 0, 0, null],
    truncatedtrihex: [...[1, 0, 1, 0, 0, 0], [0, COS30].add([0.5, COS30].mul(COS30)).div(0.5 + COS30 + 1.0)],
    kisrhombille: [1, 1, 1, 0, 0, 0, null],
};

function parse_number(value) {
    return Number.isNaN((result = parseFloat(value))) ? value : result;
}

function get_params() {
    return Object.fromEntries(
        //
        [...document.querySelectorAll('[id^="param_"]')].map((e) => [e.id.split("_")[1], parse_number(e.value)]),
    );
}

function ico_preview(paper) {
    const P = get_params();
    const basis = [
        [2, 0],
        [1, SQRT3],
    ].map((e) => e.mul(15 * (SQRT3 / 2)));
    const ck = ck_vectors(basis, P.h, P.k, P.H, P.K, P.t === "levo");
    const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][P.a](ck);
    const CAMERA = camera(...[P.θ, P.ψ, P.φ].map(radians));
    const scale = 50 / Math.max(...ico_coors.flat());
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

function dooninputthing(papers, model) {
    [render_lattice, render_capsid].forEach((e, i) => {
        papers[i + 1].activate();
        papers[i + 1].project.clear();
        e(papers[i + 1], model);
    });
    papers[3].activate();
    papers[3].project.clear();
    ico_preview(papers[3]);
}

window.onload = function (opt) {
    // init color scale options
    Object.keys(chroma.brewer)
        .sort()
        .forEach((e) => document.getElementById("param_c").add(new Option(e, e, e === "Viridis", e === "Viridis")));
    // init lattice options
    ["custom", ...Object.keys(construction).sort()].forEach((e) =>
        //
        document.getElementById("param_L").add(new Option(e, e, e === "hex", e === "hex")),
    );

    // init canvas papers
    const papers = [0, 1, 2, 3].map((e) => new paper.PaperScope().setup(document.getElementById(`canvas${e}`)));

    // init model
    papers[0].activate();
    papers[0].project.clear();
    const model = new Wythoff(papers[0].view.center, 225).construct(...construction["hex"]);
    [...model.mir.children, ...model.ref.children].forEach((e) => {
        e.onClick = function (event) {
            this.data.selected = !this.data.selected;
            this.strokeColor = this.data.selected ? model.color_on : model.color_off;
            [render_lattice, render_capsid].forEach((e, i) => {
                papers[i + 1].activate();
                papers[i + 1].project.clear();
                e(papers[i + 1], model);
            });
            document.getElementById("param_L").value = "custom";
        };
    });
    model.gen.onMouseDrag = function (event) {
        const nodes = model.mir.children.map((e) => [e.segments[0].point.x, e.segments[0].point.y]);
        const t = new paper.Path({ segments: nodes, closed: true, insert: false });
        model.set_generator(t.contains(event.point) ? event.point : t.getNearestPoint(event.point));
        papers[1].activate();
        papers[1].project.clear();
        render_lattice(papers[1], model);
        document.getElementById("param_L").value = "custom";
    };
    model.gen.onMouseUp = function (event) {
        papers[2].activate();
        papers[2].project.clear();
        render_capsid(papers[2], model);
    };
    this.document.getElementById("param_L").addEventListener("input", (event) => {
        if (construction.hasOwnProperty(event.target.value)) {
            model.construct(...construction[event.target.value]);
            papers[1].activate();
            papers[1].project.clear();
            render_lattice(papers[1], model);
            papers[2].activate();
            papers[2].project.clear();
            render_capsid(papers[2], model);
        }
    });

    // init param events
    const doninput = debounce(dooninputthing, 100);
    document.querySelectorAll('[id^="param_"]').forEach((e) =>
        e.addEventListener("input", (event) => {
            doninput(papers, model);
        }),
    );

    // ico preview controller

    papers[3].activate();
    const tool = new paper.Tool();
    let drag = null;
    tool.onMouseDrag = function (event) {
        if (drag) {
            const delta = event.point.subtract(drag);
            document.getElementById("param_ψ").value = (parse_number(document.getElementById("param_ψ").value) + delta.x) % 360;
            document.getElementById("param_φ").value = (parse_number(document.getElementById("param_φ").value) + delta.y) % 360;
            papers[3].activate();
            papers[3].project.clear();
            ico_preview(papers[3]);
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
                [papers[2].project.exportSVG({ asString: true })],
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
    dooninputthing(papers, model);
};
