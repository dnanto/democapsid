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
