const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
});

function ck_vectors(basis, h, k, H, K, t) {
    const [v1, v2] = basis;
    const v3 = v2.rot(Math.PI / 3);
    if (t) {
        return [
            // levo
            v1.mul(h).add(v2.mul(k)),
            v2.mul(H).add(v3.mul(K)),
            v3.mul(h).add(v1.mul(-k)),
            v3.mul(-h).add(v1.mul(k)),
        ];
    } else {
        return [
            // dextro
            v1.mul(h).add(v3.mul(-k)),
            v2.mul(H).add(v1.mul(K)),
            v3.mul(h).add(v2.mul(k)),
            v1
                .mul(h)
                .add(v3.mul(-k))
                .rot(-Math.PI / 3),
        ];
    }
}

function* tile_grid(ck, basis) {
    const bounds = ck.map((e) => mmul(T(inv2(basis)), [e, 1].flat().T()).flat()).map((e) => e.map(Math.round));
    const [min_i, min_j, max_i, max_j] = [
        //
        ...[0, 1].map((_, i) => Math.min(...bounds.map((e) => e[i]))),
        ...[0, 1].map((_, i) => Math.max(...bounds.map((e) => e[i]))),
    ];
    for (let i = min_i; i < max_i + 1; i++) {
        for (let j = min_j; j < max_j + 1; j++) {
            yield { index: [i, j], coor: basis[0].mul(i).add(basis[1].mul(j)), is_vertex: bounds.has([i, j]) };
        }
    }
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

function path_overlaps(path1, path2) {
    return path1.curves.map((e) => {
        const [A, B] = [e.segment1.point, e.segment2.point];
        const AB = B.subtract(A);
        return path2.curves
            .map((f) => {
                const [C, D] = [f.segment1.point, f.segment2.point];
                return Math.abs(AB.cross(D.subtract(C))) < EPSILON && Math.abs(AB.cross(C.subtract(A))) < EPSILON;
            })
            .some((f) => f);
    });
}

function render_lattice(paper, tile, P = get_params()) {
    const basis = [
        [2, 0],
        [1, SQRT3],
    ].map((e) => e.mul(SQRT3 / 2));
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
                    closed: true,
                    data: {
                        key: congruent_polygon_id(e),
                    },
                }),
        );
    const keys = [...new Set(paths.map((e) => e.data.key))];
    const colors = new Map(keys.map((e, i) => [e, P.palette[i]]));
    paths.forEach((e) => (e.fillColor = colors.get(e.data.key)));
    return new paper.Group({
        children: [...paths, lattice],
        strokeCap: "round",
        strokeJoin: "round",
        strokeColor: P.palette.slice(-1)[0],
    });
}

function render_capsid(paper, tile, P = get_params()) {
    const ctr = [paper.view.center.x, paper.view.center.y];

    const R = P.R;
    const basis = [
        [2, 0],
        [1, SQRT3],
    ].map((e) => e.mul(R * (SQRT3 / 2)));
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
        .map((e) =>
            new paper.Path({
                segments: e,
                closed: true,
                data: {
                    key: congruent_polygon_id(e),
                },
            }).reduce(),
        );
    const keys = [...new Set(paths.map((e) => e.data.key))];
    const colors = new Map(keys.map((e, i) => [e, P.palette[i]]));
    paths.forEach((e) => (e.fillColor = colors.get(e.data.key)));

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

    console.time("facets");
    const facets = triangles.map(
        (e) =>
            new paper.Group(
                paths
                    .flatMap((f) => {
                        const result = f.intersect(e);
                        result.data.original = path_overlaps(result, f);
                        if (result instanceof paper.CompoundPath) {
                            // account for holes/islands
                            result.children.forEach((g) => (g.fillColor = f.fillColor));
                        }
                        return result instanceof paper.CompoundPath ? result.children : [result];
                    })
                    .map((f) => {
                        f.data.bordering = f.segments.map((g) => e.getNearestPoint(g.point).getDistance(g.point) < EPSILON);
                        const idx = new Set(
                            f.segments.map((g, i) => {
                                if (e.contains(g.point) || f.data.bordering[i]) {
                                    return i;
                                }
                            }),
                        );
                        f.segments = f.segments.filter((_, i) => idx.has(i));
                        f.data.original = (f.data.original ?? []).filter((_, i) => idx.has(i));
                        return f;
                    })
                    .filter((f) => f.segments.length > 2)
                    .flatMap((f) => {
                        f.data.centroid = f.segments.map((g) => [g.point.x, g.point.y]).centroid();
                        return new paper.Group([
                            f,
                            ...f.segments.cycle().map((g, i) => {
                                if (f.data.original[i]) {
                                    return new paper.Path.Line({
                                        from: g[1].point,
                                        to: g[2].point,
                                        strokeColor: P.palette.slice(-1)[0],
                                        strokeWidth: P.width,
                                        strokeCap: "round",
                                        strokeJoin: "round",
                                        data: { centroid: p2c(g[1].point.add(g[2].point).divide(2)) },
                                    });
                                }
                            }),
                        ]);
                    }),
            ),
    );
    console.timeEnd("facets");
    paths.forEach((e) => e.remove());
    lattice.remove();

    // coordinates
    const ico_cfg = ico_config(P.a);
    const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][P.a](ck, ITER, TOL);

    // transform
    const th = (2 * Math.PI) / P.a;
    const is_equilateral = P.h == P.H && P.k == P.K;
    const inflater = is_equilateral ? (e) => spherize(e, ico_coors[0].norm(), P.s) : (e) => cylinderize(e, ico_coors, P.a, P.s);
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
            const xfacet = facet.children.flatMap((e) => {
                return e.children.map((E) => {
                    const segments = E.segments
                        .map((f) => [f.point.x, f.point.y, 1])
                        .map((f) => mmul(M, f.T()).flat()) // map to face of icosahedron
                        .map((e) => inflater(e)) // spherize
                        .map((e) => mmul(CAMERA, e.concat(1).T()).flat()); // camera projection
                    const centroid = mmul(
                        CAMERA,
                        inflater(mmul(M, [...E.data.centroid, 1].T()).flat())
                            .concat(1)
                            .T(),
                    ).flat();
                    return new paper.Path({
                        segments: segments.map((f) => f.slice(0, 2)),
                        closed: E.closed,
                        data: Object.assign({}, E.data, {
                            id: id,
                            centroid: centroid,
                            segments_3D: segments,
                            normal: segments.length > 2 ? segments[1].sub(segments[0]).cross3(segments[2].sub(segments[0])).uvec() : [],
                        }),
                        style: E.style,
                    });
                });
            });
            results = results.concat(
                new paper.Group({
                    children: xfacet,
                    data: {
                        type: "facet",
                        centroid: mmul(CAMERA, inflater(X.centroid()).concat(1).T()).flat(),
                    },
                }),
            );
        }
    }
    facets.forEach((e) => e.remove());
    // painter's algorithm
    results.sort((a, b) => a.data.centroid[2] - b.data.centroid[2]);

    return new paper.Group({
        children: results,
        position: paper.view.center,
    });
}
