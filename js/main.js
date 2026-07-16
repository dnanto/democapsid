function parse_number(value) {
    const result = parseFloat(value);
    return Number.isNaN(result) ? value : result;
}

function get_params() {
    return Object.fromEntries(
        //
        [...document.querySelectorAll('[id^="param_"]')].map((e) => [e.id.split("_")[1], parse_number(e.value)]),
    );
}

function icontrol(paper) {
    const P = get_params();
    const basis = [
        [2, 0],
        [1, SQRT3],
    ].map((e) => e.mul(15 * (SQRT3 / 2)));
    const ck = ck_vectors(basis, P.h, P.k, P.H, P.K, P.t === "levo");
    const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][P.a](ck);
    const CAMERA = camera(...[P.θ, P.ψ, P.φ].map(radians));
    new paper.Group({
        //
        children: ico_coors.map((e) => new paper.Path.Circle({ center: mmul(CAMERA, e.concat(1).T()), radius: 5, fillColor: "black" })),
        position: paper.view.center,
    });
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function oninput(papers, model) {
    [render_lattice, render_capsid].forEach((e, i) => {
        papers[i + 1].activate();
        papers[i + 1].project.clear();
        e(papers[i + 1], model);
    });
    papers[3].activate();
    papers[3].project.clear();
    icontrol(papers[3]);
}

window.onload = function (opt) {
    Object.keys(chroma.brewer)
        .sort()
        .forEach((e) => document.getElementById("param_c").add(new Option(e, e, e === "Viridis", e === "Viridis")));

    const papers = [0, 1, 2, 3].map((e) => new paper.PaperScope().setup(document.getElementById(`canvas${e}`)));

    // move to init function vvvvv

    papers[0].activate();
    papers[0].project.clear();
    const model = new Model(papers[0].view.center, 225);

    [...model.mir.children, ...model.ref.children].forEach((e) => {
        e.data.selected = true;
        e.onClick = function (event) {
            this.data.selected = !this.data.selected;
            this.strokeColor = this.data.selected ? "black" : "red";
            [render_lattice, render_capsid].forEach((e, i) => {
                papers[i + 1].activate();
                papers[i + 1].project.clear();
                e(papers[i + 1], model);
            });
        };
    });
    model.gen.onMouseDrag = function (event) {
        const nodes = model.mir.children.map((e) => [e.segments[0].point.x, e.segments[0].point.y]);
        const t = new paper.Path({ segments: nodes, closed: true, insert: false });
        model.set_generator(t.contains(event.point) ? event.point : t.getNearestPoint(event.point));
        papers[1].activate();
        papers[1].project.clear();
        render_lattice(papers[1], model);
    };
    model.gen.onMouseUp = function (event) {
        papers[2].activate();
        papers[2].project.clear();
        render_capsid(papers[2], model);
    };
    //                       ^^^^^

    const doninput = debounce(oninput, 100);
    document.querySelectorAll('[id^="param_"]').forEach((e) =>
        e.addEventListener("input", (event) => {
            doninput(papers, model);
        }),
    );

    papers[3].activate();
    icontrol(papers[3]);

    this.document.getElementById("param_θ").addEventListener("input", (event) => {
        papers[3].activate();
        papers[3].project.clear();
        icontrol(papers[3]);
    });

    // 2. Create the tool
    const tool = new paper.Tool();
    // 3. Define interactions for this specific project
    let drag = null;
    tool.onMouseDrag = function (event) {
        if (drag) {
            const delta = event.point.subtract(drag);
            document.getElementById("param_ψ").value = (parse_number(document.getElementById("param_ψ").value) + delta.x) % 360;
            document.getElementById("param_φ").value = (parse_number(document.getElementById("param_φ").value) + delta.y) % 360;
            papers[3].activate();
            papers[3].project.clear();
            icontrol(papers[3]);
        }
        drag = event.point;
    };
    tool.onMouseUp = function (event) {
        drag = null;
        document.getElementById("param_θ").dispatchEvent(new Event("input", { bubbles: true }));
    };
    tool.activate();

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

    [render_lattice, render_capsid].forEach((e, i) => {
        papers[i + 1].activate();
        papers[i + 1].project.clear();
        e(papers[i + 1], model);
    });
};
