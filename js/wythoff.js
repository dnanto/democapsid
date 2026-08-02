class Wythoff {
    static vec = [
        [0, 0],
        [0, COS30],
        [0.5, COS30],
    ];

    static constructions = {
        dualhex: [[0, 1, 1], [0, 0, 0], null],
        dualrhombitrihex: [[1, 1, 0], [0, 0, 0], null],
        dualtrihex: [[0, 0, 1], [0, 0, 0], null],
        hex: [[0, 1, 0], [0, 0, 0], null],
        kisrhombille: [[1, 1, 1], [0, 0, 0], null],
        rhombitrihex: [[0, 0, 0], [1, 1, 0], [1, Math.tan(Math.PI / 3)].mul((3.0 - SQRT3) / 4.0)],
        triakistri: [[1, 0, 1], [0, 0, 0], null],
        trihex: [
            [0, 0, 0],
            [0, 1, 1],
            [0, COS30],
        ],
        truncatedhex: [
            [0, 1, 0],
            [0, 0, 1],
            [0.25, COS30],
        ],
        truncatedtrihex: [[1, 0, 1], [0, 0, 0], [0, COS30].add([0.5, COS30].mul(COS30)).div(0.5 + COS30 + 1.0)],
    };

    color_on = "#000000FF";
    color_off = "#00000055";

    constructor(ctr, scale) {
        this.scale = scale;
        this.mir = new paper.Group({
            children: Wythoff.vec.cycle().map(
                (e) =>
                    new paper.Path.Line({
                        //
                        from: e[1],
                        to: e[2],
                    }),
            ),
            position: ctr,
            strokeWidth: 8,
            strokeColor: this.color_off,
            strokeCap: "round",
            strokeJoin: "round",
            closed: true,
        }).scale(scale);
        this.gen = new paper.Path.Circle({
            position: this.mir.children
                .map((e) => e.segments[0].point)
                .reduce((a, b) => a.add(b))
                .divide(3),
            radius: 8,
            fillColor: "blue",
        });
        this.ref = new paper.Group({
            children: [
                ...this.mir.children.map(
                    (e) =>
                        new paper.Path.Line({
                            from: this.gen.position,
                            to: e.getNearestPoint(this.gen.position),
                        }),
                ),
            ],
            strokeWidth: 8,
            strokeColor: this.color_off,
            strokeCap: "round",
            strokeJoin: "round",
        });
        this.mir.bringToFront();
        this.gen.bringToFront();
    }

    get_state() {
        return [
            //
            ...this.mir.children.map((e) => e.data.selected),
            ...this.ref.children.map((e) => e.data.selected),
            [this.gen.position.x, this.gen.position.y],
        ];
    }

    set_generator(position) {
        this.gen.position = position;
        this.ref.children.forEach((e, i) => {
            e.segments[0].point = this.gen.position;
            e.segments[1].point = this.mir.children[i].getNearestPoint(this.gen.position);
        });
        return this;
    }

    construct(mirrors, reflections, generator = null) {
        // mirrors
        mirrors.forEach((e, i) => {
            this.mir.children[i].data.selected = e;
            this.mir.children[i].strokeColor = e ? this.color_on : this.color_off;
        });
        // walls
        reflections.forEach((e, i) => {
            this.ref.children[i].data.selected = e;
            this.ref.children[i].strokeColor = e ? this.color_on : this.color_off;
        });
        if (generator) {
            this.set_generator(this.mir.bounds.topLeft.add(generator.mul(this.scale)));
        }
        return this;
    }

    calc_lines() {
        // bounds
        const [width, height, topleft] = [this.mir.bounds.width, this.mir.bounds.height, this.mir.bounds.topLeft];
        // generator point (project to fundamental triangle with vec coordinates)
        const gen = [((this.gen.position.x - topleft.x) / width) * 0.5, ((this.gen.position.y - topleft.y) / height) * COS30];
        // reflections
        const ref = [[0, gen[1]], [gen[0], COS30], gen.proj(Wythoff.vec[2])];
        // mirror segments
        const mir = Wythoff.vec.cycle().map((e, i) => [
            [e[1], ref[i]],
            [ref[i], e[2]],
        ]);
        // edge array, remove 0-lengths
        const edges = [
            //
            ...ref.filter((_, i) => this.ref.children[i].data.selected).map((e) => [gen, e]),
            ...mir.filter((_, i) => this.mir.children[i].data.selected).flat(),
        ].filter((e) => e[1].sub(e[0]).norm() > Number.EPSILON);
        return new paper.Group([...edges.map((e, i) => new paper.Path.Line({ from: e[0], to: e[1], insert: false }))]);
    }

    calc_tile() {
        const ft = this.calc_lines();
        return new paper.Group({
            children: [
                // rotate fundamental triangle within hexagon
                ...Array.from({ length: 6 }, (_, i) => ft.clone().rotate(i * 60, [0, 0])),
                // rotate fundamental triangle within hexagon, then flip
                ...new paper.Group(Array.from({ length: 6 }, (_, i) => ft.clone().rotate(i * 60, [0, 0]))).scale(1, -1).children,
            ].flatMap((e) => e.children),
            insert: false,
        });
    }
}

function snub632() {
    // https://www.shadertoy.com/view/dlsGRH
    // fermat point
    const pf = intersection([-0.75, COS30 / 2.0], [0.5, COS30], [1, 0], [0, COS30]);
    // reflect over side (y-axis)
    const q1 = [-pf[0], pf[1]];
    // project to hypotenuse then double to obtain reflection
    const q3 = pf.add(pf.proj([0.5, COS30]).sub(pf).mul(2.0));
    // snub point is at half the hypotenuse of the new right triangle (Thales's theorem)
    return q1.add(q3.sub(q1).div(2.0));
}

function calc_snub_lines() {
    const p = this.snub632();
    const q = [
        //
        p.add([0, COS30].sub(p).rot(Math.PI / 3)),
        [0, COS30],
        ...[1, 2, 3].map((e) =>
            p.add(
                [0, COS30]
                    .sub(p)
                    .rot(e * -(Math.PI / 3))
                    .mul(2), // to reach the other edge and calculate the intersection...
            ),
        ),
    ];
    return [
        //
        intersection(p, q[0], [0, 0], [0, COS30]),
        q[1],
        intersection(p, q[2], [0, COS30], [0.5, COS30]),
        intersection(p, q[3], [0.5, COS30], [0, COS30].rot(-Math.PI / 3)),
        intersection(p, q[4], [0, 0], [0, COS30].rot(-Math.PI / 3)),
    ].map((e) => [p, e]);
}

function calc_snub_tile() {
    const p = this.snub632();
    const q = [
        //
        p.add([0, COS30].sub(p).rot(Math.PI / 3)),
        [0, COS30],
        ...[1, 2, 3].map((e) =>
            p.add(
                [0, COS30]
                    .sub(p)
                    .rot(e * -(Math.PI / 3))
                    .mul(2), // to reach the other edge and calculate the intersection...
            ),
        ),
    ];
    const lines = new paper.Group(calc_snub_lines().map((e) => new paper.Path.Line({ from: e[0], to: e[1] })));
    return new paper.Group({
        children: Array.from({ length: 6 }, (_, i) => lines.clone().rotate(i * 60, [0, 0])).flatMap((e) => e.children),
    });
}

function calc_flor_lines() {
    const snub = this.snub632();
    const flor = [
        snub,
        ...[2, 3].map((e) =>
            snub.add(
                [0, COS30]
                    .sub(snub)
                    .mul(2)
                    .rot(e * -(Math.PI / 3)),
            ),
        ),
    ].centroid();
    return [[0, 0], [0.5, COS30], [0, COS30].rot(-Math.PI / 3)].map((e) => [flor, e]);
}

function calc_flor_tile() {
    const lines = new paper.Group(calc_flor_lines().map((e) => new paper.Path.Line({ from: e[0], to: e[1] })));
    return new paper.Group({
        children: Array.from({ length: 6 }, (_, i) => lines.clone().rotate(i * 60, [0, 0])).flatMap((e) => e.children),
        insert: false,
    });
}
