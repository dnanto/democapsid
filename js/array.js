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
