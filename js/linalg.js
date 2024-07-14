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

Array.prototype.cross = function (v) {
    // https://en.wikipedia.org/wiki/Cross_product
    return [this[1] * v[2] - this[2] * v[1], this[2] * v[0] - this[0] * v[2], this[0] * v[1] - this[1] * v[0]];
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

Array.prototype.angle = function (v) {
    return Math.acos(this.dot(v) / (this.norm() * v.norm()));
};

Array.prototype.proj = function (v) {
    return v.mul(this.dot(v) / v.dot(v));
};

Array.prototype.T = function () {
    return this.map((e) => [e]);
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

function rotmat2(θ) {
    return [
        [Math.cos(θ), -Math.sin(θ)],
        [Math.sin(θ), Math.cos(θ)],
    ];
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

function I(n) {
    return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => 1 * (i == j)));
}

function diag(A) {
    const n = A.length;
    return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => A[i] * (i == j)));
}

function trace(A) {
    return Array.from({ length: A.length }, (_, i) => A[i][i]).sum();
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
