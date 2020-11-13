function setup() {
    createCanvas(400, 400);
}

function draw() {
    background(220);
    grid(15, 15, 10);
    walk(6, 4, 10);
}

function deg2rad(x) {
    return x * Math.PI / 180;
}

function walk(h, k, R) {
    var [width, height] = [Math.sqrt(3) * R, 2 * R];
    var [c, r] = [0, k];
    var p1 = coor(r, c, width, height);
    ellipse(p1[0], p1[1], 5, 5);
    r += h
    c += k
    var p2 = coor(r, c, width, height);
    ellipse(p2[0], p2[1], 5, 5);
    r -= h
    c += h
    r -= k
    var p3 = coor(r, c, width, height);
    ellipse(p3[0], p3[1], 5, 5);

    line(p1[0], p1[1], p2[0], p2[1]);
    line(p2[0], p2[1], p3[0], p3[1]);
    line(p3[0], p3[1], p1[0], p1[1]);
    // c -= h
    // r += k
    // c -= k
    // yield [c, r]
}

function coor(i, j, w, h) {
    return [0.5 * w + j * w + 0.5 * w * i, 0.5 * h + 0.75 * h * i]
}

function grid(nr, nc, R) {
    var [w, h, t] = [Math.sqrt(3) * R, 2 * R, deg2rad(30)];
    for (var i = 0; i < nr; i++) {
        for (var j = 0; j < nc; j++) {
            var [x, y] = coor(i, j, w, h);
            polygon(x, y, 6, R, t);
            ellipse(x, y, 1, 1);
        }
    }
}

function polygon(x, y, n, R, t = 0) {
    beginShape();
    for (var i = 0; i < n; i++) {
        vertex(
            x + R * Math.cos(t + i * 2 * Math.PI / n),
            y + R * Math.sin(t + i * 2 * Math.PI / n)
        );
    }
    endShape(CLOSE);
}