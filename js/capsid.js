// mathematical constants
const phi = (1 + Math.sqrt(5)) / 2;
const root3 = Math.sqrt(3);

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
    constructor(s, h = undefined, angle = radians(-60)) {
        this.setEdge(s, h, angle);
    }

    // array of face vertexes
    faceIndexes = [
        [0, 2, 1],
        [0, 1, 4],
        [0, 4, 3],
        [0, 3, 5],
        [0, 5, 2],
        [1, 2, 6],
        [1, 6, 7],
        [1, 7, 4],
        [4, 7, 8],
        [4, 8, 3],
        [3, 8, 9],
        [3, 9, 5],
        [5, 9, 10],
        [5, 10, 2],
        [2, 10, 6],
        [2, 10, 6],
        [6, 11, 7],
        [7, 11, 8],
        [8, 11, 9],
        [9, 11, 10],
        [10, 11, 6],
    ];

    setEdge(s, h = undefined, angle = radians(-60)) {
        this.s = s;
        this.h = h;
        this.angle = angle;

        h = h === undefined ? s : h;

        const b = s / 2;
        const a = phi * b;

        var cam = new Camera();
        cam.φ = radians(90 - degrees(Math.atan2(1 / (2 * phi), 0.5)));
        cam.update();

        var v = [
            [0, b, -a, 1],
            [b, a, 0, 1],
            [-b, a, 0, 1],
            [0, -b, -a, 1],
            [a, 0, -b, 1],
            [-a, 0, -b, 1],
        ].map((v) =>
            Matrix.mul(
                cam.P,
                v.map((e) => [e])
            )
        );

        // console.log("s", s);
        // console.log("h", h);
        const A = [v[2][0][0] + h * Math.cos(angle), v[2][1][0] + h * Math.sin(angle), v[2][2][0]];
        // console.log("A", A);
        const B = [A[0], v[2][1][0], v[2][2][0]];
        // console.log("B", B);
        const r1 = Math.sqrt(v[2][0][0] * v[2][0][0] + v[2][2][0] * v[2][2][0]);
        // console.log("r1", r1);
        const C = [A[0], A[1], Math.sqrt(r1 * r1 - A[0] * A[0])];
        // console.log("C", C);
        const r2 = A[1] - B[1];
        // console.log("r2", r2);
        const D = [C[0], B[1] - Math.sqrt(-(B[2] * B[2]) + 2 * B[2] * C[2] + r2 * r2 - C[2] * C[2]), C[2]];
        // console.log("D", D);
        const a72 = radians(-72);
        var cy = (B[1] + D[1]) / 2;

        this.vertexes = v
            .map((v) => [v[0][0], v[1][0], v[2][0], 1])
            .concat([
                [D[0], D[1], D[2], 1],
                [Math.cos(a72 * 1) * D[0] - Math.sin(a72 * 1) * D[2], D[1], Math.sin(a72 * 1) * D[0] + Math.cos(a72 * 1) * D[2], 1],
                [Math.cos(a72 * 2) * D[0] - Math.sin(a72 * 2) * D[2], D[1], Math.sin(a72 * 2) * D[0] + Math.cos(a72 * 2) * D[2], 1],
                [Math.cos(a72 * 3) * D[0] - Math.sin(a72 * 3) * D[2], D[1], Math.sin(a72 * 3) * D[0] + Math.cos(a72 * 3) * D[2], 1],
                [Math.cos(a72 * 4) * D[0] - Math.sin(a72 * 4) * D[2], D[1], Math.sin(a72 * 4) * D[0] + Math.cos(a72 * 4) * D[2], 1],
                [0, cy - (v[0][1][0] - cy), 0, 1],
            ]);

        // console.log(this.vertexes);
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
        var p = this.projectVertexes(P).map((e) => [e[0][0], e[1][0], e[2][0]]);
        return this.faceIndexes.map((e) => [p[e[0]], p[e[1]], p[e[2]]]);
    }
}

class Hex {
    constructor(R, h = 0, k = 0, K = 0) {
        // hexagonal circumradius
        this.R = R;
        // haxagonal inradius
        this.r = (root3 / 2) * R;
        // triangular circumradius
        this.R3 = (this.R * root3) / 3;
        // triangular inradius
        this.r3 = (this.R * root3) / 6;
        // grid x-offset
        this.dx = 2 * this.r;
        // grid y-offset
        this.dy = 1.5 * this.R;
        // grid x-offset per column
        this.ddx = this.r;
        // grid y-offset per row
        this.ddy = 0;

        this.circumradius = this.R;

        this.h = h;
        this.k = k;
        this.K = K;
    }

    hvec() {
        return new Point(this.dx * this.h, this.ddy * this.h);
    }

    kvec() {
        return new Point(this.dx * this.k, this.ddy * this.k).rotate(60);
    }

    Kvec() {
        return new Point(this.dx * this.K, this.ddy * this.K).rotate(120);
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var hex = new Path.RegularPolygon([0, 0], 6, this.R);
        hex.name = "mer-1";
        return [hex];
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
        const u = new Group(this.unit(this.R));
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
        return G.map((e) => {
            return e.children
                .filter((f) => {
                    return !f.name.startsWith("cir-1");
                })
                .map((f) => {
                    var x = T.intersect(f);
                    x.name = f.name;
                    return x;
                })
                .filter((f) => {
                    return f.length > 1;
                })
                .map((f) => {
                    console.log("capsid.js", this.h, this.k, this.K);
                    var c = centroid(f.segments);
                    f.type = v.some((y) => c.getDistance(y) < this.circumradius) ? "pen" : "hex";
                    f.style = opt[f.type + "." + f.name.split(" ")[0]];
                    return f;
                });
        });
    }

    face(opt = {}) {
        const tvec = this.hvec().add(this.kvec());

        const nc = [0, this.h + this.k];
        const nr = [-this.h, this.k];
        const vt = [[0, 0], tvec, tvec.rotate(-60)];

        var T = new Path([[0, 0], tvec, tvec.rotate(-60)]);
        T.closePath();

        var G = new Group(this.intersect_grid(T, Array.from(this.grid(nc, nr)), vt, opt).flat());
        G.style = opt.face;
        G.rotate(-tvec.angle);
        G.scale(opt.levo ? -1 : 1, 1);

        T.remove();

        return G;
    }

    face5(opt = {}) {
        const kvec = this.kvec();
        const tvec = this.hvec().add(kvec);
        const qvec = kvec.add(this.Kvec());

        const nc = [-this.K, this.h + this.k];
        const nr = [-this.h, this.k + this.K];
        const vt = [[0, 0], tvec, tvec.rotate(-60), qvec];

        var T1 = new Path([[0, 0], tvec, tvec.rotate(-60)]);
        T1.closePath();
        var T2 = new Path([0, 0], qvec, tvec);
        T2.closePath();

        var g = Array.from(this.grid(nc, nr));
        var G = new Group([new Group(this.intersect_grid(T1, g, vt, opt).flat()), new Group(this.intersect_grid(T2, g, vt, opt).flat())]);
        G.style = opt.face;
        G.rotate(-tvec.angle);
        G.scale(opt.levo ? -1 : 1, 1);

        return G;
    }
}

class TriHex extends Hex {
    constructor(R, h = 0, k = 0, K = 0) {
        super(R, h, k, K);
        this.r = (root3 / 2) * R;
        this.dx = 2 * R;
        this.dy = 2 * this.r;
        this.ddx = R;
        this.circumradius = this.r + 0.5 * root3 * this.R;
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var tri = new Path.RegularPolygon([0, -this.r - this.r3], 3, this.R3);
        tri.name = "mer-2";
        var hex = new Path.RegularPolygon([0, 0], 6, this.R).rotate(30);
        hex.name = "mer-1";
        var cir = new Path.Circle([0, 0], this.circumradius);
        cir.name = "cir-1";
        return [tri, tri.clone().rotate(60, [0, 0]), hex, cir];
    }
}

class SnubHex extends Hex {
    constructor(R, h = 0, k = 0, K = 0) {
        super(R, h, k, K);
        this.r = (root3 / 2) * R;
        this.dx = 2.5 * R;
        this.dy = 3 * this.r;
        this.ddy = this.r;
        this.ddx = 0.5 * R;
        this.circumradius = 2.0 * this.R;
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var tri1 = new Path.RegularPolygon([0, -this.r - this.r3], 3, this.R3);
        tri1.name = "mer-2";
        var tri2 = tri1.clone().rotate(-180, tri1.bounds.bottomLeft);
        tri2.name = "mer-2";
        var tri3 = tri2.clone().rotate(-180, tri2.bounds.bottomCenter);
        tri3.name = "mer-2";
        var hex = new Path.RegularPolygon([0, 0], 6, this.R).rotate(30);
        hex.name = "mer-1";
        var cir = new Path.Circle([0, 0], this.circumradius);
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
    constructor(R, h = 0, k = 0, K = 0) {
        super(R, h, k, K);
        this.r = (root3 / 2) * R;
        this.dx = 2 * this.r + R;
        this.dy = 0.5 * R + (this.R * root3) / 2 + R;
        this.ddx = this.r + R / 2;
        this.circumradius = Math.sqrt(Math.pow(this.r + this.R, 2) + Math.pow(this.R / 2, 2));
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var hex = new Path.RegularPolygon([0, 0], 6, this.R);
        hex.name = "mer-1";
        var sqr = new Path.RegularPolygon([0, 0], 4, Math.sqrt(2 * this.R * this.R) / 2);
        sqr.name = "mer-3";
        sqr.bounds.x = hex.bounds.left - sqr.bounds.width;
        var tri = new Path.RegularPolygon([0, 0], 3, this.R3);
        tri.position.y = hex.bounds.bottom + (this.R * root3) / 2 / 2;
        tri.name = "mer-2";
        var cir = new Path.Circle([0, 0], this.circumradius);
        cir.name = "cir-1";
        return [sqr, sqr.clone().rotate(60, [0, 0]), sqr.clone().rotate(120, [0, 0]), tri, tri.clone().rotate(60, [0, 0]), hex, cir];
    }
}

class DualTriHex extends Hex {
    constructor(R, h = 0, k = 0, K = 0) {
        super(R, h, k, K);
        this.dx = 4 * R;
        this.dy = (4 * R * root3) / 2;
        this.ddx = 2 * R;
        this.circumradius = 2 * (this.r + this.r3);
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var path1 = new Path([
            [0, 0],
            [0, -this.r - this.r3],
            [-this.R, -2 * this.r],
            [-this.R, -this.R3],
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
        ];
    }
}

class DualSnubHex extends Hex {
    constructor(R, h = 0, k = 0, K = 0) {
        super(R, h, k, K);
        this.dx = 2.5 * R;
        this.dy = 2 * this.r + 2 * ((this.R * root3) / 3) - (this.R * root3) / 6;
        this.ddx = 0.5 * R;
        this.ddy = this.r;
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var path = new Path([
            [0, 0],
            [0, -(this.r + this.r3)],
            [0.5 * this.R, -(this.r + this.R3)],
            [this.R, -(this.r + this.r3)],
            [this.R, -this.R3],
        ]);
        path.closed = true;
        path.name = "mer-1";
        return [path, [1, 2, 3, 4, 5].map((e) => path.clone().rotate(e * 60, [0, 0]))].flat();
    }
}

class DualRhombiTriHex extends Hex {
    constructor(R, h = 0, k = 0, K = 0) {
        super(R, h, k, K);
    }

    /**
     * Calculate lattice unit.
     * @returns the array of lattice objects
     */
    unit() {
        var line = new Path([
            [0, 0],
            [0, this.r],
        ]);
        var path = new Path([[0, 0], line.rotate(30, [0, 0]).bounds.bottomLeft, [0, this.R], line.rotate(-60, [0, 0]).bounds.bottomRight]);
        path.closed = true;
        path.name = "mer-1";
        line.remove();
        return [path, [1, 2, 3, 4, 5].map((e) => path.clone().rotate(e * 60, [0, 0]))].flat();
    }
}

function centroid(segments) {
    return segments
        .map((e) => {
            return e.point;
        })
        .reduce((a, b) => {
            return a.add(b);
        })
        .divide(segments.length);
}

/**
 * Convert radians to degrees.
 * @param {*} radians the value in degrees
 * @returns the value in radians
 */
function radians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert degrees to radians.
 * @param {*} radians the value in radians
 * @returns the value in degrees
 */
function degrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Draw the icosahedron net.
 * @param {*} face the Group face object
 * @returns the Group net object
 */
function drawNet(face) {
    var f1 = face.clone();

    // render first column by rotating
    var f2 = f1.clone();
    f2.rotate(300, f1.bounds.bottomRight);
    var f3 = f1.clone();
    f3.rotate(240, f1.bounds.bottomRight);
    var f4 = f3.clone();
    f4.rotate(300, f3.bounds.bottomRight);

    // copy row and shift over 5 times
    var c1 = new Group([f1, f2, f3, f4]);
    var c2 = c1.clone();
    c2.position.x += f1.bounds.width;
    var c3 = c1.clone();
    c3.position.x += 2 * f1.bounds.width;
    var c4 = c1.clone();
    c4.position.x += 3 * f1.bounds.width;
    var c5 = c1.clone();
    c5.position.x += 4 * f1.bounds.width;

    var net = new Group([c1, c2, c3, c4, c5]);
    net.position = view.center;
    return net;
}

function drawIco(face, ico, fib, P, opt) {
    // affine transform each triangle to the 2D projection of icosahedron face
    const A = Matrix.inv3([
        [face.bounds.topCenter.x, face.bounds.bottomLeft.x, face.bounds.bottomRight.x],
        [face.bounds.topCenter.y, face.bounds.bottomLeft.y, face.bounds.bottomRight.y],
        [1, 1, 1],
    ]);

    var fibers = [];
    if (fib.s > 0) {
        var p1 = ico.projectVertexes(P).map((e) => [e[0][0], e[1][0], e[2][0]]);
        var p2 = fib.projectVertexes(P).map((e) => [e[0][0], e[1][0], e[2][0]]);
        fibers = p1.map((_, i) => [p1[i], p2[i]]);
    }

    return new Group(
        ico
            .projectFaces(P)
            .concat(fibers)
            .sort(
                (a, b) =>
                    // sort faces by z-order
                    a[0][2] + a[1][2] + (a.length < 3 ? 0 : a[2][2]) - (b[0][2] + b[1][2] + (b.length < 3 ? 0 : b[2][2]))
            )
            .map((e) => {
                if (e.length == 3) {
                    const B = [
                        [e[0][0], e[1][0], e[2][0]],
                        [e[0][1], e[1][1], e[2][1]],
                        [1, 1, 1],
                    ];
                    const M = Matrix.mul(B, A);
                    return face.clone().transform(new paper.Matrix(M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2]));
                } else {
                    var fiber = new Path.Line([e[0][0], e[0][1]], [e[1][0], e[1][1]]);
                    fiber.style = opt["fib.mer"];
                    var knob = new Path.Circle([e[1][0], e[1][1]], opt["knb.mer"].R);
                    knob.style = opt["knb.mer"]["style"];
                    return new Group([fiber, knob]);
                }
            })
    );
}

module.exports = [Matrix, Hex, TriHex, SnubHex, RhombiTriHex, DualTriHex, DualSnubHex, DualRhombiTriHex];
