class Matrix {
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

    static det(A) {
        return (
            A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
            A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
            A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
        );
    }

    static inv(A) {
        const [a, b, c, d, e, f, g, h, i] = [
            A[0][0], A[0][1], A[0][2],
            A[1][0], A[1][1], A[1][2],
            A[2][0], A[2][1], A[2][2]
        ]
        const dA = this.det(A);
        return [
            [(e * i - f * h) / dA, -(b * i - c * h) / dA, (b * f - c * e) / dA],
            [-(d * i - f * g) / dA, (a * i - c * g) / dA, -(a * f - c * d) / dA],
            [(d * h - e * g) / dA, -(a * h - b * g) / dA, (a * e - b * d) / dA]
        ]
    }
}

class Camera {
    constructor() {
        [this.θ, this.ψ, this.φ] = [0, 0, 0];
        this.R = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
        this.K = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
        this.C = [0, 0, 0];
        this.P = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];
        this.update();
    }

    update() {
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
        const IC = [
            [1, 0, 0, -this.C[0]],
            [0, 1, 0, -this.C[1]],
            [0, 0, 1, -this.C[2]]
        ];
        this.P = Matrix.mul(Matrix.mul(this.K, this.R), IC);
    }
};

class RegularIcosahedron {
    constructor(R) {
        const phi = (1 + Math.sqrt(5)) / 2;
        const [a, b] = [0.5 * R, 1 / (2 * phi) * R];
        this.coordinates = [
            [0, b, -a, 1], [b, a, 0, 1], [-b, a, 0, 1], [0, b, a, 1],
            [0, -b, a, 1], [-a, 0, b, 1], [0, -b, -a, 1], [a, 0, -b, 1],
            [a, 0, b, 1], [-a, 0, -b, 1], [b, -a, 0, 1], [-b, -a, 0, 1]
        ];
    }

    verts(P) {
        return this.coordinates.map(v => Matrix.mul(P, v.map(e => [e]))).map(e => [e[0][0], e[1][0]]);
    }

    faces(P) {
        var v = this.verts(P);
        return [
            [v[0], v[1], v[2]], [v[3], v[2], v[1]], [v[3], v[4], v[5]], [v[3], v[8], v[4]],
            [v[0], v[6], v[7]], [v[0], v[9], v[6]], [v[4], v[10], v[11]], [v[6], v[11], v[10]],
            [v[2], v[5], v[9]], [v[11], v[9], v[5]], [v[1], v[7], v[8]], [v[10], v[8], v[7]],
            [v[3], v[5], v[2]], [v[3], v[1], v[8]], [v[0], v[2], v[9]], [v[0], v[7], v[1]],
            [v[6], v[9], v[11]], [v[6], v[10], v[7]], [v[4], v[11], v[5]], [v[4], v[8], v[10]]
        ];
    }
}

const [h, k, R, r] = [5, 1, 15, 1];
let camera = new Camera();
let solid = new RegularIcosahedron(500);

function coor(i, j, w, h) {
    return [0.5 * w + j * w + 0.5 * w * i, 0.5 * h + 0.75 * h * i];
}

function* walk(c, r, h, k, R) {
    const [width, height] = [Math.sqrt(3) * R, 2 * R];
    yield new Point(coor(r, c, width, height));
    yield new Point(coor(r + h, c + k, width, height));
    yield new Point(coor(r - k, c + k + h, width, height));
}

function* grid(nr, nc, R) {
    const [w, h] = [Math.sqrt(3) * R, 2 * R];
    for (var i = 0; i < nr; i++)
        for (var j = 0; j < nc; j++)
            yield new Path.RegularPolygon(coor(i, j, w, h), 6, R);
}

function face(h, k, R, r) {
    let n = h + k + 1;

    let p = Array.from(walk(0, k, h, k, R));
    let f = new Path(p);
    f.closed = true;

    var face = [];
    for (var e of grid(n, n, R)) {
        var hex = f.intersect(e);
        hex.strokeColor = "black";
        hex.fillColor = (
            (hex.contains(p[0]) || hex.contains(p[1]) || hex.contains(p[2])) ? "#ADD8E640" : "#90EE9040"
        );
        face.push(hex);
    }
    f.strokeColor = "black";
    face.push(f);

    face = new Group(face);
    var c = p[0].add(p[1]).add(p[2]).multiply(1 / 3);
    face.rotate(30 - c.subtract(p[0]).angle, c);
    f.scale(r, 1);

    return face;
}

function draw() {
    var g = new Group(solid.faces(camera.P).map(e => new Path(e)));
    g.position = view.center;

    var f = face(h, k, R, r);

    var A = [
        [f.bounds.topLeft.x, f.bounds.topRight.x, f.bounds.bottomCenter.x],
        [f.bounds.topLeft.y, f.bounds.topRight.y, f.bounds.bottomCenter.y],
        [1, 1, 1]
    ];

    g.children.forEach(e => {
        var B = [
            [e.segments[0].point.x, e.segments[1].point.x, e.segments[2].point.x],
            [e.segments[0].point.y, e.segments[1].point.y, e.segments[2].point.y],
            [1, 1, 1]
        ];
        var tx = Matrix.mul(B, Matrix.inv(A));
        f.clone().transform(new paper.Matrix(
            tx[0][0], tx[1][0],
            tx[0][1], tx[1][1],
            tx[0][2], tx[1][2]
        ));
    });

    f.remove();
    g.remove();
}

paper.install(window);

window.onload = function () {
    paper.setup("canvas");

    view.onFrame = function (event) {
        if (event.count % 5 === 0) {
            project.clear();
            camera.θ = (camera.θ + 0.05) % 360;
            camera.ψ = (camera.ψ + 0.05) % 360;
            camera.φ = (camera.φ + 0.05) % 360;
            camera.update();
            draw();
        }
    };
}
