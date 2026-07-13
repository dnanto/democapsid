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

window.onload = function (opt) {
    Object.keys(chroma.brewer).forEach((e) => document.getElementById("param_c").add(new Option(e, e, e === "Viridis", e === "Viridis")));

    const papers = [0, 1, 2].map((e) => new paper.PaperScope().setup(document.getElementById(`view${e}`)));

    // move to init function vvvvv
    papers[0].activate();
    papers[0].project.clear();
    const scale = 300;
    const ctr = papers[0].view.center;
    const model = new Model(ctr, scale);
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

    document.querySelectorAll('[id^="param_"]').forEach((e) =>
        e.addEventListener("input", (event) => {
            [render_lattice, render_capsid].forEach((e, i) => {
                papers[i + 1].activate();
                papers[i + 1].project.clear();
                e(papers[i + 1], model);
            });
        }),
    );

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
};
