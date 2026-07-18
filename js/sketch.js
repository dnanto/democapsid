const COS30 = Math.cos((Math.PI / 180) * 30);

class Wythoff {
    // TODO: add styling options/functions

    #vec = [
        [0, 0],
        [0, COS30],
        [0.5, COS30],
    ];
    color_on = "#000000FF";
    color_off = "#00000055";

    constructor(ctr, scale, insert = true) {
        this.scale = scale;
        this.mir = new paper.Group({
            children: this.#vec.cycle().map(
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
            insert: insert,
        }).scale(scale);
        this.gen = new paper.Path.Circle({
            position: this.mir.children
                .map((e) => e.segments[0].point)
                .reduce((a, b) => a.add(b))
                .divide(3),
            radius: 8,
            fillColor: "blue",
            insert: insert,
        });
        this.ref = new paper.Group({
            children: [
                // ...this.mir.children.map(
                //     (e) =>
                //         new paper.Path.Line({
                //             from: this.gen.position,
                //             to: e.getNearestPoint(this.gen.position),
                //         }),
                // ),
                ...this.snubs().map(
                    (e) =>
                        new paper.Path.Line({
                            from: this.mir.bounds.topLeft.add(this.snub632().mul(this.scale)),
                            to: this.mir.bounds.topLeft.add(e.mul(this.scale)),
                        }),
                ),
            ],
            strokeWidth: 8,
            strokeColor: this.color_off,
            strokeCap: "round",
            strokeJoin: "round",
            insert: insert,
        });
        this.mir.bringToFront();
        this.gen.bringToFront();
    }

    snub632() {
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

    snubs() {
        const p = this.snub632();
        const q = [
            //
            p.add([0, COS30].sub(p).rot(Math.PI / 3)),
            [0, COS30],
            ...[1, 2, 3].map((e) => p.add([0, COS30].sub(p).rot((-e * Math.PI) / 3))),
        ];
        return [
            //
            intersection(p, q[0], [0, 0], [0, COS30]),
            q[1],
            intersection(p, q[2], [0, COS30], [0.5, COS30]),
            intersection(p, q[3], [0, 0], [0.5, COS30]),
            intersection(p, q[4], [0, 0], [0.5, COS30]),
        ];
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

    calc_fundamental_triangle() {
        // bounds
        const [width, height, topleft] = [this.mir.bounds.width, this.mir.bounds.height, this.mir.bounds.topLeft];
        // generator point (project to fundamental triangle with #vec coordinates)
        const gen = [((this.gen.position.x - topleft.x) / width) * 0.5, ((this.gen.position.y - topleft.y) / height) * COS30];
        // reflections
        const ref = [[0, gen[1]], [gen[0], COS30], gen.proj(this.#vec[2])];
        // mirror segments
        const mir = [0, 1, 2].map((e, i) => [
            [this.#vec[i], ref[i]],
            [ref[i], this.#vec[(i + 1) % 3]],
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
        const ft = this.calc_fundamental_triangle();
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

const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
});

function hash_point(point) {
    return `[${formatter.format(point[0])}, ${formatter.format(point[1])}]`;
}

function congruent_polygon_id(path) {
    return [
        path
            .map((e) => new paper.Point(e))
            .cycle()
            .map((e) => e[0].subtract(e[1]).getAngle(e[2].subtract(e[1])))
            .sort((a, b) => a - b)
            .map((e) => formatter.format(e))
            .join(","),
        formatter.format(path.shoelace()),
    ].join("_");
}

function render_lattice(paper, model, P = get_params()) {
    const R = model.mir.bounds.width / SQRT3 / 2;
    const basis = [
        [2, 0],
        [1, SQRT3],
    ].map((e) => e.mul(R * (SQRT3 / 2)));
    const tile = model.calc_tile().scale(R).rotate(30);

    // ck
    const ck = ck_vectors(basis, 1, 0, 1, 0, true);
    const grid = Array.from(tile_grid(ck, basis)).slice(1, -1);
    const lattice = new paper.Group({
        children: grid.map((e) => {
            const x = tile.clone();
            x.position = e.coor;
            return x;
        }),
        position: paper.view.center,
        strokeColor: "black",
    });
    const paths = new Graph((hasher = (e) => `[${formatter.format(e.x)}, ${formatter.format(e.y)}]`))
        .add_edges(lattice.children.flatMap((e) => e.children).map((e) => [e.segments[0].point, e.segments[1].point]))
        .polygonize()
        .sort((a, b) => b.shoelace() - a.shoelace())
        .map(
            (e) =>
                new paper.Path({
                    segments: e,
                    strokeWidth: 1,
                    strokeCap: "round",
                    strokeJoin: "round",
                    strokeColor: "black",
                    closed: true,
                    data: {
                        key: congruent_polygon_id(e),
                    },
                }),
        );
    const keys = [...new Set(paths.map((e) => e.data.key))];
    const vals = chroma.scale(P.c).colors(keys.length);
    const colors = new Map(keys.map((e, i) => [e, vals[i]]));
    // console.log(colors);
    paths.forEach((e) => (e.fillColor = colors.get(e.data.key)));
    lattice.bringToFront();

    return lattice;
}

function render_capsid(paper, model, P = get_params()) {
    const ctr = [paper.view.center.x, paper.view.center.y];

    const R = P.R;
    const basis = [
        [2, 0],
        [1, SQRT3],
    ].map((e) => e.mul(R * (SQRT3 / 2)));
    const tile = model.calc_tile().scale(R).rotate(30);

    const ck = ck_vectors(basis, P.h, P.k, P.H, P.K, P.t === "levo");
    const grid = Array.from(tile_grid(ck, basis));

    const lattice = new paper.Group({
        children: grid.map((e) => {
            const x = tile.clone();
            x.position = e.coor;
            return x;
        }),
        strokeColor: "black",
    }).translate(ctr);
    const paths = new Graph((hasher = (e) => `[${formatter.format(e.x)}, ${formatter.format(e.y)}]`))
        .add_edges(lattice.children.flatMap((e) => e.children).map((e) => [e.segments[0].point, e.segments[1].point]))
        .polygonize()
        .sort((a, b) => b.shoelace() - a.shoelace())
        .map(
            (e) =>
                new paper.Path({
                    segments: e,
                    strokeWidth: 1,
                    strokeCap: "round",
                    strokeJoin: "round",
                    strokeColor: "black",
                    closed: true,
                    data: {
                        key: congruent_polygon_id(e, 5),
                    },
                }),
        );
    if (P.c) {
        const keys = [...new Set(paths.map((e) => e.data.key))];
        const vals = chroma.scale(P.c).colors(keys.length);
        const colors = new Map(keys.map((e, i) => [e, vals[i]]));
        paths.forEach((e) => (e.fillColor = colors.get(e.data.key) + "DD"));
    }

    const triangles = [
        [3, 0],
        [0, 1],
        [1, 2],
    ]
        .map((e) => [ck[e[0]], ck[e[1]]].map((e) => e.add(ctr)))
        .map(
            (e) =>
                new paper.Path({
                    //
                    segments: [ctr, ...e],
                    closed: true,
                    insert: false,
                    data: { vectors: [ctr, ...e] },
                }),
        );

    const facets = triangles.map(
        (e) =>
            new paper.Group(
                paths
                    .map((f) => {
                        const x = f.intersect(e);
                        x.data.centroid = x.segments.map((e) => [e.x, e.y]).centroid();
                        return x;
                    })
                    .filter((e) => e.segments.length),
            ),
    );
    paths.forEach((e) => e.remove());

    lattice.remove();

    // coordinates
    const ico_cfg = ico_config(P.a);
    const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][P.a](ck, ITER, TOL);

    // transform
    const th = (2 * Math.PI) / P.a;
    const is_equilateral = P.h == P.H && P.k == P.K;
    const inflater = is_equilateral ? (e) => spherize(e, ico_coors[0].norm(), P.s) : (e) => cylinderize(e, ico_coors, P.a, P.s);
    // const CAMERA = camera(...[PARAMS.θ, PARAMS.ψ, PARAMS.φ].map(radians));
    const CAMERA = camera(...[P.θ, P.ψ, P.φ].map(radians));
    let results = [];
    for (let idx = 0, id = 0; idx < ico_cfg.t_idx.length; idx++) {
        const facet = facets[ico_cfg.t_idx[idx] - 1];
        const trr = triangles[ico_cfg.t_idx[idx] - 1];
        const A = inv3(T(trr.data.vectors.map((e) => e.concat(1))));
        const V = [0, 1, 2].map((e) => ico_coors[ico_cfg.v_idx[idx][e]]);
        for (let i = 0; i < ico_cfg.t_rep[idx]; i++, id++) {
            const X = V.map((e) => e.roro([0, 0, 1], i * th));
            const M = mmul(T(X), A);
            const xfacet = facet.children.map((e) => {
                const segments = e.segments
                    .map((f) => [f.point.x, f.point.y, 1])
                    .map((f) => mmul(M, f.T()).flat()) // map to face of icosahedron
                    .map((e) => inflater(e)) // spherize
                    .map((e) => mmul(CAMERA, e.concat(1).T()).flat()); // camera projection
                const centroid = mmul(
                    CAMERA,
                    inflater(mmul(M, [e.data.centroid.x, e.data.centroid.y, 1].T()).flat())
                        .concat(1)
                        .T(),
                ).flat();
                return new paper.Path({
                    segments: segments.map((f) => f.slice(0, 2)),
                    closed: e.closed,
                    data: Object.assign({}, e.data, {
                        id: id,
                        centroid: centroid,
                        segments_3D: segments,
                        normal: segments[1].sub(segments[0]).cross(segments[2].sub(segments[0])).uvec(),
                    }),
                    style: e.style,
                });
            });
            results = results.concat(new paper.Group({ children: xfacet, data: { type: "facet", centroid: mmul(CAMERA, inflater(X.centroid()).concat(1).T()).flat() } }));
        }
    }
    facets.forEach((e) => e.remove());
    // painter's algorithm
    results.sort((a, b) => a.data.centroid[2] - b.data.centroid[2]);

    return new paper.Group({ children: results, position: paper.view.center, strokeColor: "black" });
}
