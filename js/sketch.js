const COS30 = Math.cos((Math.PI / 180) * 30);
const ft_vec = [
    [0, 0],
    [0, COS30],
    [0.5, COS30],
];

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

function ft_reflect_update(ft_gen, ft_mir, ft_ref) {
    ft_ref.children.slice(0, 3).forEach((e, i) => (e.segments[0].point = ft_gen));
    ft_ref.children[0].segments[1].point.y = ft_gen.y;
    ft_ref.children[1].segments[1].point.x = ft_gen.x;
    ft_ref.children[2].segments[1].point = ft_mir.children[2].getNearestPoint(ft_gen);
}

function p2a(point) {
    return [point.x, point.y];
}

function l2v(child) {
    return child.segments[1].point.subtract(child.segments[0].point);
}

function render(papers, ft, R = 1) {
    const r = (R * SQRT3) / 2;
    const basis = [
        [2 * r, 0],
        [r, SQRT3 * r],
    ];

    // calculate the tile based on the fundamental triangle
    const tile = new paper.Group({
        children: [
            // rotate fundamental triangle within hexagon
            ...Array.from({ length: 6 }, (_, i) => ft.clone().rotate(i * 60, [0, 0])),
            // rotate fundamental triangle within hexagon, then flip
            ...new paper.Group(Array.from({ length: 6 }, (_, i) => ft.clone().rotate(i * 60, [0, 0]))).scale(1, -1).children,
        ].flatMap((e) => e.children),
        insert: false,
    })
        .scale(R)
        .rotate(30);

    // calculate preview lattice
    {
        papers[1].activate();
        papers[1].project.clear();
        // ck
        const ck = ck_vectors(basis, 1, 0, 1, 0, "levo");
        const grid = Array.from(tile_grid(ck, basis)).slice(1, -1);
        const lattice = new paper.Group({
            children: grid.map((e) => {
                const x = tile.clone();
                x.position = e.coor;
                return x;
            }),
            position: papers[1].view.center,
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
        const vals = chroma.scale("viridis").colors(keys.length).reverse();
        const colors = new Map(keys.map((e, i) => [e, vals[i]]));
        // console.log(colors);
        paths.forEach((e) => (e.fillColor = colors.get(e.data.key)));
        lattice.bringToFront();
    }

    {
        papers[2].activate();
        papers[2].project.clear();

        const ctr = [papers[2].view.center.x, papers[2].view.center.y];

        const [h, k, H, K, t] = [1, 0, 1, 0, "levo"];
        const ck = ck_vectors(basis, h, k, H, K, t);
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
        const keys = [...new Set(paths.map((e) => e.data.key))];
        const vals = chroma.scale("viridis").colors(keys.length).reverse();
        const colors = new Map(keys.map((e, i) => [e, vals[i]]));
        paths.forEach((e) => (e.fillColor = colors.get(e.data.key)));

        const triangles = [
            [3, 0],
            [0, 1],
            [1, 2],
        ]
            .map((e) => [ck[e[0]], ck[e[1]]].map((e) => e.add(ctr)))
            .map((e) => new paper.Path({ segments: [ctr, ...e], closed: true, strokeColor: "red", insert: false, data: { vectors: [ctr, ...e] } }));

        const facets = triangles.map(
            (e) =>
                new paper.Group(
                    paths
                        .map((f) => {
                            const x = f.intersect(e);
                            x.data.centroid = x.segments.map(p2a).centroid();
                            return x;
                        })
                        .filter((e) => e.segments.length),
                ),
        );
        facets.strokeColor = "black";
        paths.forEach((e) => e.remove());

        lattice.remove();

        // coordinates
        const PARAMS = { a: 5, s: 0, θ: 0, ψ: 0, φ: 0 };
        const ico_cfg = ico_config(PARAMS.a);
        const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][PARAMS.a](ck, ITER, TOL);

        // transform
        const th = (2 * Math.PI) / PARAMS.a;
        const is_equilateral = h == H && k == K;
        const inflater = is_equilateral ? (e) => spherize(e, ico_coors[0].norm(), PARAMS.s) : (e) => cylinderize(e, ico_coors, PARAMS.a, PARAMS.s);
        const CAMERA = camera(...[PARAMS.θ, PARAMS.ψ, PARAMS.φ].map(radians));
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
        new paper.Group({ children: results, position: papers[2].view.center });
    }
}

function ft_input(papers) {
    papers[0].activate();

    const scale = 300;
    const ctr = papers[0].view.center;
    const ft_mir = new paper.Group({
        children: ft_vec.cycle().map((e) => new paper.Path.Line({ from: e[1], to: e[2] })),
        position: ctr,
        strokeWidth: 8,
        strokeColor: "black",
        strokeCap: "round",
        strokeJoin: "round",
        closed: true,
    }).scale(scale);
    const ft_gen = new paper.Path.Circle({
        position: ft_mir.children
            .map((e) => e.segments[0].point)
            .reduce((a, b) => a.add(b))
            .divide(3),
        radius: 8,
        fillColor: "blue",
    });
    const ft_ref = new paper.Group({
        children: ft_mir.children.map((e) => new paper.Path.Line({ from: ft_gen.position, to: e.getNearestPoint(ft_gen.position) })),
        strokeWidth: 8,
        strokeColor: "black",
        strokeCap: "round",
        strokeJoin: "round",
    });

    update = function (event) {
        ft_reflect_update(ft_gen.position, ft_mir, ft_ref);
        const [width, height, topleft] = [ft_mir.bounds.width, ft_mir.bounds.height, ft_mir.bounds.topLeft];
        const g = ft_gen.position;
        const p = [((g.x - topleft.x) / width) * 0.5, ((g.y - topleft.y) / height) * COS30];
        const x = [[0, p[1]], [p[0], COS30], p.proj(ft_vec[2])];
        const k = [0, 1, 2].map((e, i) => [
            [ft_vec[i], x[i]],
            [x[i], ft_vec[(i + 1) % 3]],
        ]);
        const edges = [
            //
            ...x.filter((_, i) => ft_ref.children[i].data.selected).map((e) => [p, e]),
            ...k.filter((_, i) => ft_mir.children[i].data.selected).flat(),
        ].filter((e) => e[1].sub(e[0]).norm() > Number.EPSILON);

        const vals = chroma.scale("viridis").colors(edges.length);
        const ft = new paper.Group([...edges.map((e, i) => new paper.Path.Line({ from: e[0], to: e[1] }))]);
        render(papers, ft, ft_mir.bounds.width / SQRT3 / 2);
        ft.remove();
    };

    [...ft_mir.children, ...ft_ref.children].forEach((e) => {
        e.data.selected = true;
        e.onClick = function (event) {
            this.data.selected = !this.data.selected;
            this.strokeColor = this.data.selected ? "black" : "red";
            update(event);
        };
    });
    ft_gen.onMouseDrag = function (event) {
        const nodes = ft_mir.children.map((e) => [e.segments[0].point.x, e.segments[0].point.y]);
        const t = new paper.Path({ segments: nodes, closed: true, insert: false });
        ft_gen.position = t.contains(event.point) ? event.point : t.getNearestPoint(event.point);
        update(event);
    };
    update(ft_gen.position);
    ft_mir.bringToFront();
    ft_gen.bringToFront();
}
