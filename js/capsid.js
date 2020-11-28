const root2 = Math.sqrt(2)
const root3 = Math.sqrt(3)

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
        for (var i = 0; i < m; i++)
            C[i] = new Array(p).fill(0);
        for (var i = 0; i < m; i++)
            for (var j = 0; j < p; j++)
                for (var k = 0; k < n; k++)
                    C[i][j] += A[i][k] * B[k][j];
        return C;
    }

    /**
     * Calculate the 3x3 determinant.
     * @param {Array} A The 3x3 matrix.
     * @return {Number} The determinant;
     */
    static det3(A) {
        return (
            A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
            A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
            A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
        );
    }

    /**
     * Calculate the 3x3 inverse.
     * @param {Array} A The 3x3 matrix.
     * @return {Number} The inverse;
     */
    static inv3(A) {
        const [a, b, c, d, e, f, g, h, i] = [
            A[0][0], A[0][1], A[0][2],
            A[1][0], A[1][1], A[1][2],
            A[2][0], A[2][1], A[2][2]
        ]
        const dA = this.det3(A);
        return [
            [(e * i - f * h) / dA, -(b * i - c * h) / dA, (b * f - c * e) / dA],
            [-(d * i - f * g) / dA, (a * i - c * g) / dA, -(a * f - c * d) / dA],
            [(d * h - e * g) / dA, -(a * h - b * g) / dA, (a * e - b * d) / dA]
        ]
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
            [0, 0, 1]
        ];
        // calibration
        this.K = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
        // translation
        this.C = [0, 0, 0];
        // camera matrix
        this.P = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        this.update();
    }

    /**
     * Update the camera matrix.
     */
    update() {
        // rotation
        const [sinθ, sinψ, sinφ, cosθ, cosψ, cosφ] = [
            Math.sin(this.θ), Math.sin(this.ψ), Math.sin(this.φ),
            Math.cos(this.θ), Math.cos(this.ψ), Math.cos(this.φ)
        ];
        this.R[0][0] = cosθ * cosψ;
        this.R[0][1] = cosθ * sinψ * sinφ - sinθ * cosφ;
        this.R[0][2] = cosθ * sinψ * cosφ + sinθ * sinφ;
        this.R[1][0] = sinθ * cosψ;
        this.R[1][1] = sinθ * sinψ * sinφ + cosθ * cosφ;
        this.R[1][2] = sinθ * sinψ * cosφ - cosθ * sinφ;
        this.R[2][0] = -sinψ;
        this.R[2][1] = cosψ * sinφ;
        this.R[2][2] = cosψ * cosφ;
        // translation
        const IC = [
            [1, 0, 0, -this.C[0]],
            [0, 1, 0, -this.C[1]],
            [0, 0, 1, -this.C[2]]
        ];
        // calculate camera matrix
        this.P = Matrix.mul(Matrix.mul(this.K, this.R), IC);
    }
};

/**
 * Regular Icosahedron math.
 */
class RegularIcosahedron {

    /**
     * Iterate the faces.
     * @return {Array} The face coordinate vertex indexe tuples. 
     */
    static iterFaces() {
        return [
            [0, 1, 2], [3, 2, 1], [3, 4, 5], [3, 8, 4], [0, 6, 7],
            [0, 9, 6], [4, 10, 11], [6, 11, 10], [2, 5, 9], [11, 9, 5],
            [1, 7, 8], [10, 8, 7], [3, 5, 2], [3, 1, 8], [0, 2, 9],
            [0, 7, 1], [6, 9, 11], [6, 10, 7], [4, 11, 5], [4, 8, 10]
        ]
    }

    /**
    * Calculate the 3D vertex projections.
    * @param {Array} P The camera matrix.
    */
    static verts(R, P) {
        const phi = (1 + Math.sqrt(5)) / 2;
        const [a, b] = [0.5 * R, 1 / (2 * phi) * R];
        const coordinates = [
            [0, b, -a, 1], [b, a, 0, 1], [-b, a, 0, 1], [0, b, a, 1],
            [0, -b, a, 1], [-a, 0, b, 1], [0, -b, -a, 1], [a, 0, -b, 1],
            [a, 0, b, 1], [-a, 0, -b, 1], [b, -a, 0, 1], [-b, -a, 0, 1]
        ];
        return coordinates.map(v => Matrix.mul(P, v.map(e => [e])));
    }

    /**
     * Calculate the 2D face projections.
     * @param {Array} P The camera matrix.
     */
    static faces(R, P) {
        var p = this.verts(R, P).map(e => [e[0][0], e[1][0], e[2][0]]);
        return this.iterFaces()
            .sort((a, b) =>
                // sort faces by z-order
                Math.min(p[a[0]][2], p[a[1]][2], p[a[2]][2]) -
                Math.min(p[b[0]][2], p[b[1]][2], p[b[2]][2])
            )
            .map(e => [p[e[0]], p[e[1]], p[e[2]]]);
    }
}

class Hex {

    constructor(R) {
        this.R = R;
        this.r = root3 / 2 * R;
        this.dx = 2 * this.r;
        this.dy = 1.5 * this.R;
        this.ddx = this.r;
        this.ddy = 0;
        this.fx = 0;
        this.fy = 0;
    }

    unit() {
        var hex = new Path.RegularPolygon([0, 0], 6, this.R);
        hex.name = "mer-1";
        return [hex];
    }

    circumradius() {
        return this.R;
    }

    // map hexagon grid row/col to cartesian coordinates
    coor(i, j) {
        return [i * this.dx + j * this.ddx, j * this.dy + i * this.ddy];
    }

    // generate hexagonal grid
    * grid(nr, nc) {
        const u = new Group(this.unit(this.R));
        for (var i = 0; i < nr; i++) {
            for (var j = 0; j < nc; j++) {
                var v = u.clone();
                v.position = new Point(this.coor(i, j));
                yield v;
            }
        }
        u.remove();
    }

    walk(h, k, c = 0, r = 0) {
        var p1 = new Point(this.coor(r, c));
        p1.x += this.fx;
        p1.y += this.fy;
        var p2 = new Point(this.coor(r + h, c + k));
        p2.x += this.fx;
        p2.y += this.fy;
        var p3 = new Point(this.coor(r - k, c + k + h));
        p3.x += this.fx;
        p3.y += this.fy;
        return [p1, p2, p3];
    }

    face(h, k, opt = {}) {
        const n = h + k + 1;

        var p = this.walk(h, k, 0, k);
        var f = new Path(p, { closed: true });
        f.closed = true;
        f.style = opt.face;

        var circles = [
            new Path.Circle(p[0], this.circumradius(), { strokeColor: "black" }),
            new Path.Circle(p[1], this.circumradius(), { strokeColor: "black" }),
            new Path.Circle(p[2], this.circumradius(), { strokeColor: "black" })
        ];

        // computer intersection of triangle with hexagonal grid
        var g = [];
        for (var u of this.grid(n, n)) {
            u.children.forEach(e => {
                var x = f.intersect(e);
                var type = circles.some(c =>
                    c.contains(e.bounds.center) || c.contains(x.bounds.center)
                ) ? "pen" : "hex";
                x.style = opt[type + "." + e.name.split(" ")[0]];
                g.push(x);
            })
            u.remove();
        }
        f.remove();
        var g = new Group(g);

        var c = p[0].add(p[1]).add(p[2]).multiply(1 / 3);
        g.rotate(90 - c.subtract(p[0]).angle, c);
        g.scale(opt.levo ? -1 : 1, 1);

        circles.forEach(e => e.remove());

        return g;
    }

}

class TriHex extends Hex {

    constructor(R) {
        super(R);
        this.r = root3 / 2 * R;
        this.dx = 2 * R;
        this.dy = 2 * this.r;
        this.ddx = R;
        this.fx = R / 2 / 2;
        this.fy = R * root3 / 2 / 2;
    }

    unit() {
        var tri1 = new Path.RegularPolygon([0, -4 / 3 * this.r], 3, 2 * this.r / 3);
        tri1.name = "mer-2";
        var tri2 = tri1.clone().rotate(-180, tri1.bounds.bottomLeft)
        var hex = new Path.RegularPolygon([0, 0], 6, this.R).rotate(30);
        hex.name = "mer-1";
        return [tri1, tri2, hex];
    }

    circumradius() {
        return this.R + 2 * this.r / 3;
    }

}

class SnubHex extends Hex {

    constructor(R) {
        super(R);
        this.r = root3 / 2 * R;
        this.dx = 2.5 * R;
        this.dy = 3 * this.r;
        this.ddy = this.r;
        this.ddx = 0.5 * R;
        this.fx = this.R / 2;
    }

    unit() {
        var tri1 = new Path.RegularPolygon([0, -4 / 3 * this.r], 3, 2 * this.r / 3);
        tri1.name = "mer-2";
        var tri2 = tri1.clone().rotate(-180, tri1.bounds.bottomLeft);
        var tri3 = tri2.clone().rotate(-180, tri2.bounds.bottomCenter);
        var hex = new Path.RegularPolygon([0, 0], 6, this.R).rotate(30);
        hex.name = "mer-1";
        return [
            tri1,
            tri1.clone().rotate(-60, tri1.bounds.bottomLeft),
            tri1.clone().rotate(-120, tri1.bounds.bottomLeft),
            tri2,
            tri2.clone().rotate(-60, tri2.bounds.bottomCenter),
            tri2.clone().rotate(-120, tri2.bounds.bottomCenter),
            tri2.clone().rotate(-180, tri2.bounds.bottomCenter),
            tri3.clone().rotate(-60, tri3.bounds.bottomRight),
            hex
        ];
    }

    circumradius() {
        return 2 * this.R - .5;
    }
}

class RhombiTriHex extends Hex {

    constructor(R) {
        super(R);
        this.r = root3 / 2 * R;
        this.dx = 2 * this.r + R;
        this.dy = 0.5 * R + this.R * root3 / 2 + R;
        this.ddx = this.r + R / 2;
        this.fx = R / 2;
    }

    unit() {
        var hex = new Path.RegularPolygon([0, 0], 6, this.R);
        hex.name = "mer-1";

        var sqr = new Path.RegularPolygon([0, 0], 4, Math.sqrt(2 * this.R * this.R) / 2);
        sqr.name = "mer-3";
        sqr.bounds.x = hex.bounds.left - sqr.bounds.width;

        var tri1 = new Path.RegularPolygon([0, 0], 3, this.R * root3 / 3).rotate(180);
        tri1.name = "mer-2";
        tri1.position.y = hex.bounds.top - this.R * root3 / 2 / 2;
        var tri2 = tri1.clone().rotate(180);
        tri2.position = sqr.position;
        tri2.bounds.bottom = sqr.bounds.top;

        return [
            sqr,
            sqr.clone().rotate(150, sqr.bounds.topRight),
            sqr.clone().rotate(-150, sqr.bounds.bottomRight),
            tri1,
            tri2,
            hex
        ];
    }

    circumradius() {
        return 2 * this.R;
    }
}

class DualTriHex extends Hex {
    constructor(R) {
        super(R);
        this.dx = 4 * R;
        this.dy = 4 * R * root3 / 2;
        this.ddx = 2 * R;
    }

    unit() {
        const tri_rad = this.R * root3 / 3;
        const tri_inr = this.R * root3 / 6;

        var path1 = new Path([
            [0, 0],
            [0, -this.r - tri_inr],
            [-this.R, -2 * this.r],
            [-this.R, -tri_rad]
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
        var path7 = path2.clone().rotate(240, path2.bounds.rightCenter)
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
            path7
        ];
    }

    circumradius() {
        return this.R + this.R * root3 / 2;
    }
}

class DualSnubHex extends Hex {
    constructor(R) {
        super(R);
        this.dx = 2.5 * R;
        this.dy = 2 * this.r + 2 * (this.R * root3 / 3) - this.R * root3 / 6;
        this.ddx = 0.5 * R;
        this.ddy = this.r;
    }

    unit() {
        const tri_rad = this.R * root3 / 3;
        const tri_inr = this.R * root3 / 6;

        var path = new Path([
            [0, 0],
            [0, -(this.r + tri_inr)],
            [0.5 * this.R, -(this.r + tri_rad)],
            [this.R, -(this.r + tri_inr)],
            [this.R, -tri_rad]
        ])
        path.closed = true;
        path.name = "mer-1";

        return [
            path,
            path.clone().rotate(60, [0, 0]),
            path.clone().rotate(120, [0, 0]),
            path.clone().rotate(180, [0, 0]),
            path.clone().rotate(240, [0, 0]),
            path.clone().rotate(300, [0, 0])
        ];
    }

}

class DualRhombiTriHex extends Hex {
    constructor(R) {
        super(R);
    }

    unit() {
        var line = new Path([[0, 0], [0, this.r]]);
        var path = new Path([
            [0, 0],
            line.rotate(30, [0, 0]).bounds.bottomLeft,
            [0, this.R],
            line.rotate(-60, [0, 0]).bounds.bottomRight
        ]);
        path.closed = true;
        path.name = "mer-1";
        line.remove();

        return [
            path,
            path.clone().rotate(60, [0, 0]),
            path.clone().rotate(120, [0, 0]),
            path.clone().rotate(180, [0, 0]),
            path.clone().rotate(240, [0, 0]),
            path.clone().rotate(300, [0, 0])
        ];
    }
}

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

function drawIco(face, R, P) {
    // affine transform each triangle to the 2D projection of icosahedron face
    const A = Matrix.inv3([
        [face.bounds.topCenter.x, face.bounds.bottomLeft.x, face.bounds.bottomRight.x],
        [face.bounds.topCenter.y, face.bounds.bottomLeft.y, face.bounds.bottomRight.y],
        [1, 1, 1]
    ]);

    return new Group(RegularIcosahedron.faces(R, P).map(e => {
        const B = [
            [e[0][0], e[1][0], e[2][0]],
            [e[0][1], e[1][1], e[2][1]],
            [1, 1, 1]
        ];
        const M = Matrix.mul(B, A);
        return face.clone().transform(
            new paper.Matrix(
                M[0][0], M[1][0],
                M[0][1], M[1][1],
                M[0][2], M[1][2]
            )
        );
    }));
}
