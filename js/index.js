const SQRT3 = Math.sqrt(3);
const SQRT5 = Math.sqrt(5);
const PHI = (1 + SQRT5) / 2;
const ITER = 100;
const TOL = 1e-15;
const TOL_COLLAPSE = 1e-5;

function degrees(v) {
    return (v * 180) / Math.PI;
}

function radians(v) {
    return (v * Math.PI) / 180;
}

function calc_tile(t, R) {
    const r = R * (SQRT3 / 2);
    let tile;
    /****/ if (t === "hex") {
        tile = {
            basis: [
                [2 * r, 0],
                [r, SQRT3 * r],
            ],
            tile: (e) => [
                new Path.RegularPolygon({
                    center: e.coor,
                    sides: 6,
                    radius: R,
                    data: { mer: 1 },
                }),
            ],
            radius: R,
        };
    } else if (t === "trihex") {
        tile = {
            basis: [
                [2 * R, 0],
                [R, R * SQRT3],
            ],
            tile: (e) => [
                new Path.RegularPolygon({
                    center: e.coor,
                    sides: 6,
                    radius: R,
                    data: { mer: 1 },
                }).rotate(30),
                ...Array.from({ length: 2 }, (_, i) =>
                    new Path.RegularPolygon({
                        center: e.coor.add([R, -(1 / 3) * r]),
                        sides: 3,
                        radius: (2 / 3) * r,
                        data: { mer: 2 },
                    })
                        .rotate(180)
                        .rotate(i * 60, e.coor)
                ),
            ],
            radius: 2 * r,
        };
    } else if (t === "snubhex") {
        tile = {
            basis: [
                [2.5 * R, r],
                [0.5 * R, 3 * r],
            ],
            tile: (e) => [
                new Path.RegularPolygon({
                    center: e.coor,
                    sides: 6,
                    radius: R,
                    data: { mer: 1 },
                }).rotate(30),
                ...Array.from({ length: 6 }, (_, i) =>
                    new Path.RegularPolygon({
                        center: e.coor.add([0, -r - (1 / 3) * r]),
                        sides: 3,
                        radius: (2 / 3) * r,
                        data: { mer: 2 },
                    }).rotate(i * 60, e.coor)
                ),
                new Path.RegularPolygon({
                    center: e.coor.add([1.5 * R, -(1 / 3) * r]),
                    sides: 3,
                    radius: (2 / 3) * r,
                    data: { mer: 2 },
                }),
                new Path.RegularPolygon({
                    center: e.coor.add([-1.5 * R, (2 / 3) * r]),
                    sides: 3,
                    radius: (2 / 3) * r,
                    data: { mer: 2 },
                }).rotate(180),
            ],
            radius: 2 * r,
        };
    } else if (t === "rhombitrihex") {
        tile = {
            basis: [
                [R + r + 0.5 * R, 0.5 * R + r],
                [0, 2 * r + R],
            ],
            tile: (e) => [
                new Path.RegularPolygon({
                    center: e.coor,
                    sides: 6,
                    radius: R,
                    data: { mer: 1 },
                }).rotate(30),
                ...Array.from({ length: 3 }, (_, i) =>
                    new Path.RegularPolygon({
                        center: e.coor.add([0, R + R * (SQRT3 / 3)]),
                        sides: 3,
                        radius: R / SQRT3,
                        data: { mer: 2 },
                    }).rotate(-30 + i * -60, e.coor)
                ),
                ...Array.from({ length: 3 }, (_, i) =>
                    new Path.RegularPolygon({
                        center: e.coor.add([0, -r - 0.5 * R]),
                        sides: 4,
                        radius: Math.sqrt(2 * R * R) / 2,
                        data: { mer: 3 },
                    }).rotate(i * 60, e.coor)
                ),
            ],
            radius: Math.sqrt(Math.pow(r + R, 2) + Math.pow(R / 2, 2)),
        };
    } else if (t === "dualhex") {
        tile = {
            basis: [
                [(3 / 2) * R, r],
                [0, 2 * r],
            ],
            tile: (e) =>
                Array.from({ length: 6 }, (_, i) =>
                    new Path.RegularPolygon({
                        center: e.coor.add([0, r - (R * SQRT3) / 6]),
                        sides: 3,
                        radius: R / SQRT3,
                        data: { mer: 1 },
                    }).rotate(i * 60, e.coor)
                ),
            radius: R,
        };
    } else if (t === "dualtrihex") {
        tile = {
            basis: [
                [2 * r, 0],
                [r, SQRT3 * r],
            ],
            tile: (e) => [
                ...Array.from({ length: 6 }, (_, i) =>
                    new Path({
                        segments: [
                            [0, 0],
                            [0.5 * r, -(0.25 * R * Math.sin(Math.PI / 6)) / Math.cos(Math.PI / 3)],
                            [r, 0],
                            [0.5 * r, (0.25 * R * Math.sin(Math.PI / 6)) / Math.cos(Math.PI / 3)],
                        ].map((f) => e.coor.add(f)),
                        closed: true,
                        data: { mer: 1 },
                    }).rotate(i * 60, e.coor)
                ),
                ...Array.from({ length: 6 }, (_, i) =>
                    new Path({
                        segments: [
                            [-0.5 * r, 0.5 * R + (0.25 * R * Math.sin(Math.PI / 6)) / Math.cos(Math.PI / 3)],
                            [0, 0.5 * R],
                            [r - 0.5 * r, 0.5 * R + (0.25 * R * Math.sin(Math.PI / 6)) / Math.cos(Math.PI / 3)],
                            [0, 0.5 * R + (2 * (0.25 * R * Math.sin(Math.PI / 6))) / Math.cos(Math.PI / 3)],
                        ].map((f) => e.coor.add(f)),
                        closed: true,
                        data: { mer: 2 },
                    }).rotate(i * 60, e.coor)
                ),
            ],
            radius: R,
        };
    } else if (t === "dualsnubhex") {
        tile = {
            basis: [
                [2.5 * R, r],
                [0.5 * R, 2 * r + 2 * ((R * SQRT3) / 3) - (R * SQRT3) / 6],
            ],
            tile: (e) =>
                Array.from({ length: 6 }, (_, i) =>
                    new Path({
                        segments: [
                            [0, 0],
                            [0, r + (R * SQRT3) / 6],
                            [0.5 * R, r + (R * SQRT3) / 3],
                            [R, r + (R * SQRT3) / 6],
                            [R, (R * SQRT3) / 3],
                        ].map((f) => e.coor.add(f)),
                        closed: true,
                        data: { mer: 1 },
                    }).rotate(i * 60, e.coor)
                ),
            radius: r + (R * SQRT3) / 3,
        };
    } else if (t === "dualrhombitrihex") {
        tile = {
            basis: [
                [(3 / 2) * R, r],
                [0, 2 * r],
            ],
            tile: (e) =>
                Array.from({ length: 6 }, (_, i) =>
                    new Path({
                        segments: [
                            [0, 0],
                            [0, r],
                            [0.5 * R, r],
                            [(SQRT3 / 2) * r, 0.5 * r],
                        ].map((f) => e.coor.add(f)),
                        closed: true,
                        data: { mer: 1 },
                    }).rotate(i * 60, e.coor)
                ),
            radius: R,
        };
    } else {
        throw new Error("incorrect tile mode");
    }
    return tile;
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

function ck_vectors(basis, h, k, H, K, R = 1) {
    const [v1, v2] = basis;
    const v3 = v2.rot(Math.PI / 3);
    return [
        //
        v1.mul(h).add(v2.mul(k)),
        v2.mul(H).add(v3.mul(K)),
        v1.mul(-h - k).add(v2.mul(h)),
        v1.mul(k).add(v3.mul(-h)),
    ];
}

function ico_config(s) {
    let values;
    /****/ if (s == 2) {
        values = [
            [1, 1, 1, 1, 2, 2, 2, 2, 3, 3],
            ["T1-▔", "T1-▔", "T1▁", "T1▁", "T2-▼", "T2-▲", "T2-▼", "T2-▲", "T3-▼", "T3-▲"],
            [
                [0, 1, 2],
                [2, 1, 4],
                [9, 10, 6],
                [9, 11, 10],
                [0, 2, 6],
                [9, 6, 2],
                [2, 4, 9],
                [9, 11, 4],
                [0, 6, 5],
                [10, 5, 6],
            ],
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
            [
                [1, 2, 3, 5, 6],
                [0, 2, 3, 4, 7],
                [0, 1, 4, 6, 9],
                [0, 1, 5, 7, 8],
                [1, 2, 7, 9, 11],
                [0, 3, 6, 8, 10],
                [0, 2, 5, 9, 10],
                [1, 3, 4, 8, 11],
                [3, 5, 7, 10, 11],
                [2, 4, 6, 10, 11],
                [5, 6, 8, 9, 11],
                [4, 7, 8, 9, 10],
            ],
        ];
    } else if (s == 3) {
        values = [
            [1, 1, 1, 1, 2, 2, 3, 3],
            ["T1-▔", "T1-▲", "T1-▼", "T1-▁", "T2-▼", "T2-▲", "T3-▼", "T3-▲"],
            [
                [0, 2, 1],
                [1, 2, 3],
                [6, 11, 9],
                [9, 11, 10],
                [1, 3, 6],
                [9, 6, 3],
                [1, 6, 5],
                [11, 5, 6],
            ],
            [1, 3, 3, 1, 3, 3, 3, 3],
            [
                [1, 2, 3, 4, 5],
                [0, 2, 5, 6, 10],
                [0, 1, 3, 6, 7],
                [0, 2, 4, 7, 8],
                [0, 3, 5, 8, 9],
                [0, 1, 4, 9, 10],
                [1, 2, 7, 10, 11],
                [2, 3, 6, 8, 11],
                [3, 4, 7, 9, 11],
                [4, 5, 8, 10, 11],
                [1, 5, 6, 9, 11],
                [6, 7, 8, 9, 10],
            ],
        ];
    } else if (s == 5) {
        values = [
            [1, 1, 2, 2],
            ["T1-▲", "T1-▼", "T2-▲", "T2-▼"],
            [
                [0, 1, 2],
                [6, 11, 7],
                [2, 1, 6],
                [6, 7, 2],
            ],
            [5, 5, 5, 5],
            [
                [1, 2, 3, 4, 5],
                [0, 2, 5, 6, 10],
                [0, 1, 3, 6, 7],
                [0, 2, 4, 7, 8],
                [0, 3, 5, 8, 9],
                [0, 1, 4, 9, 10],
                [1, 2, 7, 10, 11],
                [2, 3, 6, 8, 11],
                [3, 4, 7, 9, 11],
                [4, 5, 8, 10, 11],
                [1, 5, 6, 9, 11],
                [6, 7, 8, 9, 10],
            ],
        ];
    } else {
        throw new Error("s must be 2, 3, or 5");
    }
    return Object.fromEntries(["t_idx", "t_id", "v_idx", "t_rep", "v_con"].map((k, i) => [k, values[i]]));
}

function ico_axis_5(ck, iter = ITER, tol = TOL) {
    const a = ck[0].norm();
    const b = ck[1].norm();

    // regular pentagon circumradius
    const R5 = a * Math.sqrt((5 + SQRT5) / 10);
    // regular pentagonal pyramid height
    const h5 = ((1 + SQRT5) * a) / (2 * Math.sqrt(5 + 2 * SQRT5));

    const pA = [0, 0, h5];
    const pB = [-R5, 0, 0].roro([0, 0, 1], (3 / 10) * Math.PI); // 54°
    const pC = pB.add([a, 0, 0]);

    const t = ck[0].angle(ck[1]);
    const q = pC.add([b, 0, 0].roro([0, 1, 0], -Math.PI - t));
    const p = pB.add(q.sub(pB).proj(pC.sub(pB)));
    const d = [p[0], (-Math.abs(p[1]) * Math.sqrt(R5 * R5 * p[1] * p[1] - (p[0] * p[1]) ** 2)) / (p[1] * p[1]), 0];

    const pG = d.add([0, 0, -Math.sqrt(q[2] * q[2] - (p[1] - d[1]) ** 2)]);
    const coor = [pA, pB, pC]
        .concat([1, 2, 3].map((e) => pC.roro([0, 0, 1], ((e * 2) / 5) * Math.PI)))
        .concat([pG])
        .concat([1, 2, 3, 4].map((e) => pG.roro([0, 0, 1], ((e * 2) / 5) * Math.PI)))
        .concat([[0, 0, pG[2] - pA[2]]]);

    return coor.map((e) => e.add([0, 0, -pG[2] / 2]));
}

function ico_axis_3(ck, iter = ITER, tol = TOL) {
    const a = ck[0].norm();
    const b = ck[1].norm();
    const c = ck[2].sub(ck[1]).norm();

    const pA = [0, a * (1 / SQRT3), 0];
    const pB = [a / 2, -(a * (SQRT3 / 6)), 0];
    const pC = [-(a / 2), -(a * (SQRT3 / 6)), 0];
    const qD = [0, -(a * ((2 * SQRT3) / 3)), 0];
    const qF = [a, a / SQRT3, 0];

    function fold(t) {
        let [v, k] = [qD.uvec().mul(a * (SQRT3 / 2)), pB.sub(pC).uvec()];
        const pD = [0, -(a * (SQRT3 / 6)), 0].add(v.roro(k, t));
        const pF = pD.roro([0, 0, 1], (2 / 3) * Math.PI);
        t = ck[0].angle(ck[1]);
        [v, k] = [pD.sub(pB).uvec().mul(b), pD.cross(pB).uvec()];
        const o = v.roro(k, t);
        const [p, q] = [pB.add(o.proj(v)), pB.add(o)];
        [v, k] = [q.sub(p), pB.sub(pD).uvec()];
        const f = (t) => c - p.add(v.roro(k, t)).sub(pF).norm();
        let br = brackets(f, 0, 2 * Math.PI, iter).next().value;
        t = bisection(f, ...brackets(f, 0, 2 * Math.PI, iter).next().value, tol, iter).slice(-1);
        const pG = p.add(v.roro(k, t));
        return [pD, pF, pG, Math.abs(pD[1]) - pG.sub([0, 0, pG[2]]).norm()];
    }

    const delta = Math.PI / 180 / 10;
    t = 0;
    for (let i = 0; i * delta < Math.PI / 2; i++) {
        t = i * delta;
        try {
            fold(t);
            break;
        } catch (e) {}
    }
    let obj = (t) => fold(t).slice(-1)[0];
    t = bisection(obj, ...brackets(obj, t, Math.PI / 4, iter).next().value, tol, iter).slice(-1);

    const [pD, pF, pG] = fold(t).slice(0, -1);
    const k = [0, 0, 1];
    t = (2 * Math.PI) / 3;
    const pH = pG.roro(k, -t);
    const pJ = pH
        .sub([0, 0, pH[2]])
        .roro(k, Math.PI / 3)
        .uvec()
        .mul(pA[1])
        .add([0, 0, pH[2] + pD[2] - pA[2]]);

    let coor = [pA, pB, pC, pD, pF.roro(k, t), pF, pG, pH, pH.roro(k, -t), pJ, pJ.roro(k, -t), pJ.roro(k, -2 * t)];
    return coor.map((e) => e.add([0, 0, (coor[0][2] - coor.slice(-1)[0][2]) / 2]));
}

function ico_axis_2(ck, iter = ITER, tol = TOL) {
    const a = ck[0].norm();
    const b = ck[1].norm();
    const c = ck[2].sub(ck[1]).norm();

    const pA = [a / 2, 0, 0];
    const pB = [-(a / 2), 0, 0];
    const pC = [0, -((a * PHI) / 2), -((a * PHI - a) / 2)];
    const pD = [0, (a * PHI) / 2, -((a * PHI - a) / 2)];

    function fold(t) {
        let p = pB.add(pC).div(2);
        let [v, k] = [p.sub(pA), pC.sub(pB).uvec()];
        const pE = p.add(v.roro(k, t));
        const pF = pE.roro([0, 0, 1], Math.PI);

        t = ck[0].angle(ck[1]);
        [v, k] = [pC.sub(pA).uvec().mul(b), pC.cross(pA).uvec()];
        const o = v.roro(k, t);
        p = pA.add(o.proj(v));
        const q = pA.add(o);
        [v, k] = [q.sub(p), pA.sub(pC).uvec()];
        const f = (t) => c - p.add(v.roro(k, t)).sub(pF).norm();
        t = bisection(f, ...brackets(f, 0, 2 * Math.PI, iter).next().value, tol, iter).slice(-1);
        const pG = p.add(v.roro(k, t));

        return [pE, pF, pG, pE.sub([0, 0, pE[2]]).norm() - pG.sub([0, 0, pG[2]]).norm()];
    }

    const delta = Math.PI / 180 / 10;
    t = 0;
    for (let i = 0; i * delta < Math.PI / 2; i++) {
        t = i * delta;
        try {
            fold(t);
            break;
        } catch (e) {}
    }
    let obj = (t) => fold(t).slice(-1)[0];
    t = bisection(obj, ...brackets(obj, t, Math.PI / 4, iter).next().value, tol, iter).slice(-1);
    const [pE, pF, pG] = fold(t).slice(0, -1);

    obj = (t) =>
        pA
            .roro([0, 0, 1], t)
            .add([0, 0, pG[2] + pE[2]])
            .sub(pF)
            .norm() - b;
    t = bisection(obj, ...brackets(obj, 0, 2 * Math.PI, iter).next().value, tol, iter).slice(-1);
    const pK = pA.roro([0, 0, 1], t).add([0, 0, pG[2] + pE[2]]);
    const pI = pK
        .sub([0, 0, pK[2]])
        .uvec()
        .roro([0, 0, 1], Math.PI / 2)
        .mul(pD[1])
        .add([0, 0, pG[2] + pE[2] - pD[2]]);

    coor = [pA, pB, pC, pD, pE, pF, pG, pG.roro([0, 0, 1], Math.PI), pI, pI.roro([0, 0, 1], Math.PI), pK, pK.roro([0, 0, 1], Math.PI)];

    return coor.map((e) => e.add([0, 0, (coor[0][2] - coor.slice(-1)[0][2]) / 2]));
}

function draw_capsid(PARAMS) {
    const tile = calc_tile(PARAMS.t, PARAMS.R);
    const ck = ck_vectors(tile.basis, PARAMS.h, PARAMS.k, PARAMS.H, PARAMS.K);

    // grid
    //// calculate
    const grid = Array.from(tile_grid(ck, tile.basis));
    const lattice = grid.map(tile.tile);
    const vertex_coordinates = grid
        .filter((e) => e.is_vertex)
        .map((e) => e.coor)
        .concat([[0, 0]]);
    //// metadata
    lattice.flat().forEach((e) => {
        const offset = e.data.mer + (vertex_coordinates.some((v) => [e.position.x, e.position.y].sub(v).norm() <= tile.radius) ? 0 : 3);
        e.data.offset = offset;
        e.data.centroid = e.segments
            .map((e) => e.point)
            .reduce((a, b) => a.add(b), new Point([0, 0]))
            .divide(e.segments.length);
        e.style.fillColor = PARAMS["mer_color_" + offset] + PARAMS["mer_alpha_" + offset];
    });

    // facets
    //// calculate
    const triangles = [
        [ck[3], ck[0]],
        [ck[0], ck[1]],
        [ck[1], ck[2]],
    ].map((e) => new Path({ segments: [[0, 0], ...e], closed: true, data: { vectors: [[0, 0], ...e] } }));
    //// intersect
    const facets = triangles.map(
        (e) =>
            new Group({
                children: lattice
                    .flatMap((f) =>
                        f.map((g) => {
                            const options = { insert: false };
                            const x = g.intersect(e, options);
                            x.data.has_centroid = e.contains(x.data.centroid);
                            x.data.centroid_on_vertex = e.segments.map((h) => h.point.getDistance(x.data.centroid)).some((e) => e < 1e-5);
                            return x;
                        })
                    )
                    .filter((e) => e.segments.length > 0),
                data: e.data,
            })
    );

    // const unit1 = new Group({
    //     children: facets.slice(0, 2),
    // })
    //     .rotate(-degrees(ck[0].angle([1, 0])))
    //     .scale(-1, 1);
    // const unit2 = unit1.clone().rotate(180);
    // const top_center = unit2.children[1].children
    //     .flatMap((e) => e.segments)
    //     .map((e) => e.point)
    //     .reduce((a, b) => (a.y < b.y ? a : b));
    // unit2.position.x += unit1.children[0].bounds.right - top_center.x;
    // unit2.position.y += unit1.children[0].bounds.height;
    // new Group({
    //     children: Array.from({ length: 5 })
    //         .map((_, i) => {
    //             const [u1, u2] = [unit1.clone(), unit2.clone()];
    //             u1.position.x += i * unit1.children[0].bounds.width;
    //             u2.position.x += i * unit1.children[0].bounds.width;
    //             return [u1, u2];
    //         })
    //         .flat(),
    //     position: view.center,
    //     style: { strokeColor: PARAMS.line_color + PARAMS.line_alpha, strokeWidth: PARAMS.line_size, strokeCap: "round", strokeJoin: "round" },
    // });
    // // clean-up
    // unit1.remove();
    // unit2.remove();
    // facets.forEach((e) => e.remove());
    // lattice.forEach((e) => e.forEach((f) => f.remove()));
    // return;

    const angle = ck[0].angle([1, 0]);
    const unit1 = new Group(facets).rotate(-degrees(angle)).scale(-1, 1);
    const unit0 = facets[0].clone().rotate(180);
    unit0.position.x += ck[0].norm() / 2;
    const centroid = [unit0.bounds.topLeft, unit0.bounds.topRight, unit0.bounds.bottomCenter].reduce((a, b) => a.add(b), new Point()).divide(3);

    const g = new Group({
        children: [new Group(unit0.clone(), ...[1, 2, 3].map((_, i) => unit1.clone().rotate(i * 120, centroid)))],
        position: view.center,
        style: { strokeColor: PARAMS.line_color + PARAMS.line_alpha, strokeWidth: PARAMS.line_size, strokeCap: "round", strokeJoin: "round" },
    });

    // g.addChild(g.children[0].clone().rotate(180));
    // g.addChild(new Path.Circle({ center: left, radius: 6, fillColor: "blue" }));
    // g.addChild(new Path.Circle({ center: bottom, radius: 6, fillColor: "red" }));

    // clean-up
    unit0.remove();
    unit1.remove();

    facets.forEach((e) => e.remove());
    lattice.forEach((e) => e.forEach((f) => f.remove()));
    triangles.forEach((e) => e.remove());

    return;

    // coordinates
    const CAMERA = camera(...[PARAMS.θ, PARAMS.ψ, PARAMS.φ].map(radians));
    const AXIS = mmul(CAMERA, [0, 0, 1, 1].T());
    const ico_axis = ["", ico_axis_2, ico_axis_3, "", ico_axis_5][PARAMS.s - 1];
    const coors = ico_axis(ck).map((e) => mmul(CAMERA, e.concat(1).T()).flat());

    // transform
    const config = ico_config(PARAMS.s);
    const th = (2 * Math.PI) / PARAMS.s;
    let results = [];
    for (let idx = 0; idx < config.t_idx.length; idx++) {
        const facet = facets[config.t_idx[idx] - 1];
        const A = T(facet.data.vectors.map((e) => e.concat(1)));
        const V = [0, 1, 2].map((e) => coors[config.v_idx[idx][e]]);
        for (let i = 0; i < config.t_rep[idx]; i++) {
            const X = V.map((e) => e.roro(AXIS, i * th));
            const M = mmul([...T(X).slice(0, 2), [1, 1, 1]], inv3(A));
            const result = facet.clone().transform(new paper.Matrix(M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2]));
            result.data.M = mmul(T(X), inv3(A));
            result.data.centroid = X.reduce((a, b) => a.add(b)).div(X.length);
            result.data.normal = X[1].sub(X[0]).cross(X[2].sub(X[0])).uvec();
            results.push(result);
        }
    }

    // fibers
    //// penton fibers
    let fibers = PARAMS["penton_fiber_toggle"]
        ? config.v_con
              .map((e) =>
                  e
                      .map((f) => coors[f])
                      .reduce((a, b) => a.add(b), [0, 0, 0])
                      .uvec()
              )
              .map((e, i) => [coors[i], coors[i].add(e.mul(PARAMS.fiber_length))])
        : [];
    //// mer fibers
    fibers = fibers.concat(
        results.flatMap((e, i) =>
            e.children
                .filter((f) => PARAMS["mer_toggle_" + f.data.offset] && f.data.has_centroid)
                .map((f, j) => {
                    const from = mmul(e.data.M, [f.data.centroid.x, f.data.centroid.y, 1].T()).flat();
                    const sign = from.uvec().dot(e.data.normal) < TOL ? -1 : 1;
                    const to = from.add(e.data.normal.mul(sign * PARAMS.fiber_length));
                    return [from, to];
                })
        )
    );
    //// group
    let groups = [];
    fibers.forEach((e) => {
        let i = 0;
        for (let g of groups) if (e[0].sub(g[0][0]).norm() < TOL_COLLAPSE) i = g.push(e);
        if (i === 0) groups.push([e]);
    });
    //// merge
    fibers = groups
        .map((e) => [
            e[0][0],
            e
                .map((f) => f[1])
                .reduce((a, b) => a.add(b), [0, 0, 0])
                .div(e.length),
        ])
        .map((e) => {
            return new Path.Line({
                from: e[0],
                to: e[1],
                data: { centroid: e[1].mul(1000) },
            });
        });

    // knobs
    const knobs = PARAMS["knob_toggle"] ? fibers.map((e) => new Path.Circle({ center: e.segments[1].point, radius: PARAMS.knob_size, data: { centroid: e.data.centroid } })) : [];
    results = results.concat(fibers).concat(knobs);

    // painter's algorithm
    results.sort((a, b) => a.data.centroid[2] < b.data.centroid[2]);
    new Group({
        children: results,
        position: view.center,
        style: { strokeColor: PARAMS.line_color + PARAMS.line_alpha, strokeWidth: PARAMS.line_size, strokeCap: "round", strokeJoin: "round" },
    });

    // styling
    knobs.forEach((e) => (e.style.fillColor = PARAMS.knob_color + PARAMS.knob_alpha));
    fibers.forEach((e) => {
        e.style.strokeColor = PARAMS.fiber_color + PARAMS.fiber_alpha;
        e.style.strokeWidth = PARAMS.fiber_size;
    });

    // clean-up
    facets.forEach((e) => e.remove());
    lattice.forEach((e) => e.forEach((f) => f.remove()));
}
