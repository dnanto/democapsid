var [θ, ψ, φ] = [15, 15, 0];
var R = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
];
var K = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
];
var C = [0, 0, 0];
var P = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
];

var phi = (1 + Math.sqrt(5)) / 2;
var [a, b] = [1 / 2, 1 / (2 * phi)];
a *= 500;
b *= 500;

var verts = [
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
    [-b, -a, 0, 1]
];

function mmult(A, B) {
    var [m, n, p] = [A.length, A[0].length, B[0].length];
    var C = new Array(m);
    for (var i = 0; i < m; i++)
        C[i] = new Array(p).fill(0);
    for (var i = 0; i < m; i++)
        for (var j = 0; j < p; j++)
            for (var k = 0; k < n; k++)
                C[i][j] += A[i][k] * B[k][j];
    return C;
}

function det(A) {
    return (
        A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
        A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
        A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
    );
}

function inv(A) {
    var [a, b, c, d, e, f, g, h, i] = [
        A[0][0], A[0][1], A[0][2],
        A[1][0], A[1][1], A[1][2],
        A[2][0], A[2][1], A[2][2]
    ]
    var dA = det(A);
    return [
        [(e * i - f * h) / dA, -(b * i - c * h) / dA, (b * f - c * e) / dA],
        [-(d * i - f * g) / dA, (a * i - c * g) / dA, -(a * f - c * d) / dA],
        [(d * h - e * g) / dA, -(a * h - b * g) / dA, (a * e - b * d) / dA]
    ]
}

function calcR() {
    var [sinθ, sinψ, sinφ] = [Math.sin(θ), Math.sin(ψ), Math.sin(φ)];
    var [cosθ, cosψ, cosφ] = [Math.cos(θ), Math.cos(ψ), Math.cos(φ)];
    R[0][0] = cosθ * cosψ;
    R[0][1] = cosθ * sinψ * sinφ - sinθ * cosφ;
    R[0][2] = cosθ * sinψ * cosφ + sinθ * sinφ;
    R[1][0] = sinθ * cosψ;
    R[1][1] = sinθ * sinψ * sinφ + cosθ * cosφ;
    R[1][2] = sinθ * sinψ * cosφ - cosθ * sinφ;
    R[2][0] = -sinψ;
    R[2][1] = cosψ * sinφ;
    R[2][2] = cosψ * cosφ;
}

function calcP() {
    var IC = [
        [1, 0, 0, -C[0]],
        [0, 1, 0, -C[1]],
        [0, 0, 1, -C[2]]
    ];
    P = mmult(mmult(K, R), IC);
}

paper.install(window);

window.onload = function () {
    paper.setup("canvas");

    view.onFrame = function (event) {
        if (event.count % 5 === 0) {
            project.clear();
            θ = (θ + 0.05) % 360;
            ψ = (ψ + 0.05) % 360;
            φ = (φ + 0.05) % 360;
            draw();
        }
    };
}

function draw() {
    calcR();
    calcP();
    var v = verts.map(v => mmult(P, v.map(e => [e]))).map(e => [e[0][0], e[1][0]]);

    var faces = [
        [v[0], v[1], v[2]],
        [v[3], v[2], v[1]],
        [v[3], v[4], v[5]],
        [v[3], v[8], v[4]],
        [v[0], v[6], v[7]],
        [v[0], v[9], v[6]],
        [v[4], v[10], v[11]],
        [v[6], v[11], v[10]],
        [v[2], v[5], v[9]],
        [v[11], v[9], v[5]],
        [v[1], v[7], v[8]],
        [v[10], v[8], v[7]],
        [v[3], v[5], v[2]],
        [v[3], v[1], v[8]],
        [v[0], v[2], v[9]],
        [v[0], v[7], v[1]],
        [v[6], v[9], v[11]],
        [v[6], v[10], v[7]],
        [v[4], v[11], v[5]],
        [v[4], v[8], v[10]]
    ];

    var g = new Group(faces.map(e => new Path(e)));
    g.strokeColor = "black";
    g.position = view.center;

    let [h, k, R] = [2, 0, 25];
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

    var A = [
        [face.bounds.topLeft.x, face.bounds.topRight.x, face.bounds.bottomCenter.x],
        [face.bounds.topLeft.y, face.bounds.topRight.y, face.bounds.bottomCenter.y],
        [1, 1, 1]
    ];

    g.children.forEach(e => {
        var B = [
            [e.segments[0].point.x, e.segments[1].point.x, e.segments[2].point.x],
            [e.segments[0].point.y, e.segments[1].point.y, e.segments[2].point.y],
            [1, 1, 1]
        ];
        var tx = mmult(B, inv(A));
        face.clone().transform(new Matrix(
            tx[0][0], tx[1][0],
            tx[0][1], tx[1][1],
            tx[0][2], tx[1][2]
        ));
        g.addChild(face);
    });

    face.remove();
}

function coor(i, j, w, h) {
    return [0.5 * w + j * w + 0.5 * w * i, 0.5 * h + 0.75 * h * i];
}

function* walk(c, r, h, k, R) {
    var [width, height] = [Math.sqrt(3) * R, 2 * R];
    yield new Point(coor(r, c, width, height));
    yield new Point(coor(r + h, c + k, width, height));
    yield new Point(coor(r - k, c + k + h, width, height));
}

function* grid(nr, nc, R) {
    var [w, h] = [Math.sqrt(3) * R, 2 * R];
    for (var i = 0; i < nr; i++)
        for (var j = 0; j < nc; j++)
            yield new Path.RegularPolygon(coor(i, j, w, h), 6, R);
}
