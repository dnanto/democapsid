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
        return A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
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

/**
 * Regular Icosahedron math.
 */
class RegularIcosahedron {
    // array of face vertexes
    static faceIndexes = [
        [0, 1, 2],
        [3, 2, 1],
        [3, 4, 5],
        [3, 8, 4],
        [0, 6, 7],
        [0, 9, 6],
        [4, 10, 11],
        [6, 11, 10],
        [2, 5, 9],
        [11, 9, 5],
        [1, 7, 8],
        [10, 8, 7],
        [3, 5, 2],
        [3, 1, 8],
        [0, 2, 9],
        [0, 7, 1],
        [6, 9, 11],
        [6, 10, 7],
        [4, 11, 5],
        [4, 8, 10],
    ];

    /**
     * Calculate the 3D vertex projections.
     * @param {Array} P The camera matrix.
     */
    static verts(R, P) {
        const [a, b] = [0.5 * R, (1 / (2 * phi)) * R];
        return [
            [0, b, -a, 1],
            [b, a, 0, 1],
            [-b, a, 0, 1],
            [0, b, a, 1],
            [0, -b, a, 1],
            [-a, 0, b, 1],
            [0, -b, -a, 1],
            [a, 0, -b, 1],
            [a, 0, b, 1],
            [-a, 0, -b, 1],
            [b, -a, 0, 1],
            [-b, -a, 0, 1],
        ].map((v) =>
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
    static faces(R, P) {
        var p = this.verts(R, P).map((e) => [e[0][0], e[1][0], e[2][0]]);
        return this.faceIndexes.map((e) => [p[e[0]], p[e[1]], p[e[2]]]);
    }
}

class Hex {
    /**
     * Hex lattice object.
     * @param {*} R the circumradius
     */
    constructor(R) {
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

    /**
     * Generate hexagonal grid.
     * @param {*} nr the number of rows
     * @param {*} nc the number of columns
     */
    *grid(nr, nc) {
        const u = new Group(this.unit(this.R));
        for (var i = 0; i < nr; i++) {
            for (var j = 0; j < nc; j++) {
                var v = u.clone();
                v.position = new Point(this.coor(i, j));
                v.coordinate = [i, j];
                yield v;
            }
        }
        u.remove();
    }

    /**
     * Perform grid walk.
     * @param {*} h the h-parameter
     * @param {*} k the k-parameter
     * @param {*} c the starting column
     * @param {*} r the starting row
     * @returns the list of triangular walk coordinates as grid and cartesian values
     */
    walk(h, k, c = 0, r = 0) {
        var [i1, i2, i3] = [
            [r, c],
            [r + h, c + k],
            [r - k, c + k + h],
        ];
        var p1 = new Point(this.coor(i1[0], i1[1]));
        var p2 = new Point(this.coor(i2[0], i2[1]));
        var p3 = new Point(this.coor(i3[0], i3[1]));
        return [
            [i1, i2, i3],
            [p1, p2, p3],
        ];
    }

    /**
     * Calculate the face object.
     * @param {*} h the h-parameter
     * @param {*} k the k-parameter
     * @param {*} opt the style options
     * @returns the face Group object
     */
    face(h, k, opt = {}) {
        const n = h + k + 1;

        var [i, p] = this.walk(h, k, 0, k);
        var f = new Path(p, { closed: true });
        f.closed = true;
        f.style = opt.face;

        // computer intersection of triangle with hexagonal grid
        var g = [];
        Array.from(this.grid(n, n))
            .map((u) => {
                // penton or hexagon
                var type =
                    /**/ (u.coordinate[0] === i[0][0] && u.coordinate[1] == i[0][1]) ||
                    (u.coordinate[0] === i[1][0] && u.coordinate[1] == i[1][1]) ||
                    (u.coordinate[0] === i[2][0] && u.coordinate[1] == i[2][1])
                        ? "pen"
                        : "hex";
                u.type = type;
                return u;
            })
            // overlay penton elements
            .sort((a, b) => b.type < a.type)
            // compute intersection with the computed grid face
            .forEach((u) => {
                u.children.forEach((e) => {
                    var x = f.intersect(e);
                    if (x.segments.length > 0) {
                        x.style = opt[u.type + "." + e.name.split(" ")[0]];
                        g.push(x);
                    }
                });
                u.remove();
            });
        f.remove();
        g = new Group(g);

        // rotate to have flat triangular base
        var c = p[0]
            .add(p[1])
            .add(p[2])
            .multiply(1 / 3);
        g.rotate(90 - c.subtract(p[0]).angle, c);
        g.scale(opt.levo ? -1 : 1, 1);

        return g;
    }
}

class TriHex extends Hex {
    /**
     * TriHex lattice object.
     * @param {*} R the circumradius
     */
    constructor(R) {
        super(R);
        this.r = (root3 / 2) * R;
        this.dx = 2 * R;
        this.dy = 2 * this.r;
        this.ddx = R;
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
        return [tri, [1, 2, 3, 4, 5].map((e) => tri.clone().rotate(60 * e, [0, 0])), hex].flat();
    }
}

class SnubHex extends Hex {
    /**
     * SnubHex lattice object.
     * @param {*} R the circumradius
     */
    constructor(R) {
        super(R);
        this.r = (root3 / 2) * R;
        this.dx = 2.5 * R;
        this.dy = 3 * this.r;
        this.ddy = this.r;
        this.ddx = 0.5 * R;
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
        var tri4 = tri3.clone().rotate(-180, tri3.bounds.bottomRight);
        tri4.name = "mer-2";
        var tri5 = tri4.clone().rotate(-180, tri4.bounds.topRight);
        tri5.name = "mer-2";
        var hex = new Path.RegularPolygon([0, 0], 6, this.R).rotate(30);
        hex.name = "mer-1";
        return [
            tri1,
            tri1.clone().rotate(-60, tri1.bounds.bottomLeft),
            tri1.clone().rotate(-120, tri1.bounds.bottomLeft),
            tri2,
            tri2.clone().rotate(-60, tri2.bounds.bottomCenter),
            tri2.clone().rotate(-120, tri2.bounds.bottomCenter),
            tri3,
            tri3.clone().rotate(-60, tri3.bounds.bottomRight),
            tri3.clone().rotate(-120, tri3.bounds.bottomRight),
            tri4,
            tri4.clone().rotate(-60, tri4.bounds.topRight),
            tri4.clone().rotate(-120, tri4.bounds.topRight),
            tri5,
            tri5.clone().rotate(-60, tri5.bounds.topCenter),
            tri5.clone().rotate(-120, tri5.bounds.topCenter),
            tri5.clone().rotate(-180, tri5.bounds.topCenter),
            tri1.clone().rotate(60, tri1.bounds.bottomRight),
            tri1.clone().rotate(120, tri1.bounds.bottomRight),
            hex,
        ];
    }
}

class RhombiTriHex extends Hex {
    /**
     * RhombiTriHex lattice object.
     * @param {*} R the circumradius
     */
    constructor(R) {
        super(R);
        this.r = (root3 / 2) * R;
        this.dx = 2 * this.r + R;
        this.dy = 0.5 * R + (this.R * root3) / 2 + R;
        this.ddx = this.r + R / 2;
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
        return [sqr, [1, 2, 3, 4, 5].map((e) => sqr.clone().rotate(60 * e, [0, 0])), tri, [1, 2, 3, 4, 5].map((e) => tri.clone().rotate(60 * e, [0, 0])), hex].flat();
    }
}

class DualTriHex extends Hex {
    /**
     * DualTriHex lattice object.
     * @param {*} R the circumradius
     */
    constructor(R) {
        super(R);
        this.dx = 4 * R;
        this.dy = (4 * R * root3) / 2;
        this.ddx = 2 * R;
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
    /**
     * DualSnubHex lattice object.
     * @param {*} R the circumradius
     */
    constructor(R) {
        super(R);
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
    /**
     * DualRhombiHex lattice object.
     * @param {*} R the circumradius
     */
    constructor(R) {
        super(R);
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

/**
 * Draw the icosahedron.
 * @param {*} face the Group face object
 * @param {*} R the circumradius
 * @param {*} F the fiber length
 * @param {*} P the camera matrix
 * @param {*} opt the style options
 * @returns the Group icosahedron object
 */
function drawIco(face, R, F, P, opt) {
    // affine transform each triangle to the 2D projection of icosahedron face
    const A = Matrix.inv3([
        [face.bounds.topCenter.x, face.bounds.bottomLeft.x, face.bounds.bottomRight.x],
        [face.bounds.topCenter.y, face.bounds.bottomLeft.y, face.bounds.bottomRight.y],
        [1, 1, 1],
    ]);

    var fibers = [];
    if (F > 0) {
        var p1 = RegularIcosahedron.verts(R, P).map((e) => [e[0][0], e[1][0], e[2][0]]);
        var p2 = RegularIcosahedron.verts(F, P).map((e) => [e[0][0], e[1][0], e[2][0]]);
        fibers = p1.map((_, i) => [p1[i], p2[i]]);
    }

    return new Group(
        RegularIcosahedron.faces(R, P)
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
