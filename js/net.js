paper.install(window);

window.onload = function () {
    paper.setup("myCanvas");
    var [h, k, R] = [5, 0, 15];
    let n = h + k + 1;

    let p = Array.from(walk(0, k, h, k, R));
    let f = new Path(p);
    f.closed = true;

    var f1 = [];
    for (var e of grid(n, n, R)) {
        var hex = f.intersect(e);
        hex.strokeColor = "black";
        hex.strokeWidth = 2;
        hex.fillColor = (
            (hex.contains(p[0]) || hex.contains(p[1]) || hex.contains(p[2])) ? "lightblue" : "lightgrey"
        );
        f1.push(hex);
    }
    f.strokeWidth = 2;
    f1.push(f);

    f1 = new Group(f1);
    var c = p[0].add(p[1]).add(p[2]).multiply(1 / 3);
    f1.rotate(90 - c.subtract(p[0]).angle, c)
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

function onResize(event) {
    path.position = view.center;
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
