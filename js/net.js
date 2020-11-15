paper.install(window);

window.onload = function () {
    paper.setup("myCanvas");
    var [h, k, R] = [5, 8, 25];
    let n = h + k + 1;

    let p = Array.from(walk(0, k, h, k, R));
    let f = new Path(p);
    f.closed = true;

    var g = [];
    for (var e of grid(n, n, R)) {
        var hex = f.intersect(e);
        hex.strokeColor = "black";
        hex.strokeWidth = 2;
        hex.fillColor = (
            (hex.contains(p[0]) || hex.contains(p[1]) || hex.contains(p[2])) ? "lightblue" : "lightgrey"
        );
        g.push(hex);
    }
    f.strokeWidth = 2;
    g.push(f);
    g = new Group(g);
    var c = p[0].add(p[1]).add(p[2]).multiply(1 / 3);
    console.log(c.subtract(p[0]).angle);
    g.rotate(90 - c.subtract(p[0]).angle, c)
    g.position = view.center;
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

function* face() {

}