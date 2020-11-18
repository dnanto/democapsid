let opt;
let camera;

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

    iter() {
        return [
            [0, 1, 2], [3, 2, 1], [3, 4, 5], [3, 8, 4], [0, 6, 7],
            [0, 9, 6], [4, 10, 11], [6, 11, 10], [2, 5, 9], [11, 9, 5],
            [1, 7, 8], [10, 8, 7], [3, 5, 2], [3, 1, 8], [0, 2, 9],
            [0, 7, 1], [6, 9, 11], [6, 10, 7], [4, 11, 5], [4, 8, 10]
        ]
    }

    verts3D(P) {
        return this.coordinates.map(v => Matrix.mul(P, v.map(e => [e])));
    }

    faces2D(P) {
        var p3 = this.verts3D(P);
        var p2 = p3.map(e => [e[0][0], e[1][0]]);
        return this.iter()
            .sort((a, b) =>
                Math.min(p3[a[0]][2], p3[a[1]][2], p3[a[2]][2]) -
                Math.min(p3[b[0]][2], p3[b[1]][2], p3[b[2]][2])
            )
            .map(e => [p2[e[0]], p2[e[1]], p2[e[2]]]);
    }
}

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

function tNumber() {
    const [h, k] = [opt.h, opt.k];
    document.getElementById("tnumber").innerHTML = "&nbsp;&nbsp;=&nbsp;";
    document.getElementById("tnumber").innerHTML += `${h}<sup>2</sup>&nbsp;+&nbsp;`;
    document.getElementById("tnumber").innerHTML += `(${h})(${k})&nbsp;+&nbsp;`;
    document.getElementById("tnumber").innerHTML += `${k}<sup>2</sup><br>&nbsp;&nbsp;=&nbsp;`;
    document.getElementById("tnumber").innerHTML += `${h * h + h * k + k * k}`;
}

function drawFace(angle) {
    const [h, k, R] = [opt.h, opt.k, opt.R2];
    const n = h + k + 1;

    const p = Array.from(walk(0, k, h, k, R));
    const f = new Path(p);
    f.closed = true;

    var g = [];
    for (var e of grid(n, n, R)) {
        var hex = f.intersect(e);
        hex.strokeColor = opt.hexoutl;
        hex.strokeWidth = opt.hexline;
        hex.fillColor = (
            (hex.contains(p[0]) || hex.contains(p[1]) || hex.contains(p[2])) ?
                (opt.penfill + Number(opt.penalph).toString(16).padStart(2, "0")) :
                (opt.hexfill + Number(opt.hexalph).toString(16).padStart(2, "0"))
        );
        g.push(hex);
    }
    f.strokeColor = opt.fctoutl;
    f.strokeWidth = opt.fctline;
    g.push(f);

    g = new Group(g);
    var c = p[0].add(p[1]).add(p[2]).multiply(1 / 3);
    g.rotate(angle - c.subtract(p[0]).angle, c);
    g.scale(opt.levo ? -1 : 1, 1);

    return g;
}

function drawNet() {
    var f1 = drawFace(90);

    var f2 = f1.clone();
    f2.rotate(300, f1.bounds.bottomRight);
    var f3 = f1.clone();
    f3.rotate(240, f1.bounds.bottomRight);
    var f4 = f3.clone();
    f4.rotate(300, f3.bounds.bottomRight);

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
}

function drawSolid() {
    var ico = new RegularIcosahedron(opt.R3);
    var g = new Group(ico.faces2D(camera.P).map(e => new Path(e)));
    g.position = view.center;

    var f = drawFace(30);

    var A = [
        [f.bounds.topLeft.x, f.bounds.topRight.x, f.bounds.bottomCenter.x],
        [f.bounds.topLeft.y, f.bounds.topRight.y, f.bounds.bottomCenter.y],
        [1, 1, 1]
    ];

    g.children.map(e => {
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

function redraw() {
    project.clear();
    opt = {
        h: parseInt(document.getElementById("h").value),
        k: parseInt(document.getElementById("k").value),
        solid: document.getElementById("solid").checked,
        net: document.getElementById("net").checked,
        levo: document.getElementById("levo").checked,
        dextro: document.getElementById("dextro").checked,
        R2: parseInt(document.getElementById("R2").value),
        R3: parseInt(document.getElementById("R3").value),
        θ: document.getElementById("θ").value,
        ψ: document.getElementById("ψ").value,
        φ: document.getElementById("φ").value,
        penalph: document.getElementById("penalph").value,
        hexalph: document.getElementById("hexalph").value,
        penfill: document.getElementById("penfill").value,
        hexfill: document.getElementById("hexfill").value,
        hexoutl: document.getElementById("hexoutl").value,
        fctoutl: document.getElementById("fctoutl").value,
        hexline: parseInt(document.getElementById("hexline").value),
        fctline: parseInt(document.getElementById("fctline").value)
    };
    [camera.θ, camera.ψ, camera.φ] = [opt.θ, opt.ψ, opt.φ];
    camera.update();
    tNumber();
    if (opt.solid)
        drawSolid();
    else
        drawNet();
}

paper.install(window);

window.onload = function () {
    paper.setup("canvas");
    camera = new Camera();
    redraw();
    Object.keys(opt).forEach(e =>
        document.getElementById(e).addEventListener("change", redraw)
    );
    view.onFrame = function (event) {
        const interval = parseInt(document.getElementById("interval").value);
        if (opt.solid && event.count % interval === 0) {
            ["θ", "ψ", "φ"].forEach(e =>
                document.getElementById(e).value = (
                    (parseFloat(document.getElementById(e).value) + 0.05) % 360
                )
            );
            redraw();
        };
    }
}
