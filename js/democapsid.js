Array.prototype.add = function (a) {
    return this.map((e, i) => e + a[i]);
};

Array.prototype.sub = function (a) {
    return this.map((e, i) => e - a[i]);
};

Array.prototype.mul = function (a) {
    return this.map((e) => e * a);
};

Array.prototype.div = function (a) {
    return this.map((e) => e / a);
};

Array.prototype.sum = function (initial_value = 0) {
    return this.reduce((a, b) => a + b, initial_value);
};

Array.prototype.dot = function (a) {
    return this.map((e, i) => e * a[i]).reduce((e, f) => e + f);
};

Array.prototype.cross2 = function (v) {
    return this[0] * v[1] - this[1] * v[0];
};

Array.prototype.cross3 = function (v) {
    return [this[1] * v[2] - this[2] * v[1], this[2] * v[0] - this[0] * v[2], this[0] * v[1] - this[1] * v[0]];
};

Array.prototype.centroid = function () {
    return this.reduce((a, b) => a.add(b), Array((this[0] ?? []).length).fill(0)).div(this.length);
};

Array.prototype.rot = function (t) {
    const [cos, sin] = [Math.cos(t), Math.sin(t)];
    return mmul(
        [
            [cos, -sin],
            [sin, cos],
        ],
        this.T(),
    ).flat();
};

Array.prototype.roro = function (k, t) {
    // https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
    return this.mul(Math.cos(t))
        .add(k.cross3(this).mul(Math.sin(t)))
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
        [[]],
    ).filter((e) => e.length);
};

Array.prototype.shoelace = function () {
    return this.map((e, i, a) => [e[0] * a[(i + 1) % a.length][1]] - [a[(i + 1) % a.length][0] * e[1]]).sum() / 2;
};

Array.prototype.cycle = function () {
    return this.map((e, i, a) => [a[i ? i - 1 : a.length - 1], e, a[(i + 1) % a.length]]);
};
const EPSILON = 1e-9;
const COS30 = Math.cos((Math.PI / 180) * 30);
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

function intersection(p1, q1, p2, q2) {
    //  http://paulbourke.net/geometry/pointlineplane/edge_intersection.py

    const [x1, y1, x2, y2, x3, y3, x4, y4] = [...p1, ...q1, ...p2, ...q2];

    d = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (Math.abs(d) < Number.EPSILON) {
        return [];
    }

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / d;
    if (ua < 0 || ua > 1) {
        return [];
    }

    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / d;
    if (ub < 0 || ub > 1) {
        return [];
    }

    return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)];
}

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
 * @return {Number} The determinant.
 */
function det2(A) {
    return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

/**
 * Calculate the 3x3 determinant.
 * @param {Array} A The 3x3 matrix.
 * @return {Number} The determinant.
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
 * @return {Number} The inverse.
 */
function inv2(A) {
    const d = det2(A);
    return [[A[1][1], -A[0][1]].div(d), [-A[1][0], A[0][0]].div(d)];
}

/**
 * Calculate the 3x3 inverse.
 * @param {Array} A The 3x3 matrix.
 * @return {Number} The inverse.
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
function p2c(p) {
    return [p.x, p.y];
}

function parse_number(value) {
    return Number.isNaN((result = parseFloat(value))) ? value : result;
}
function ccw(a, b, c) {
    // https://algs4.cs.princeton.edu/91primitives/
    // If the area is positive, then a->b->c is counterclockwise; if the area is negative, then a->b->c is clockwise; if the area is zero then a->b->c are collinear.
    // double area2 = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
    // if      (area2 < 0) return -1;
    // else if (area2 > 0) return +1;
    // else                return  0;
    return a[0] * b[1] - a[1] * b[0] + a[1] * c[0] - a[0] * c[1] + b[0] * c[1] - b[1] * c[0];
}

class Graph {
    constructor(hasher = (e) => e) {
        this.nodes = new Map();
        this.edges = new Map();
        this.neigh = new Map();
        this.hasher = hasher;
    }

    add_node(key, val) {
        this.nodes.set(key, val);
        this.neigh.getOrInsert(key, []);
        return this;
    }

    edgeify(src, tar) {
        const edge = [src, tar];
        const keys = edge.map((e) => this.hasher(e));
        return keys[0] < keys[1] ? [keys, edge] : [keys, edge].map((e) => e.toReversed());
    }

    add_edge(node1, node2) {
        const [keys, edge] = this.edgeify(node1, node2);
        [0, 1].forEach((i) => {
            this.add_node(keys[i], edge[i]);
            this.neigh.get(keys[i]).push(keys[(i + 1) % 2]);
        });
        this.edges.set(keys.join("-"), edge);
        return this;
    }

    add_edges(edges) {
        edges.forEach((e) => this.add_edge(e[0], e[1]));
        return this;
    }

    has_edge(node1, node2) {
        return this.edges.get(this.sort_edge(node1, node2)[1].join("-"));
    }

    neighbors(key) {
        return this.neigh.get(key) ?? [];
    }

    loopback(src, tar, path = new Set()) {
        // check cycle
        const [src_key, tar_key] = [src, tar].map((e) => this.hasher(e));
        if (path.has(src_key)) {
            return [
                //
                Array.from(path).map((e) => this.nodes.get(e)),
                path.values().next().value == src_key,
            ];
        }
        // build path
        path.add(src_key);
        // check source node only has no neighbors or is a sink
        if (this.neighbors(src_key).length <= 1) {
            return [Array.from(path).map((e) => this.nodes.get(e)), false];
        }
        // get neighbors
        // exclude source node
        // exclude those with exactly one neighbor
        const tar_neighbors = this.neighbors(tar_key)
            .filter((e) => e !== src_key)
            .filter((e) => this.neighbors(e).length > 1)
            .map((e) => this.nodes.get(e));
        // check if neighbors exist
        if (!tar_neighbors.length) {
            return [Array.from(path).map((e) => this.nodes.get(e)), false];
        }
        // get next node with minumum angle: src - tar - next
        const tar_to_src = src.subtract(tar); // TODO: generalize
        const idx = tar_neighbors
            .map((e) => tar_to_src.getDirectedAngle(e.subtract(tar))) // TODO: generalize
            .map((e, i) => [e, i])
            .toSorted((a, b) => b[0] < a[0])
            .toSorted((a, b) => (a[0] < 0) - (b[0] < 0))
            .slice(-1)[0][1];
        // recurse
        return this.loopback(tar, tar_neighbors[idx], path);
    }

    polygonize() {
        const keys = new Set();
        let paths = [];
        for (const [key, val] of this.edges) {
            let [path, closed] = this.loopback(val[0], val[1]);
            path = path.map((e) => [e.x, e.y]); // TODO: generalize to be js-library agnostic
            if (closed) {
                const centroid_value = path.centroid();
                const area_value = path.shoelace();
                const key = `[${centroid_value.map((e) => formatter.format(e)).join(",")}]_${formatter.format(area_value)}`;
                if (!keys.has(key) && area_value > 0) {
                    keys.add(key);
                    paths.push(path);
                }
            }
        }
        return paths;
    }
}
function triangle_circumcircle_center(p, q, r) {
    // https://en.wikipedia.org/wiki/Circumcircle#Higher_dimensions
    // triangle_circumcircle_center([0, 1.73205081, 2.99162946], [0, -2.90587844, 1.38259261], [0, 2.90587844, 1.38259261])
    // -> [0, 0, 0.49537554129916317]
    const [a, b] = [p.sub(r), q.sub(r)];
    const axb = a.cross3(b);
    return b
        .mul(a.norm() ** 2)
        .sub(a.mul(b.norm() ** 2))
        .cross3(axb)
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
            .cross3(e2)
            .mul(e3.norm() ** 2)
            .add(e3.cross3(e1).mul(e2.norm() ** 2))
            .add(e2.cross3(e3).mul(e1.norm() ** 2))
            .div(2 * det3([e1, e2, e3])),
    );
}

function body_radius(coors) {
    return coors[6].sub([0, 0, coors[6][2]]).norm();
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
    const p = [q[0], q[1], 0];
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
        [v, k] = [pD.sub(pB).uvec().mul(b), pD.cross3(pB).uvec()];
        const o = v.roro(k, t);
        const [p, q] = [pB.add(o.proj(v)), pB.add(o)];
        [v, k] = [q.sub(p), pB.sub(pD).uvec()];
        const f = (t) => c - p.add(v.roro(k, t)).sub(pF).norm();
        t = bisection(f, ...brackets(f, 0, 2 * Math.PI, iter).next().value, tol, iter).slice(-1);
        const pG = p.add(v.roro(k, t));
        return [pD, pF, pG, Math.abs(pD[1]) - pG.sub([0, 0, pG[2]]).norm()];
    }

    // TODO: parameterize increment...
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
        [v, k] = [pC.sub(pA).uvec().mul(b), pC.cross3(pA).uvec()];
        const o = v.roro(k, t);
        p = pA.add(o.proj(v));
        const q = pA.add(o);
        [v, k] = [q.sub(p), pA.sub(pC).uvec()];
        const f = (t) => c - p.add(v.roro(k, t)).sub(pF).norm();
        t = bisection(f, ...brackets(f, 0, 2 * Math.PI, iter).next().value, tol, iter).slice(-1);
        const pG = p.add(v.roro(k, t));

        return [pE, pF, pG, pE.sub([0, 0, pE[2]]).norm() - pG.sub([0, 0, pG[2]]).norm()];
    }

    // TODO: parameterize increment...
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
class Wythoff {
    static vec = [
        [0, 0],
        [0, COS30],
        [0.5, COS30],
    ];

    static constructions = {
        dualhex: [[1, 0, 0], [0, 0, 0], null],
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
        const ref = this.ref.children.map((e) => e.data.selected);
        const [width, height, topleft] = [this.mir.bounds.width, this.mir.bounds.height, this.mir.bounds.topLeft];
        const gen = [((this.gen.position.x - topleft.x) / width) * 0.5, ((this.gen.position.y - topleft.y) / height) * COS30];
        return [
            //
            [this.mir.children.map((e) => e.data.selected)],
            [ref],
            ref.some((e) => e) ? gen : [NaN, NaN],
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
        if (generator && generator.length == 2 && generator.every((e) => !Number.isNaN(e))) {
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
    const lines = new paper.Group(calc_snub_lines().map((e) => new paper.Path.Line({ from: e[0], to: e[1] })));
    return new paper.Group({
        children: Array.from({ length: 6 }, (_, i) => lines.clone().rotate(i * 60, [0, 0])).flatMap((e) => e.children),
        insert: false,
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
            const x = tile.clone({ insert: false });
            x.position = e.coor;
            return x;
        }),
        position: paper.view.center,
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
                    insert: false,
                }),
        );
    const keys = [...new Set(paths.map((e) => e.data.key))];
    const colors = new Map(keys.map((e, i) => [e, P.palette[i]]));
    paths.forEach((e) => (e.fillColor = colors.get(e.data.key)));
    const result = new paper.Group({
        children: [...paths, lattice],
        strokeCap: "round",
        strokeJoin: "round",
        strokeColor: P.palette.slice(-1)[0],
        strokeWidth: P.width,
    });
    lattice.remove();
    return result;
}

function calculate_basis(R) {
    return (basis = [
        [2, 0],
        [1, SQRT3],
    ].map((e) => e.mul(R * (SQRT3 / 2))));
}

function render_facets(paper, tile, P = get_params()) {
    const ctr = [paper.view.center.x, paper.view.center.y];
    const basis = calculate_basis(P.R);
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
                insert: false,
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
    const facets = triangles.map(
        (e) =>
            new paper.Group({
                children: paths
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
                                if (P.outline === "on" || f.data.original[i]) {
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
                insert: false,
            }),
    );
    paths.forEach((e) => e.remove());
    triangles.forEach((e) => e.remove());
    lattice.remove();
    return [facets, triangles];
}

function render_net(paper, facets, P = get_params()) {
    let g = null;
    const basis = calculate_basis(P.R);
    const ck = ck_vectors(basis, P.h, P.k, P.H, P.K, P.t === "levo");
    if (P.a === 5) {
        const u = new paper.Group(facets.slice(0, 2).map((e) => e.clone()));
        const v = u
            .clone()
            .rotate(180, ck[0])
            .translate(ck[1].sub(ck[0].mul(2)));
        g = new paper.Group({
            children: [u, v].flatMap((e) => Array.from({ length: 5 }, (_, i) => e.clone().translate(ck[0].mul(i)))).flatMap((e) => e.children),
            position: paper.view.center,
        }).rotate(-degrees(Math.atan2(ck[0].dot([0, 1]), ck[0][0] * 1 - ck[0][1] * 0)));
        [u, v].forEach((e) => e.remove());
    } else if (P.a === 3) {
        const centroid = [[0, 0], ck[0], ck[3]].centroid();
        const u = new paper.Group(facets.slice(0, 1).map((e) => e.clone()));
        const v = new paper.Group(facets.slice(0, 3).map((e) => e.clone())).translate(ck[0]).rotate(-60, ck[0]);
        const w = new paper.Group([u.clone(), ...Array.from({ length: 3 }, (_, i) => v.clone().rotate(i * 120, centroid))]);
        const p = ck[0].add(ck[1].rot(Math.PI / 3).rot((4 * Math.PI) / 3));
        g = new paper.Group({
            children: [w.clone(), w.clone().translate(ck[0].add(p)).rotate(60, p)].flatMap((e) => e.children).flatMap((e) => e.children),
            position: paper.view.center,
        }).rotate(-degrees(Math.atan2(ck[0].dot([0, 1]), ck[0][0] * 1 - ck[0][1] * 0)) - 30);
        [u, v, w].forEach((e) => e.remove());
    } else if (P.a === 2) {
        const u = new paper.Group(facets.slice(0, 3).map((e) => e.clone()));
        const v = new paper.Group([...u.clone().children, u.children[0].clone().rotate(60, ck[0]), u.children[2].clone().translate(ck[0])]);
        const w = new paper.Group([v.clone(), v.clone().rotate(180, ck[3]).translate(ck[3].mul(-1))]);
        g = new paper.Group({
            children: [w.clone(), w.clone().translate(ck[1].mul(-1).add(ck[0].mul(-2)).add(ck[3]))].flatMap((e) => e.children).flatMap((e) => e.children),
            position: paper.view.center,
        }).rotate(-degrees(Math.atan2(ck[0].dot([0, 1]), ck[0][0] * 1 - ck[0][1] * 0)) - 30);
        [u, v, w].forEach((e) => e.remove());
    }
    return g;
}

function render_capsid(paper, ftri, P = get_params()) {
    const [facets, triangles] = ftri;

    // coordinates
    const ico_cfg = ico_config(P.a);
    const basis = calculate_basis(P.R);
    const ck = ck_vectors(basis, P.h, P.k, P.H, P.K, P.t === "levo");
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
        const area = V[1].sub(V[0]).cross3(V[2].sub(V[0])).norm() / 2;
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
                            normal: segments.length > 2 ? segments[1].sub(segments[0]).cross3(segments[2].sub(segments[0])).uvec() : [],
                            segments_3D: segments,
                        }),
                        style: E.style,
                    });
                });
            });
            results = results.concat(
                new paper.Group({
                    children: xfacet,
                    data: {
                        area: area,
                        centroid: mmul(CAMERA, inflater(X.centroid()).concat(1).T()).flat(),
                        type: "facet",
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
        data: { ico_coors: ico_coors },
    });
}
