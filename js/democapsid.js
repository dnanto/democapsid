// constants
//// math
const phi = (1 + Math.sqrt(5)) / 2;
const root3 = Math.sqrt(3);
//// numerical
const BRACKET_ITER = 10000;
const BISECTION_ITER = 10000;
//// render
const MIN_POINT_RADIUS = 0.0001;
const COLLAPSE_THRESHOLD = 1;

/**
 * @class Matrix math.
 */
class Matrix {
    /**
     * Matrix multiplication.
     * @param {Array} A The m x n matrix.
     * @param {Array} B The n x p matrix.
     * @return {Array} The m x p matrix.
     */
    static mul(A, B) {
        const [m, n, p] = [A.length, A[0].length, B[0].length];
        var C = new Array(m);
        for (var e = 0; e < m; e++) C[e] = new Array(p).fill(0);
        for (var i = 0; i < m; i++) for (var j = 0; j < p; j++) for (var k = 0; k < n; k++) C[i][j] += A[i][k] * B[k][j];
        return C;
    }

    /**
     * Calculate the 3x3 determinant.
     * @param {Array} A The 3x3 matrix.
     * @return {Number} The determinant;
     */
    static det3(A) {
        return (
            A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - //
            A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + //
            A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
        );
    }

    /**
     * Calculate the 3x3 inverse.
     * @param {Array} A The 3x3 matrix.
     * @return {Number} The inverse;
     */
    static inv3(A) {
        const [a, b, c, d, e, f, g, h, i] = [A[0][0], A[0][1], A[0][2], A[1][0], A[1][1], A[1][2], A[2][0], A[2][1], A[2][2]];
        const dA = this.det3(A);
        return [
            [(e * i - f * h) / dA, -(b * i - c * h) / dA, (b * f - c * e) / dA],
            [-(d * i - f * g) / dA, (a * i - c * g) / dA, -(a * f - c * d) / dA],
            [(d * h - e * g) / dA, -(a * h - b * g) / dA, (a * e - b * d) / dA],
        ];
    }
}

/**
 * @class Camera math.
 */
class Camera {
    /**
     * @constructor
     */
    constructor() {
        // axis rotation degrees
        [this.θ, this.ψ, this.φ] = [0, 0, 0];
        // rotation
        this.R = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ];
        // calibration
        this.K = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ];
        // translation
        this.C = [0, 0, 0];
        // camera matrix
        this.P = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
        this.update();
    }

    /**
     * Update the camera matrix.
     */
    update() {
        // trigonometry
        const [sinθ, sinψ, sinφ, cosθ, cosψ, cosφ] = [Math.sin(this.θ), Math.sin(this.ψ), Math.sin(this.φ), Math.cos(this.θ), Math.cos(this.ψ), Math.cos(this.φ)];
        // rotation matrix
        this.R = [
            [cosθ * cosψ, cosθ * sinψ * sinφ - sinθ * cosφ, cosθ * sinψ * cosφ + sinθ * sinφ],
            [sinθ * cosψ, sinθ * sinψ * sinφ + cosθ * cosφ, sinθ * sinψ * cosφ - cosθ * sinφ],
            [-sinψ, cosψ * sinφ, cosψ * cosφ],
        ];
        // translation matrix
        const IC = [
            [1, 0, 0, -this.C[0]],
            [0, 1, 0, -this.C[1]],
            [0, 0, 1, -this.C[2]],
        ];
        // camera matrix
        this.P = Matrix.mul(Matrix.mul(this.K, this.R), IC);
    }
}

class Icosahedron {
    constructor(edge1, edge2 = undefined, theta = radians(-60)) {
        this.setEdges(edge1, edge2, theta);
    }

    setEdges(edge1, edge2, theta) {
        const b = edge1 / 2;
        const a = phi * b;

        var cam = new Camera();
        cam.φ = radians(90 - degrees(Math.atan2(1 / (2 * phi), 0.5)));
        // this.setEdges2(edge1, edge2, theta);
        cam.update();

        const v = [
            [0, b, -a, 1],
            [b, a, 0, 1],
            [-b, a, 0, 1],
            [0, -b, -a, 1],
            [a, 0, -b, 1],
            [-a, 0, -b, 1],
        ].map((vert) =>
            Matrix.mul(
                cam.P,
                vert.map((e) => [e])
            )
        );

        const A = [v[2][0][0] + edge2 * Math.cos(theta), v[2][1][0] + edge2 * Math.sin(theta), v[2][2][0]];

        const B = [A[0], v[2][1][0], v[2][2][0]];
        const r1 = Math.sqrt(v[2][0][0] * v[2][0][0] + v[2][2][0] * v[2][2][0]);
        const C = [A[0], A[1], Math.sqrt(r1 * r1 - A[0] * A[0])];
        const r2 = A[1] - B[1];
        const D = [C[0], B[1] - Math.sqrt(-(B[2] * B[2]) + 2 * B[2] * C[2] + r2 * r2 - C[2] * C[2]), C[2]];
        const a72 = radians(-72);
        var cy = (B[1] + D[1]) / 2;
        this.vertexes = v
            .map((e) => [e[0][0], e[1][0], e[2][0], 1])
            .concat([
                [D[0], D[1], D[2], 1],
                [Math.cos(a72 * 1) * D[0] - Math.sin(a72 * 1) * D[2], D[1], Math.sin(a72 * 1) * D[0] + Math.cos(a72 * 1) * D[2], 1],
                [Math.cos(a72 * 2) * D[0] - Math.sin(a72 * 2) * D[2], D[1], Math.sin(a72 * 2) * D[0] + Math.cos(a72 * 2) * D[2], 1],
                [Math.cos(a72 * 3) * D[0] - Math.sin(a72 * 3) * D[2], D[1], Math.sin(a72 * 3) * D[0] + Math.cos(a72 * 3) * D[2], 1],
                [Math.cos(a72 * 4) * D[0] - Math.sin(a72 * 4) * D[2], D[1], Math.sin(a72 * 4) * D[0] + Math.cos(a72 * 4) * D[2], 1],
                [0, cy - (v[0][1][0] - cy), 0, 1],
            ]);

        this.faceIndexes = [
            // cap
            [1, 0, 2],
            [4, 0, 1],
            [3, 0, 4],
            [5, 0, 3],
            [2, 0, 5],
            // mid
            [1, 6, 2],
            [6, 1, 7],
            [4, 7, 1],
            [7, 4, 8],
            [3, 8, 4],
            [8, 3, 9],
            [5, 9, 3],
            [9, 5, 10],
            [2, 10, 5],
            [10, 2, 6],
            // cap
            [7, 6, 11],
            [8, 7, 11],
            [9, 8, 11],
            [10, 9, 11],
            [6, 10, 11],
        ];
        this.vertexNeighbors = [];
        this.vertexNeighbors = Array(12)
            .fill(0)
            .map(() => new Set());
        this.faceIndexes.forEach((e) => {
            this.vertexNeighbors[e[0]].add(e[1]);
            this.vertexNeighbors[e[0]].add(e[2]);
            this.vertexNeighbors[e[1]].add(e[0]);
            this.vertexNeighbors[e[1]].add(e[2]);
            this.vertexNeighbors[e[2]].add(e[0]);
            this.vertexNeighbors[e[2]].add(e[1]);
        });
        this.vertexNeighbors = this.vertexNeighbors.map((e) => Array.from(e));
        this.cap = [0, 1, 2, 3, 4, 15, 16, 17, 18, 19];
    }

    setEdges3(edge1, edge2, theta) {
        console.log(edge1, edge2);
        const b = edge1 / 2;
        const a = phi * b;

        // default points
        var p = [
            [0, b, -a, 1],
            [b, a, 0, 1],
            [-b, a, 0, 1],
            [0, b, a, 1],
            [a, 0, -b, 1],
            [-a, 0, -b, 1],
        ];

        // transform points
        var c = centroid([p[1], p[2], p[3]]).slice(0, -1);
        var cam = new Camera();
        cam.φ = angle2([0, 0, 0], [0, c[1], 0], c);
        cam.update();
        p = p.map((vert) =>
            Matrix.mul(
                cam.P,
                vert.map((e) => [e])
            )
        );

        var u = unitVector(subtract(p[1], p[3]));
        var v = [u[1], -u[0], 0];
        var w = sarrus(u, v);
        var K = unitVector(w);
        // console.log(u, v, w);

        // u cos(β) + (K ⊗ u) sin(β) + K (K u) (1-cos(β));
        var beta = Math.abs(theta);
        var B1 = u.map((e) => e * Math.cos(beta));
        var B2 = sarrus(K, u).map((e) => e * Math.sin(beta));
        var B3 = K.map((e) => e * dot(K, u)).map((e) => e * (1 - Math.cos(beta)));
        var h = edge2;
        var p4 = p[3].map((e) => e[0]);
        var B = add(
            p4,
            add(add(B1, B2), B3).map((e) => h * e)
        );
        // console.log(B);
        var d = subtract(B, p4);
        var C = add(
            p4,
            u.map((e) => (e * dot(d, u)) / dot(u, u))
        );
        // console.log(C);
        var r = length(subtract(B, C));
        var e = unitVector(subtract(B, C));
        var uxe = unitVector(sarrus(u, e));
        const f = (t, i) => {
            return r * e[i] * Math.cos(t) + r * uxe[i] * Math.sin(t) + C[i];
        };
        const ff = (t) => {
            // return Math.pow(p[3][2][0], 2) - (Math.pow(f(t, 0), 2) + Math.pow(f(t, 2), 2));
            return r * r - (Math.pow(f(t, 0), 2) + Math.pow(f(t, 2), 2));
        };
        const tt = Array.from(brackets(ff, 0, 2 * Math.PI, BRACKET_ITER))
            .map((e) => bisection(ff, e[0], e[1], Number.EPSILON, BISECTION_ITER))
            .reduce((a, b) => (f(a, 1) < f(b, 1) ? a : b));
        const a120 = radians(-120);
        const a60 = radians(-60);
        var E = [f(tt, 0), f(tt, 1), f(tt, 2), 1];
        // console.log(">E", E);
        var yval = E[1] - (p[0][1] - p[3][1]);
        var F = [E[0], yval, E[2]];
        F = [Math.cos(a60 * 1) * F[0] - Math.sin(a60 * 1) * F[2], F[1], Math.sin(a60 * 1) * F[0] + Math.cos(a60 * 1) * F[2]];
        F = unitVector(subtract(F, [0, yval, 0])).map((e) => e * Math.abs(p[0][2][0]));
        F = [F[0], yval, F[2], 1];
        console.log(F);
        this.vertexes = p
            .map((e) => [e[0][0], e[1][0], e[2][0], 1])
            .concat([
                [E[0], E[1], E[2], 1],
                [Math.cos(a120 * 1) * E[0] - Math.sin(a120 * 1) * E[2], E[1], Math.sin(a120 * 1) * E[0] + Math.cos(a120 * 1) * E[2], 1],
                [Math.cos(a120 * 2) * E[0] - Math.sin(a120 * 2) * E[2], E[1], Math.sin(a120 * 2) * E[0] + Math.cos(a120 * 2) * E[2], 1],
                [F[0], F[1], F[2], 1],
                [Math.cos(a120 * 1) * F[0] - Math.sin(a120 * 1) * F[2], F[1], Math.sin(a120 * 1) * F[0] + Math.cos(a120 * 1) * F[2], 1],
                [Math.cos(a120 * 2) * F[0] - Math.sin(a120 * 2) * F[2], F[1], Math.sin(a120 * 2) * F[0] + Math.cos(a120 * 2) * F[2], 1],
            ]);

        this.faceIndexes = [
            // cap
            [0, 1, 2],
            [2, 3, 1],
            [1, 4, 0],
            [0, 5, 2],
            // mid
            [1, 6, 3],
            [1, 6, 4], // 5
            [4, 7, 0],
            [0, 7, 5], // 7
            [5, 8, 2],
            [2, 8, 3], // 9
            [6, 9, 4], // A
            [9, 4, 7],
            [7, 10, 5], // C
            [10, 5, 8],
            [8, 11, 3], // E
            [11, 3, 6],
            // // cap
            [9, 10, 11],
            [9, 11, 6],
            [9, 10, 7],
            [10, 11, 8],
        ];
        this.vertexNeighbors = [];
        this.vertexNeighbors = Array(12)
            .fill(0)
            .map(() => new Set());
        this.faceIndexes.forEach((e) => {
            this.vertexNeighbors[e[0]].add(e[1]);
            this.vertexNeighbors[e[0]].add(e[2]);
            this.vertexNeighbors[e[1]].add(e[0]);
            this.vertexNeighbors[e[1]].add(e[2]);
            this.vertexNeighbors[e[2]].add(e[0]);
            this.vertexNeighbors[e[2]].add(e[1]);
        });
        this.vertexNeighbors = this.vertexNeighbors.map((e) => Array.from(e));
        this.cap = [0, 1, 2, 3, 16, 17, 18, 19];
        this.face2 = [5, 7, 9, 10, 12, 14];
    }

    isCap(i) {
        return this.cap.some((e) => e === i);
    }

    /**
     * Calculate the 3D vertex projections.
     * @param {Array} P The camera matrix.
     */
    projectVertexes(P) {
        return this.vertexes.map((v) =>
            Matrix.mul(
                P,
                v.map((e) => [e])
            )
        );
    }

    /**
     * Calculate the 3D face projections.
     * @param {Array} P The camera matrix.
     */
    projectFaces(P) {
        var v = this.projectVertexes(P).map((e) => [e[0][0], e[1][0], e[2][0]]);
        return this.faceIndexes.map((e) => [v[e[0]], v[e[1]], v[e[2]]]);
    }

    projectVertexFibers(P, F) {
        var v = this.projectVertexes(P).map((e) => [e[0][0], e[1][0], e[2][0]]);
        return ico.vertexNeighbors.map((e, i) => {
            const x = 5 * v[i][0] - (v[e[0]][0] + v[e[1]][0] + v[e[2]][0] + v[e[3]][0] + v[e[4]][0]);
            const y = 5 * v[i][1] - (v[e[0]][1] + v[e[1]][1] + v[e[2]][1] + v[e[3]][1] + v[e[4]][1]);
            const z = 5 * v[i][2] - (v[e[0]][2] + v[e[1]][2] + v[e[2]][2] + v[e[3]][2] + v[e[4]][2]);
            const d = Math.sqrt(x * x + y * y + z * z);
            return [v[i], [v[i][0] + (x / d) * F, v[i][1] + (y / d) * F, v[i][2] + (z / d) * F]];
        });
    }
}

class Hex {
    constructor(h = 0, k = 0, H = 0, K = 0) {
        // hexagonal circumradius
        this.R6 = 1;
        // haxagonal inradius
        this.r6 = (root3 / 2) * this.R6;
        // triangular circumradius
        this.R3 = (this.R6 * root3) / 3;
        // triangular inradius
        this.r3 = (this.R6 * root3) / 6;
        // grid x-offset
        this.dx = 2 * this.r6;
        // grid y-offset
        this.dy = 1.5 * this.R6;
        this.ddx = this.r6;
        this.ddy = 0;

        this.RU = this.R6;

        this.h = h;
        this.k = k;
        this.H = H;
        this.K = K;
    }

    hvec() {
        return new Point(this.dx * this.h, this.ddy * this.h);
    }

    kvec() {
        return new Point(this.dx * this.k, this.ddy * this.k).rotate(60);
    }

    Hvec() {
        return new Point(this.dx * this.H, this.ddy * this.H).rotate(60);
    }

    Kvec() {
        return new Point(this.dx * this.K, this.ddy * this.K).rotate(120);
    }

    tvec() {
        return this.hvec().add(this.kvec());
    }

    qvec() {
        return this.Hvec().add(this.Kvec());
    }

    Tvec() {
        return this.tvec().clone().rotate(120);
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var hex = new Path.RegularPolygon([0, 0], 6, this.R6);
        hex.name = "mer-1";
        var cir = new Path.Circle([0, 0], this.RU);
        cir.name = "cir-1";
        return [hex, cir];
    }

    /**
     * Map the grid to cartesian coordinate
     * @param {*} i the row index
     * @param {*} j the column index
     * @returns the coordinate
     */
    coor(i, j) {
        return [i * this.dx + j * this.ddx, j * this.dy + i * this.ddy];
    }

    *grid(xc, xr) {
        const u = new Group(this.unit(this.R6));
        for (var i = xc[0]; i <= xc[1]; i++) {
            for (var j = xr[0]; j <= xr[1]; j++) {
                var v = u.clone();
                v.position = new Point(this.coor(i, j));
                yield v;
            }
        }
        u.remove();
    }

    intersect_grid(T, G, v, opt) {
        return G.map((u) => {
            return u.children
                .flatMap((f) => {
                    var result = [];
                    var x = T.intersect(f);
                    if (x.segments.length >= 1) {
                        const c = centroidSegments(f.segments);
                        x.name = f.name;
                        x.type = v.some((g) => c.getDistance(g) < this.RU) ? "pen" : "hex";
                        x.style = opt[x.type + "." + x.name.split(" ")[0]];
                        result.push(x);
                        var y = new Path.Circle(c, MIN_POINT_RADIUS);
                        if (T.contains(y)) {
                            var o = T.intersect(y);
                            o.name = "ctr-1";
                            o.data["type"] = x.type;
                            o.data["name"] = x.name.split(" ")[0];
                            result.push(o);
                            o.remove();
                        }
                        y.remove();
                    }
                    x.remove();
                    return result;
                })
                .filter((f) => f.segments.length >= 1);
        });
    }

    face(opt = {}) {
        const tvec = this.tvec();

        const nc = [0, this.h + this.k];
        const nr = [-this.h, this.k];
        const vt = [[0, 0], tvec, tvec.rotate(-60)];

        var T = new Path([[0, 0], tvec, tvec.rotate(-60)]);
        T.closePath();

        var g = Array.from(this.grid(nc, nr));
        var G = new Group(this.intersect_grid(T, g, vt, opt).flat());
        G.style = opt.face;
        G.rotate(-tvec.angle);
        G.scale(opt.levo ? -1 : 1, 1);

        T.remove();
        g.forEach((e) => e.remove());

        return G;
    }

    face5(opt = {}) {
        const tvec = this.tvec();
        const qvec = this.qvec();

        const nc = [-this.K, this.h + this.k];
        const nr = [-this.h, this.k + (this.H + this.K > this.k ? this.H + this.K - this.k : 0)];
        const vt = [[0, 0], tvec, tvec.rotate(-60), qvec];

        var T1 = new Path([[0, 0], tvec, tvec.rotate(-60)]);
        T1.closePath();
        var T2 = new Path([0, 0], qvec, tvec);
        T2.closePath();

        var g = Array.from(this.grid(nc, nr));
        var G1 = new Group(this.intersect_grid(T1, g, vt, opt).flat());
        var G2 = new Group(this.intersect_grid(T2, g, vt, opt).flat());
        var G = new Group([G1, G2]);
        G.style = opt.face;
        G.rotate(-tvec.angle);
        G.scale(opt.levo ? -1 : 1, 1);

        T1.remove();
        T2.remove();
        g.forEach((e) => e.remove());

        return G;
    }

    face3(opt = {}) {
        const tvec = this.tvec();
        const qvec = this.qvec();
        const Tvec = this.Tvec();

        const nc = [-(this.h + this.k > this.K ? this.h + this.k : this.K), this.h + this.k];
        const nr = [-this.h - this.k, this.h > this.k + this.K ? this.h : this.k + this.K];
        const vt = [[0, 0], tvec, tvec.rotate(-60), tvec.rotate(-120), qvec, Tvec];

        var T1 = new Path([[0, 0], tvec, tvec.rotate(-60)]);
        T1.closePath();
        var T2 = new Path([0, 0], qvec, tvec);
        T2.closePath();
        var T3 = new Path([0, 0], Tvec, qvec);
        T3.closePath();
        var T4 = T1.clone().rotate(-60, [0, 0]);

        var g = Array.from(this.grid(nc, nr));
        var G = new Group(
            new Group(this.intersect_grid(T1, g, vt, opt).flat()),
            new Group(this.intersect_grid(T2, g, vt, opt).flat()),
            new Group(this.intersect_grid(T3, g, vt, opt).flat()),
            new Group(this.intersect_grid(T4, g, vt, opt).flat())
        );
        G.style = opt.face;
        G.rotate(-tvec.angle);

        T1.remove();
        T2.remove();
        T3.remove();
        T4.remove();
        g.forEach((e) => e.remove());

        return G;
    }

    face2(opt = {}) {}
}

class TriHex extends Hex {
    constructor(h = 0, k = 0, H = 0, K = 0) {
        super(h, k, H, K);
        this.r6 = (root3 / 2) * this.R6;
        this.dx = 2 * this.R6;
        this.dy = 2 * this.r6;
        this.ddx = this.R6;
        this.RU = this.r6 + 0.5 * root3 * this.R6;
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var tri = new Path.RegularPolygon([0, -this.r6 - this.r3], 3, this.R3);
        tri.name = "mer-2";
        var hex = new Path.RegularPolygon([0, 0], 6, this.R6).rotate(30);
        hex.name = "mer-1";
        var cir = new Path.Circle([0, 0], this.RU);
        cir.name = "cir-1";
        return [tri, tri.clone().rotate(60, [0, 0]), hex, cir];
    }
}

class SnubHex extends Hex {
    constructor(h = 0, k = 0, H = 0, K = 0) {
        super(h, k, H, K);
        this.r6 = (root3 / 2) * this.R6;
        this.dx = 2.5 * this.R6;
        this.dy = 3 * this.r6;
        this.ddy = this.r6;
        this.ddx = 0.5 * this.R6;
        this.RU = 2.0 * this.R6;
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var tri1 = new Path.RegularPolygon([0, -this.r6 - this.r3], 3, this.R3);
        tri1.name = "mer-2";
        var tri2 = tri1.clone().rotate(-180, tri1.bounds.bottomLeft);
        tri2.name = "mer-2";
        var tri3 = tri2.clone().rotate(-180, tri2.bounds.bottomCenter);
        tri3.name = "mer-2";
        var hex = new Path.RegularPolygon([0, 0], 6, this.R6).rotate(30);
        hex.name = "mer-1";
        var cir = new Path.Circle([0, 0], this.RU);
        cir.name = "cir-1";
        return [
            tri1,
            tri1.clone().rotate(-60, tri1.bounds.bottomLeft),
            tri1.clone().rotate(-120, tri1.bounds.bottomLeft),
            tri2,
            tri2.clone().rotate(-60, tri2.bounds.bottomCenter),
            tri2.clone().rotate(-120, tri2.bounds.bottomCenter),
            tri3,
            tri3.clone().rotate(-60, tri3.bounds.bottomRight),
            hex,
            cir,
        ];
    }
}

class RhombiTriHex extends Hex {
    constructor(h = 0, k = 0, H = 0, K = 0) {
        super(h, k, H, K);
        this.r6 = (root3 / 2) * this.R6;
        this.dx = 2 * this.r6 + this.R6;
        this.dy = 0.5 * this.R6 + (this.R6 * root3) / 2 + this.R6;
        this.ddx = this.r6 + this.R6 / 2;
        this.RU = Math.sqrt(Math.pow(this.r6 + this.R6, 2) + Math.pow(this.R6 / 2, 2));
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var hex = new Path.RegularPolygon([0, 0], 6, this.R6);
        hex.name = "mer-1";
        var sqr = new Path.RegularPolygon([0, 0], 4, Math.sqrt(2 * this.R6 * this.R6) / 2);
        sqr.name = "mer-3";
        sqr.bounds.x = hex.bounds.left - sqr.bounds.width;
        var tri = new Path.RegularPolygon([0, 0], 3, this.R3);
        tri.position.y = hex.bounds.bottom + (this.R6 * root3) / 2 / 2;
        tri.name = "mer-2";
        var cir = new Path.Circle([0, 0], this.RU);
        cir.name = "cir-1";
        return [sqr, sqr.clone().rotate(60, [0, 0]), sqr.clone().rotate(120, [0, 0]), tri, tri.clone().rotate(60, [0, 0]), hex, cir];
    }
}

class DualHex extends Hex {
    constructor(h = 0, k = 0, H = 0, K = 0) {
        super(h, k, H, K);
    }
}

class DualTriHex extends Hex {
    constructor(h = 0, k = 0, H = 0, K = 0) {
        super(h, k, H, K);
        this.dx = 4 * this.R6;
        this.dy = (4 * this.R6 * root3) / 2;
        this.ddx = 2 * this.R6;
        this.RU = 2 * (this.r6 + this.r3);
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var path1 = new Path([
            [0, 0],
            [0, -this.r6 - this.r3],
            [-this.R6, -2 * this.r6],
            [-this.R6, -this.R3],
        ]);
        path1.closed = true;
        path1.name = "mer-1";
        var path2 = path1.clone().rotate(-60, path1.bounds.topLeft);
        path2.name = "mer-2";
        var path3 = path1.clone().rotate(-300, path1.bounds.topLeft);
        path3.name = "mer-2";
        var path4 = path3.clone().rotate(-240, path3.bounds.bottomLeft);
        path4.name = "mer-2";
        var path5 = path4.clone().rotate(-240, path4.bounds.bottomRight);
        path5.name = "mer-2";
        var path6 = path5.clone().rotate(-240, path5.bounds.rightCenter);
        path6.name = "mer-2";
        var path7 = path2.clone().rotate(240, path2.bounds.rightCenter);
        path7.name = "mer-2";
        var cir = new Path.Circle([0, 0], this.RU);
        cir.name = "cir-1";
        return [
            path1,
            path1.clone().rotate(-60, [0, 0]),
            path1.clone().rotate(-120, [0, 0]),
            path1.clone().rotate(-180, [0, 0]),
            path1.clone().rotate(-240, [0, 0]),
            path1.clone().rotate(-300, [0, 0]),
            path2,
            path3,
            path4,
            path5,
            path6,
            path7,
            cir,
        ];
    }
}

class DualSnubHex extends Hex {
    constructor(h = 0, k = 0, H = 0, K = 0) {
        super(h, k, H, K);
        this.dx = 2.5 * this.R6;
        this.dy = 2 * this.r6 + 2 * ((this.R6 * root3) / 3) - (this.R6 * root3) / 6;
        this.ddx = 0.5 * this.R6;
        this.ddy = this.r6;
        this.RU = this.r6 + this.R3;
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var path = new Path([
            [0, 0],
            [0, -(this.r6 + this.r3)],
            [0.5 * this.R6, -(this.r6 + this.R3)],
            [this.R6, -(this.r6 + this.r3)],
            [this.R6, -this.R3],
        ]);
        path.closed = true;
        path.name = "mer-1";
        var cir = new Path.Circle([0, 0], this.RU);
        cir.name = "cir-1";
        return [path, [1, 2, 3, 4, 5].map((e) => path.clone().rotate(e * 60, [0, 0])), cir].flat();
    }
}

class DualRhombiTriHex extends Hex {
    constructor(h = 0, k = 0, H = 0, K = 0) {
        super(h, k, H, K);
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var line = new Path([
            [0, 0],
            [0, this.r6],
        ]);
        var path = new Path([[0, 0], line.rotate(30, [0, 0]).bounds.bottomLeft, [0, this.R6], line.rotate(-60, [0, 0]).bounds.bottomRight]);
        path.closed = true;
        path.name = "mer-1";
        line.remove();
        var cir = new Path.Circle([0, 0], this.RU);
        cir.name = "cir-1";
        return [path, [1, 2, 3, 4, 5].map((e) => path.clone().rotate(e * 60, [0, 0])), cir].flat();
    }
}

function sign(a) {
    return (a > 0) - (a < 0);
}

function* brackets(f, a, b, iter) {
    var frac = (b - a) / iter;
    var prev = sign(f(a));
    for (var i = 0; i < iter; i++) {
        var x = a + i * frac;
        var curr = sign(f(x));
        if (prev != curr) {
            yield [a + (i - 1) * frac, x];
            prev = curr;
        }
    }
}

function bisection(f, a, b, tol, nmax) {
    for (var i = 0; i < nmax; i++) {
        var c = (a + b) / 2;
        var f_of_c = f(c);
        if (f_of_c === 0 || (b - a) / 2 < tol) {
            return c;
        }
        if (sign(f_of_c) === sign(f(a))) {
            a = c;
        } else {
            b = c;
        }
    }
}

function add(A, B) {
    return A.map((e, i) => {
        return e + B[i];
    });
}

function subtract(A, B) {
    return A.map((e, i) => {
        return e - B[i];
    });
}

function dot(A, B) {
    return A.map((e, i) => {
        return e * B[i];
    }).reduce((a, b) => {
        return a + b;
    });
}

function sarrus(u, v) {
    return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

function centroid(p) {
    return p.reduce(add).map((e) => {
        return e / p.length;
    });
}

function centroidSegments(segments) {
    return segments
        .map((e) => {
            return e.point;
        })
        .reduce((a, b) => {
            return a.add(b);
        }, new Point())
        .divide(segments.length);
}

function length(v) {
    return Math.sqrt(
        v
            .map((e) => {
                return e * e;
            })
            .reduce((a, b) => {
                return a + b;
            })
    );
}

function unitVector(v) {
    var len = length(v);
    return v.map((e) => e / len);
}

function angle(B, A, C) {
    // https://math.stackexchange.com/a/3427603
    const [BA, BC] = [A.subtract(B), C.subtract(B)];
    return Math.acos(BA.dot(BC) / (BA.length * BC.length));
}

function angle2(B, A, C) {
    // https://math.stackexchange.com/a/3427603
    const [BA, BC] = [subtract(B, A), subtract(B, C)];
    return Math.acos(dot(BA, BC) / (length(BA) * length(BC)));
}

function degrees(value) {
    return value * (180 / Math.PI);
}

function radians(value) {
    return value * (Math.PI / 180);
}

function pointReduce(G, cmp) {
    return G.flatMap((e) => {
        return e.segments.map((f) => {
            return f.point;
        });
    }).reduce((a, b) => {
        return cmp(a, b);
    }, new Point());
}

function faceNormal(A, B, C) {
    const P = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const Q = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const [x, y, z] = [
        //
        P[1] * Q[2] - P[2] * Q[1],
        P[2] * Q[0] - P[0] * Q[2],
        P[0] * Q[1] - P[1] * Q[0],
    ];
    const d = Math.sqrt(x * x + y * y + z * z);
    return [x / d, y / d, z / d];
}

function collapseFibers(fibers) {
    var groups = [];
    fibers.forEach((e) => {
        var flag = true;
        const p = e[0];
        for (let group of groups) {
            const q = group[0][0];
            if (Math.abs(p[0] - q[0]) < COLLAPSE_THRESHOLD && Math.abs(p[1] - q[1]) < COLLAPSE_THRESHOLD && Math.abs(p[2] - q[2]) < COLLAPSE_THRESHOLD) {
                group.push(e);
                flag = false;
                break;
            }
        }
        if (flag) groups.push([e]);
    });
    return groups.map((e) => {
        return [0, 1].map((i) => {
            return e
                .map((g) => {
                    return g[i];
                })
                .reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]])
                .map((c) => {
                    return c / e.length;
                });
        });
    });
}

function removeAuxMers(face) {
    [0, 1].forEach((i) => {
        face.children[i].children.filter((e) => e.name.startsWith("cir")).forEach((e) => e.remove());
        face.children[i].children.filter((e) => e.name.startsWith("ctr")).forEach((e) => e.remove());
    });
    return face;
}

function drawNet(face) {
    var f2 = face.clone();

    var p = pointReduce(face.children[1].children, (a, b) => (a.y > b.y ? a : b));

    f2.scale(-1, -1);
    f2.position.y += face.children[0].bounds.height;
    f2.bounds.left = Math.min(face.children[0].bounds.right, p.x);

    var G1 = new Group([face.clone(), f2]);
    var G2 = G1.clone();
    G2.position.x += face.children[0].bounds.width;
    var G3 = G2.clone();
    G3.position.x += face.children[0].bounds.width;
    var G4 = G3.clone();
    G4.position.x += face.children[0].bounds.width;
    var G5 = G4.clone();
    G5.position.x += face.children[0].bounds.width;

    var net = new Group([G1, G2, G3, G4, G5]);
    net.position = view.center;
    return net;
}

function drawIco(face, ico, F, P, sty) {
    var face1 = face.children[0];
    var face2 = face.children[1];

    const vc1 = face1.children
        .filter((e) => sty.fibers[`fib.${e.data.type}.${e.data.name}`])
        .map((e) => {
            return [[e.position.x], [e.position.y], [1]];
        });
    const vc2 = face2.children
        .filter((e) => sty.fibers[`fib.${e.data.type}.${e.data.name}`])
        .map((e) => {
            return [[e.position.x], [e.position.y], [1]];
        });

    removeAuxMers(face);

    var bottomVertex = pointReduce(face2.children, (a, b) => (a.y > b.y ? a : b));
    const A1 = Matrix.inv3([
        [face1.bounds.bottomLeft.x, face1.bounds.topCenter.x, face1.bounds.bottomRight.x],
        [face1.bounds.bottomLeft.y, face1.bounds.topCenter.y, face1.bounds.bottomRight.y],
        [1, 1, 1],
    ]);
    const A2 = Matrix.inv3([
        [face1.bounds.bottomLeft.x, bottomVertex.x, face1.bounds.bottomRight.x],
        [face1.bounds.bottomLeft.y, bottomVertex.y, face1.bounds.bottomRight.y],
        [1, 1, 1],
    ]);

    var faces = ico.projectFaces(P);
    var fibers = faces.flatMap((e, i) => {
        const B = [
            [e[0][0], e[1][0], e[2][0]],
            [e[0][1], e[1][1], e[2][1]],
            [e[0][2], e[1][2], e[2][2]],
        ];
        const M = Matrix.mul(B, ico.isCap(i) ? A1 : A2);
        const L = ico.isCap(i) ? F : -F;
        var f = ico.isCap(i) ? vc1 : vc2;
        return f.map((g) => {
            const [dx, dy, dz] = faceNormal(...e);
            const [x, y, z] = Matrix.mul(M, g).map((r) => r[0]);
            return [
                [x, y, z],
                [x + dx * L, y + dy * L, z + dz * L],
            ];
        });
    });

    fibers = collapseFibers(fibers).map((e) => {
        return { v: e, t: "fiber" };
    });

    return new Group(
        faces
            .map((e, i) => {
                return { v: e, t: "face", i: i, c: ico.isCap(i) };
            })
            .concat(fibers)
            .sort((a, b) => {
                // sort by z-order
                var p = a.v.map((f) => {
                    return f[2];
                });
                var q = b.v.map((f) => {
                    return f[2];
                });
                return p.reduce((x, y) => x + y) / p.length - q.reduce((x, y) => x + y) / q.length;
            })
            .map((o) => {
                const e = o.v;
                if (o.t === "face") {
                    const B = [
                        [e[0][0], e[1][0], e[2][0]],
                        [e[0][1], e[1][1], e[2][1]],
                        [e[0][2], e[1][2], e[2][2]],
                    ];
                    const M = Matrix.mul(B, o.c ? A1 : A2);
                    var face0 = o.c ? face1 : face2;
                    return face0.clone().transform(new paper.Matrix(M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2]));
                } else {
                    var fiber = new Path.Line([e[0][0], e[0][1]], [e[1][0], e[1][1]]);
                    fiber.style = sty["fib.mer"];
                    var knob = new Path.Circle([e[1][0], e[1][1]], sty["knb.mer"].R);
                    knob.style = sty["knb.mer"]["style"];
                    return new Group([fiber, knob]);
                }
            })
    );
}
