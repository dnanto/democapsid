/*!
 * democapsid v2.1.3 - Render viral capsids in the browser and export SVG.
 * MIT License
 * Copyright (c) 2020 - 2024, Daniel Antonio Negrón (dnanto/remaindeer)
 */

const VERSION = "2.1.3";

const SQRT3 = Math.sqrt(3);
const SQRT5 = Math.sqrt(5);
const PHI = (1 + SQRT5) / 2;
const ITER = 100;
const TOL = 1e-15;
const TOL_COLLAPSE = 1e-5;

Array.prototype.mul = function (a) {
    return this.map((e) => e * a);
};

Array.prototype.div = function (a) {
    return this.map((e) => e / a);
};

Array.prototype.add = function (a) {
    return this.map((e, i) => e + a[i]);
};

Array.prototype.sub = function (a) {
    return this.map((e, i) => e - a[i]);
};

Array.prototype.dot = function (a) {
    return this.map((e, i) => e * a[i]).reduce((e, f) => e + f);
};

Array.prototype.sum = function (initial_value = 0) {
    return this.reduce((a, b) => a + b, initial_value);
};

Array.prototype.centroid = function () {
    return this.reduce((a, b) => a.add(b)).div(this.length);
};

Array.prototype.cross = function (v) {
    // https://en.wikipedia.org/wiki/Cross_product
    return [this[1] * v[2] - this[2] * v[1], this[2] * v[0] - this[0] * v[2], this[0] * v[1] - this[1] * v[0]];
};

Array.prototype.rot = function (t) {
    const [cos, sin] = [Math.cos(t), Math.sin(t)];
    return mmul(
        [
            [cos, -sin],
            [sin, cos],
        ],
        this.T()
    ).flat();
};

Array.prototype.roro = function (k, t) {
    // https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
    return this.mul(Math.cos(t))
        .add(k.cross(this).mul(Math.sin(t)))
        .add(k.mul(k.dot(this)).mul(1 - Math.cos(t)));
};

Array.prototype.norm = function () {
    return Math.sqrt(this.map((e) => e * e).sum());
};

Array.prototype.uvec = function () {
    return this.div(this.norm());
};

Array.prototype.angle = function (v) {
    return Math.acos(this.dot(v) / (this.norm() * v.norm()));
};

Array.prototype.proj = function (v) {
    return v.mul(this.dot(v) / v.dot(v));
};

Array.prototype.T = function () {
    return this.map((e) => [e]);
};

Array.prototype.distance = function (q) {
    return this.sub(q).norm();
};

Array.prototype.has = function (q, tol = TOL) {
    return this.some((p) => p.length === q.length && p.distance(q) < tol);
};

Array.prototype.split = function (sep) {
    // https://stackoverflow.com/a/34513786
    return this.reduce(
        function (arr, val) {
            if (val === -1) arr.push([]);
            else arr[arr.length - 1].push(val);
            return arr;
        },
        [[]]
    ).filter((e) => e.length);
};

function mmul(A, B) {
    const [m, n, p] = [A.length, A[0].length, B[0].length];
    var C = new Array(m);
    for (var i = 0; i < m; i++) C[i] = new Array(p).fill(0);
    for (var i = 0; i < m; i++) for (var j = 0; j < p; j++) for (var k = 0; k < n; k++) C[i][j] += A[i][k] * B[k][j];
    return C;
}

/**
 * Calculate the 2x2 determinant.
 * @param {Array} A The 2x2 matrix.
 * @return {Number} The determinant;
 */
function det2(A) {
    return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

/**
 * Calculate the 3x3 determinant.
 * @param {Array} A The 3x3 matrix.
 * @return {Number} The determinant;
 */
function det3(A) {
    return (
        A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - //
        A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + //
        A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
    );
}

/**
 * Calculate the 2x2 inverse.
 * @param {Array} A The 3x3 matrix.
 * @return {Number} The inverse;
 */
function inv2(A) {
    const d = det2(A);
    return [[A[1][1], -A[0][1]].div(d), [-A[1][0], A[0][0]].div(d)];
}

/**
 * Calculate the 3x3 inverse.
 * @param {Array} A The 3x3 matrix.
 * @return {Number} The inverse;
 */
function inv3(A) {
    const [a, b, c, d, e, f, g, h, i] = [A[0][0], A[0][1], A[0][2], A[1][0], A[1][1], A[1][2], A[2][0], A[2][1], A[2][2]];
    const dA = this.det3(A);
    return [
        [(e * i - f * h) / dA, -(b * i - c * h) / dA, (b * f - c * e) / dA],
        [-(d * i - f * g) / dA, (a * i - c * g) / dA, -(a * f - c * d) / dA],
        [(d * h - e * g) / dA, -(a * h - b * g) / dA, (a * e - b * d) / dA],
    ];
}

function T(A) {
    var B = Array.from({ length: A[0].length }, () => Array.from({ length: A.length }, () => []));
    for (var i = 0; i < B.length; i++) B[i] = new Array(A.length);
    for (var i = 0; i < A.length; i++) for (var j = 0; j < A[0].length; j++) B[j][i] = A[i][j];
    return B;
}

function rotmat3(θ, ψ, φ) {
    // trigonometry
    const [sinθ, sinψ, sinφ, cosθ, cosψ, cosφ] = [
        //
        Math.sin(θ),
        Math.sin(ψ),
        Math.sin(φ),
        Math.cos(θ),
        Math.cos(ψ),
        Math.cos(φ),
    ];
    // rotation matrix
    return [
        [cosθ * cosψ, cosθ * sinψ * sinφ - sinθ * cosφ, cosθ * sinψ * cosφ + sinθ * sinφ],
        [sinθ * cosψ, sinθ * sinψ * sinφ + cosθ * cosφ, sinθ * sinψ * cosφ - cosθ * sinφ],
        [-sinψ, cosψ * sinφ, cosψ * cosφ],
    ];
}

function camera(θ, ψ, φ, C = [0, 0, 0]) {
    // calibration
    const K = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
    ];
    // rotation matrix
    const R = rotmat3(θ, ψ, φ);
    // translation matrix
    const IC = [
        [1, 0, 0, -C[0]],
        [0, 1, 0, -C[1]],
        [0, 0, 1, -C[2]],
    ];
    // camera matrix
    return mmul(mmul(K, R), IC);
}

function* brackets(f, a, b, iter) {
    const frac = b / iter;
    let prev = Math.sign(f(a));
    for (let i = 0; i < iter; i++) {
        let x = a + i * frac;
        let curr = Math.sign(f(x));
        if (prev != curr) {
            yield [a + (i - 1) * frac, x];
            prev = curr;
        }
    }
}

function bisection(f, a, b, tol, iter) {
    let i = 1;
    let c = (a + b) / 2;
    let f_of_c = f(c);
    for (; i <= iter; i++) {
        c = (a + b) / 2;
        f_of_c = f(c);
        if (f_of_c == 0 || (b - a) / 2 < tol) break;
        if (Math.sign(f_of_c) == Math.sign(f(a))) a = c;
        else b = c;
    }
    return [i, f_of_c, c];
}

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
                new paper.Path.RegularPolygon({
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
                new paper.Path.RegularPolygon({
                    center: e.coor,
                    sides: 6,
                    radius: R,
                    data: { mer: 1 },
                }).rotate(30),
                ...Array.from({ length: 2 }, (_, i) =>
                    new paper.Path.RegularPolygon({
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
                new paper.Path.RegularPolygon({
                    center: e.coor,
                    sides: 6,
                    radius: R,
                    data: { mer: 1 },
                }).rotate(30),
                ...Array.from({ length: 6 }, (_, i) =>
                    new paper.Path.RegularPolygon({
                        center: e.coor.add([0, -r - (1 / 3) * r]),
                        sides: 3,
                        radius: (2 / 3) * r,
                        data: { mer: 2 },
                    }).rotate(i * 60, e.coor)
                ),
                new paper.Path.RegularPolygon({
                    center: e.coor.add([1.5 * R, -(1 / 3) * r]),
                    sides: 3,
                    radius: (2 / 3) * r,
                    data: { mer: 2 },
                }),
                new paper.Path.RegularPolygon({
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
                new paper.Path.RegularPolygon({
                    center: e.coor,
                    sides: 6,
                    radius: R,
                    data: { mer: 1 },
                }).rotate(30),
                ...Array.from({ length: 3 }, (_, i) =>
                    new paper.Path.RegularPolygon({
                        center: e.coor.add([0, R + R * (SQRT3 / 3)]),
                        sides: 3,
                        radius: R / SQRT3,
                        data: { mer: 2 },
                    }).rotate(-30 + i * -60, e.coor)
                ),
                ...Array.from({ length: 3 }, (_, i) =>
                    new paper.Path.RegularPolygon({
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
                    new paper.Path.RegularPolygon({
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
                    new paper.Path({
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
                    new paper.Path({
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
                    new paper.Path({
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
                    new paper.Path({
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

function ck_vectors(basis, h, k, H, K) {
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

function triangle_circumcircle_center(p, q, r) {
    // https://en.wikipedia.org/wiki/Circumcircle#Higher_dimensions
    // triangle_circumcircle_center([0, 1.73205081, 2.99162946], [0, -2.90587844, 1.38259261], [0, 2.90587844, 1.38259261])
    // -> [0, 0, 0.49537554129916317]
    const [a, b] = [p.sub(r), q.sub(r)];
    const axb = a.cross(b);
    return b
        .mul(a.norm() ** 2)
        .sub(a.mul(b.norm() ** 2))
        .cross(axb)
        .div(2 * axb.norm() ** 2)
        .add(r);
}

function tetrahedron_circumsphere_center(v0, v1, v2, v3) {
    // https://rodolphe-vaillant.fr/entry/127/find-a-tetrahedron-circumcenter
    // tetrahedron_circumsphere_center([1.5, 0, 3.21404077], [-1.5, 0, 3.21404077], [-2.61069906, -1.69586289, 1.00261665], [2.61069906, 1.69586289, 1.00261665])
    // -> [-2.22044605e-16, -1.26309544e-15, 4.25770295e-1]
    const [e1, e2, e3] = [v1, v2, v3].map((e) => e.sub(v0));
    return v0.add(
        e1
            .cross(e2)
            .mul(e3.norm() ** 2)
            .add(e3.cross(e1).mul(e2.norm() ** 2))
            .add(e2.cross(e3).mul(e1.norm() ** 2))
            .div(2 * det3([e1, e2, e3]))
    );
}

function body_radius(coors) {
    return coors[6].sub([0, 0, coors[6][2]]).norm();
}

function height(coors) {
    return coors[0][2] - coors[19][2];
}

function body_height(coors) {
    return coors[4][2] - coors[6][2];
}

function sd_sphere(p, r) {
    return p.norm() - r;
}

function spherize(coor, radius, sphericity) {
    return coor
        .uvec()
        .mul(Math.abs(sd_sphere(coor, radius)) * sphericity)
        .add(coor);
}

function cylinderize(coor, coors, a, sphericity) {
    const [r, h2] = [body_radius(coors), body_height(coors) / 2];
    let pos, rad;
    /****/ if (a === 5) {
        pos = [0, 0, h2 - r / 2];
        rad = coors[0][2] + r / 2 - h2;
    } else if (a === 3) {
        const [p1, p2] = [coors[0], coors[3]];
        pos = triangle_circumcircle_center(p1, p2, [p2[0], -p2[1], p2[2]]);
        rad = p1.sub(pos).norm();
    } else if (a === 2) {
        p1 = coors[0];
        pos = tetrahedron_circumsphere_center(p1, ...[1, 4, 5].map((i) => coors[i]));
        rad = p1.sub(pos).norm();
    }
    const [pos1, pos2, tmid, bmid] = [
        [0, 0, pos[2]],
        [0, 0, -pos[2]],
        [0, 0, h2],
        [0, 0, -h2],
    ];
    /****/ if (h2 < coor[2]) {
        // top cap
        const d = Math.abs(sd_sphere(coor.sub(pos1), rad));
        return coor
            .sub(tmid)
            .uvec()
            .mul(d * sphericity)
            .add(coor);
    } else if (coor[2] < -h2) {
        // bottom cap
        const d = Math.abs(sd_sphere(coor.sub(pos2), rad));
        return coor
            .sub(bmid)
            .uvec()
            .mul(d * sphericity)
            .add(coor);
    }
    // body cylinder
    return coor
        .sub([0, 0, coor[2]])
        .uvec()
        .mul((r - coor.slice(0, 2).norm()) * sphericity)
        .add(coor);
}

function ico_config(a) {
    let values;
    /****/ if (a === 5) {
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
    } else if (a === 3) {
        values = [
            [1, 1, 1, 1, 2, 2, 3, 3],
            ["T1-▔", "T1-▲", "T1-▼", "T1-▁", "T2-▼", "T2-▲", "T3-▼", "T3-▲"],
            [
                [0, 2, 1],
                [1, 2, 3],
                [6, 9, 11],
                [9, 10, 11],
                [1, 3, 6],
                [9, 6, 3],
                [1, 6, 5],
                [11, 5, 6],
            ],
            [1, 3, 3, 1, 3, 3, 3, 3],
            [
                [1, 2, 4, 5, 8],
                [0, 2, 3, 5, 6],
                [0, 1, 3, 4, 7],
                [1, 2, 6, 7, 9],
                [0, 2, 7, 8, 10],
                [0, 1, 6, 8, 11],
                [1, 3, 5, 9, 11],
                [2, 3, 4, 9, 10],
                [0, 4, 5, 10, 11],
                [3, 6, 7, 10, 11],
                [4, 7, 8, 9, 11],
                [5, 6, 8, 9, 10],
            ],
        ];
    } else if (a === 2) {
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
                [11, 9, 4],
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
    } else {
        throw new Error("a must be 2, 3, or 5");
    }
    return Object.fromEntries(["t_idx", "t_id", "v_idx", "t_rep", "v_con"].map((k, i) => [k, values[i]]));
}

function ico_axis_5(ck) {
    const [a, b] = [ck[0].norm(), ck[1].norm()];

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

    if (Number.isNaN(d[1])) throw new Error("impossible construction!");

    const pG = d.add([0, 0, -Math.sqrt(q[2] * q[2] - (p[1] - d[1]) ** 2)]);
    const coor = [pA, pB, pC]
        .concat([1, 2, 3].map((e) => pC.roro([0, 0, 1], ((e * 2) / 5) * Math.PI)))
        .concat([pG])
        .concat([1, 2, 3, 4].map((e) => pG.roro([0, 0, 1], ((e * 2) / 5) * Math.PI)))
        .concat([[0, 0, pG[2] - pA[2]]]);

    return coor.map((e) => e.add([0, 0, -pG[2] / 2]));
}

function ico_axis_3(ck, iter = ITER, tol = TOL) {
    const [a, b, c] = [ck[0].norm(), ck[1].norm(), ck[2].sub(ck[1]).norm()];

    const pA = [0, a * (1 / SQRT3), 0];
    const pB = [a / 2, -(a * (SQRT3 / 6)), 0];
    const pC = [-(a / 2), -(a * (SQRT3 / 6)), 0];
    const qD = [0, -(a * ((2 * SQRT3) / 3)), 0];

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
    let t = 0;
    for (let i = 0; i * delta < Math.PI / 2; i++) {
        t = i * delta;
        try {
            fold(t);
            break;
        } catch (e) {}
    }
    let obj = (t) => fold(t).slice(-1)[0];
    try {
        t = bisection(obj, ...brackets(obj, t, Math.PI / 4, iter).next().value, tol, iter).slice(-1);
    } catch (e) {
        throw new Error("impossible construction!");
    }

    const [pD, pF, pG] = fold(t).slice(0, -1);
    if (Number.isNaN(pD[0])) throw new Error("impossible construction!");
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
    const [a, b, c] = [ck[0].norm(), ck[1].norm(), ck[2].sub(ck[1]).norm()];

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
    let t = 0;
    for (let i = 0; i * delta < Math.PI / 2; i++) {
        t = i * delta;
        try {
            fold(t);
            break;
        } catch (e) {}
    }
    let obj = (t) => fold(t).slice(-1)[0];
    try {
        t = bisection(obj, ...brackets(obj, t, Math.PI / 4, iter).next().value, tol, iter).slice(-1);
    } catch (e) {
        throw new Error("impossible construction!");
    }
    const [pE, pF, pG] = fold(t).slice(0, -1);
    if (Number.isNaN(pE[0])) throw new Error("impossible construction!");

    obj = (t) =>
        pA
            .roro([0, 0, 1], t)
            .add([0, 0, pG[2] + pE[2]])
            .sub(pF)
            .norm() - b;

    try {
        t = bisection(obj, ...brackets(obj, 0, 2 * Math.PI, iter).next().value, tol, iter).slice(-1);
    } catch (e) {
        throw new Error("impossible construction!");
    }
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

function model_sa_error(PARAMS) {
    const tile = calc_tile(PARAMS.t, PARAMS.R);
    const ck = ck_vectors(tile.basis, PARAMS.h, PARAMS.k, PARAMS.H, PARAMS.K);
    const triangles = [
        [ck[3], ck[0]],
        [ck[0], ck[1]],
        [ck[1], ck[2]],
    ];
    // coordinates
    const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][PARAMS.a](ck, ITER, TOL);
    const config = ico_config(PARAMS.a);

    const n_tris = config.t_id.map((e) => parseInt(e[1])).reduce((a, b) => (a < b ? b : a));
    const n_per_tri = Array.from({ length: n_tris }).fill(0);
    config.t_id.forEach((e, i) => (n_per_tri[e[1] - 1] += config.t_rep[i]));
    const sa_net = triangles
        .slice(0, n_tris)
        .map((e, i) => ([...e[0], 0].cross([...e[1], 0]).norm() / 2) * n_per_tri[i])
        .sum();
    const sa_capsid = config.v_idx
        .map((e) => e.map((i) => ico_coors[i]))
        .map((e, i) => (e[1].sub(e[0]).cross(e[2].sub(e[0])).norm() / 2) * config.t_rep[i])
        .sum();
    return (sa_net - sa_capsid) / sa_net;
}

function lattice_config(h, k, H, K, R, t) {
    const tile = calc_tile(t, R);
    const ck = ck_vectors(tile.basis, h, k, H, K);

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
        e.data.offset = e.data.mer + (vertex_coordinates.some((v) => [e.position.x, e.position.y].sub(v).norm() <= tile.radius) ? 0 : 3);
        e.data.centroid = e.segments
            .map((e) => e.point)
            .reduce((a, b) => a.add(b))
            .divide(e.segments.length);
    });

    return { tile: tile, ck: ck, lattice: lattice };
}

function point_line_distance(p0, p1, p2) {
    return Math.abs((p2.y - p1.y) * p0.x - (p2.x - p1.x) * p0.y + p2.x * p1.y - p2.y * p1.x) / p1.getDistance(p2);
}

function is_point_on_path_border(e, p0, tol = 1e-5) {
    return e.curves.findIndex((c) => point_line_distance(p0, c.segment1.point, c.segment2.point) < tol);
}

function path_curves_to_points(c) {
    return c.curves.map((e) => [e.segment1.point, e.segment2.point]);
}

function calc_facets(lat_cfg, PARAMS) {
    const triangles = [
        [3, 0],
        [0, 1],
        [1, 2],
    ]
        .map((e) => [lat_cfg.ck[e[0]], lat_cfg.ck[e[1]]])
        .map((e) => new paper.Path({ segments: [[0, 0], ...e], closed: true, data: { vectors: [[0, 0], ...e] } }));

    const facets = triangles.map(
        (tri) =>
            new paper.Group({
                children: lat_cfg.lattice
                    .flatMap((tile) =>
                        tile.map((subtile) => {
                            const x = subtile.intersect(tri, { insert: false });
                            if (!x.segments.length) return x;
                            // console.log(
                            //     path_curves_to_points(x).map((e, i) => {
                            //         const [j, k] = e.map((f) => is_point_on_path_border(tri, f));
                            //         // return [i, (i + 1) % x.segments.length, j != -1 && j == k];
                            //         return j != -1 && j == k ? -1 : i;
                            //     })
                            // );
                            // console.log(
                            //     path_curves_to_points(x)
                            //         .map((e, i) => {
                            //             const [j, k] = e.map((f) => is_point_on_path_border(tri, f));
                            //             // return [i, (i + 1) % x.segments.length, j != -1 && j == k];
                            //             return j != -1 && j == k ? -1 : i;
                            //         })
                            //         .split(-1)
                            //         .map((e) => {
                            //             if (e.length < x.curves.length) e.push((e[e.length - 1] + 1) % x.curves.length);
                            //             return e;
                            //         })
                            // );
                            // console.log();
                            x.style.fillColor = PARAMS["mer_color_" + x.data.offset] + PARAMS["mer_alpha_" + x.data.offset];
                            x.data.strokes = path_curves_to_points(x)
                                .map((e, i) => {
                                    const [j, k] = e.map((f) => is_point_on_path_border(tri, f));
                                    return j != -1 && j == k ? -1 : i;
                                })
                                .split(-1)
                                .map((e) => {
                                    if (e.length < x.curves.length) e.push((e[e.length - 1] + 1) % x.curves.length);
                                    return e;
                                });
                            x.data.has_centroid = tri.contains(x.data.centroid);
                            x.data.centroid_on_vertex = x.segments.findIndex((e) => e.point.getDistance(x.data.centroid) < 1e-5) > -1;
                            return x;
                        })
                    )
                    .filter((e) => e.segments.length > 0)
                    .sort((a, b) => a.data.offset - b.data.offset),
                data: tri.data,
            })
    );
    triangles.forEach((e) => e.remove());
    return facets;
}

function draw_net(PARAMS) {
    // unpack
    const [h, k, H, K, R, t] = ["h", "k", "H", "K", "R", "t"].map((e) => PARAMS[e]);

    // lattice
    const lat_cfg = lattice_config(h, k, H, K, R, t);
    const ck = lat_cfg.ck;
    const facets = calc_facets(lat_cfg, PARAMS);

    let g;
    /****/ if (PARAMS.a === 5) {
        const unit1 = new paper.Group(facets.slice(0, 2)).rotate(-degrees(ck[0].angle([1, 0]))).scale(-1, 1);
        const unit2 = unit1.clone().rotate(180);
        const top_center = unit2.children[1].children
            .flatMap((e) => e.segments)
            .map((e) => e.point)
            .reduce((a, b) => (a.y < b.y ? a : b));
        unit2.position.x += unit1.children[0].bounds.right - top_center.x;
        unit2.position.y += unit1.children[0].bounds.height;
        g = new paper.Group({
            children: Array.from({ length: 5 })
                .flatMap((_, i) => {
                    const [u1, u2] = [unit1.clone(), unit2.clone()];
                    u1.position.x += i * unit1.children[0].bounds.width;
                    u2.position.x += i * unit1.children[0].bounds.width;
                    return [u1, u2];
                })
                .flatMap((e) => e.children),
            position: paper.view.center,
            style: { strokeWidth: PARAMS.line_size, strokeCap: "round", strokeJoin: "round" },
        });
        // clean-up
        [unit1, unit2].forEach((e) => e.remove());
    } else if (PARAMS.a === 3) {
        const angle = ck[0].angle([1, 0]);
        const unit1 = new paper.Group(facets).rotate(-degrees(angle)).scale(-1, 1);
        const unit0 = facets[0].clone().rotate(180);
        unit0.position.x += ck[0].norm() / 2;
        const centroid = [unit0.bounds.topLeft, unit0.bounds.topRight, unit0.bounds.bottomCenter].reduce((a, b) => a.add(b)).divide(3);
        const center1 = unit0.bounds.topRight.add(new paper.Point([1, 0].mul(ck[1].norm()).rot(-(Math.PI / 3 - ck[1].angle(ck[2])))));
        const center2 = unit0.bounds.topRight.add(new paper.Point([1, 0].mul(ck[2].norm()).rot(-(Math.PI / 3 - ck[1].angle(ck[2]) + ck[1].angle(ck[2])))));
        const f = new paper.Group([...[1, 2, 3].map((_, i) => unit1.clone().rotate(i * 120, centroid))]);
        f.children.slice(0, -1).forEach((e) => e.children[1].remove());
        const unit2 = f.clone().rotate(180);
        unit2.bounds.left = Math.min(center1.x, center2.x);
        unit2.bounds.bottom = unit0.bounds.topRight.y;
        unit2.position.y -= unit2.children[1].children[0].bounds.bottom - center1.y;
        unit2.children.forEach((e) => f.addChild(e.clone()));
        f.position = paper.view.center;
        g = new paper.Group({
            children: f.children.flatMap((e) => e.children.flat()),
            style: { strokeWidth: PARAMS.line_size, strokeCap: "round", strokeJoin: "round" },
        });
        // clean-up
        [unit0, unit1, unit2].forEach((e) => e.remove());
    } else if (PARAMS.a === 2) {
        const angle = ck[0].angle([1, 0]);
        const unit1 = new paper.Group(facets).rotate(-degrees(angle)).rotate(-60).scale(-1, 1);
        const unit2 = unit1.children[1].clone();
        const vector = unit1.children[0].bounds.topLeft.subtract(unit1.children[0].bounds.bottomCenter);
        unit2.position = unit2.position.add(vector);
        const unit3 = new paper.Group([unit1.clone(), unit1.children[0].clone().rotate(60, unit1.children[0].bounds.topRight), unit2.clone()]);
        const unit4 = unit3.clone().rotate(180, unit3.children[0].children[0].bounds.topRight);
        unit4.position = unit4.position.add(vector.rotate(240));
        const unit5 = new paper.Group([unit3, unit4]);
        const point1 = unit5.children[0].children[2].children
            .filter((e) => e.data.offset === 1)
            .flatMap((e) => e.segments.map((e) => e.point))
            .filter((e) => Math.abs(e.getDistance(unit5.children[0].children[1].bounds.bottomLeft) - ck[1].norm()) < 1e-5)
            .reduce((a, b) => (a.y < b.y ? b : a));
        const unit6 = unit5.clone();
        unit6.position = unit6.position.add(unit5.children[1].children[0].children[0].bounds.bottomRight.subtract(point1));
        const f = new paper.Group([unit5, unit6]);
        f.position = paper.view.center;
        const children = f.children.flatMap((e) => e.children).flatMap((e) => e.children);
        g = new paper.Group({
            children: [...children.filter((_, i) => i % 3 === 0).flatMap((e) => e.children), ...children.filter((_, i) => i % 3 !== 0)],
            style: { strokeWidth: PARAMS.line_size, strokeCap: "round", strokeJoin: "round" },
        });
        // clean-up
        [2, 5, 8, 11].forEach((e) => g.children[e].remove());
        [unit1, unit2, unit3, unit4, unit5, unit6].forEach((e) => e.remove());
    } else {
        throw new Error("invalid symmetry mode!");
    }

    facets.forEach((e) => e.remove());
    lat_cfg.lattice.forEach((e) => e.forEach((f) => f.remove()));
    g.children.forEach((e) =>
        e.children.forEach((e) => {
            const points = e.segments.map((e) => e.point);
            e.data.strokes.forEach((f) => new paper.Path({ segments: f.map((i) => points[i]), closed: points.length == f.length, style: { strokeColor: "black" } }));
        })
    );
    return g;
}

function draw_capsid(PARAMS) {
    // unpack
    const [h, k, H, K, R, t] = ["h", "k", "H", "K", "R", "t"].map((e) => PARAMS[e]);

    // lattice
    const lat_cfg = lattice_config(h, k, H, K, R, t);
    const facets = calc_facets(lat_cfg, PARAMS);

    // coordinates
    const ico_cfg = ico_config(PARAMS.a);
    const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][PARAMS.a](lat_cfg.ck, ITER, TOL);

    // transform
    const th = (2 * Math.PI) / PARAMS.a;
    const is_equilateral = h == H && k == K;
    const inflater = is_equilateral ? (e) => spherize(e, ico_coors[0].norm(), PARAMS.s) : (e) => cylinderize(e, ico_coors, PARAMS.a, PARAMS.s);
    const CAMERA = camera(...[PARAMS.θ, PARAMS.ψ, PARAMS.φ].map(radians));
    let results = [];
    for (let idx = 0, id = 0; idx < ico_cfg.t_idx.length; idx++) {
        const facet = facets[ico_cfg.t_idx[idx] - 1];
        const A = inv3(T(facet.data.vectors.map((e) => e.concat(1))));
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
                        .T()
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

    // fibers
    //// penton fibers
    const ico_coors_rot = ico_coors.map((e) => mmul(CAMERA, e.concat(1).T()).flat());
    let fibers = PARAMS["penton_fiber_toggle"]
        ? ico_cfg.v_con
              .map((e) =>
                  e
                      .map((f) => ico_coors_rot[f])
                      .reduce((a, b) => a.add(b), [0, 0, 0])
                      .uvec()
              )
              .map((e, i) => [ico_coors_rot[i], ico_coors_rot[i].add(e.mul(PARAMS.fiber_length))])
        : [];
    //// mer fibers
    fibers = fibers.concat(
        results
            .flatMap((e) => e.children)
            .filter((e) => PARAMS["mer_toggle_" + e.data.offset] && e.data.has_centroid)
            .map((e) => {
                const centroid = e.data.centroid;
                return [centroid, centroid.add(e.data.normal.mul(PARAMS.fiber_length))];
            })
    );
    //// group
    let fiber_groups = [];
    fibers.forEach((e) => {
        let i = 0;
        for (let g of fiber_groups) if (e[0].sub(g[0][0]).norm() < TOL_COLLAPSE) i = g.push(e);
        if (i === 0) fiber_groups.push([e]);
    });
    //// merge
    fibers = fiber_groups
        .map((e) => [
            e[0][0],
            e
                .map((f) => f[1])
                .reduce((a, b) => a.add(b), [0, 0, 0])
                .div(e.length),
        ])
        .map(
            (e) =>
                new paper.Path.Line({
                    from: e[0],
                    to: e[1],
                    data: { centroid: e[1].mul(2) },
                })
        );

    // knobs
    const knobs = PARAMS["knob_toggle"] ? fibers.map((e) => new paper.Path.Circle({ center: e.segments[1].point, radius: PARAMS.knob_size, data: { centroid: e.data.centroid } })) : [];
    results = results.concat(fibers).concat(knobs);

    // painter's algorithm
    results.sort((a, b) => a.data.centroid[2] < b.data.centroid[2]);
    const g = new paper.Group({
        children: results,
        position: paper.view.center,
        style: { strokeWidth: PARAMS.line_size, strokeCap: "round", strokeJoin: "round" },
    });

    // styling
    knobs.forEach((e) => {
        e.style.strokeColor = PARAMS.line_color + PARAMS.line_alpha;
        e.style.fillColor = PARAMS.knob_color + PARAMS.knob_alpha;
    });
    fibers.forEach((e) => {
        e.style.strokeColor = PARAMS.fiber_color + PARAMS.fiber_alpha;
        e.style.strokeWidth = PARAMS.fiber_size;
    });

    // clean-up
    facets.forEach((e) => e.remove());
    lat_cfg.lattice.forEach((e) => e.forEach((f) => f.remove()));

    return g;
}

if (typeof exports !== "undefined") {
    module.exports = { ico_axis_2, ico_axis_3, ico_axis_5 };
}
