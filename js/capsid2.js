const root2 = Math.sqrt(2)
const root3 = Math.sqrt(3)


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
        var hex = new Path.RegularPolygon(this.coor(0, 0, this.dx, this.dy), 6, this.R);
        hex.fillColor = "grey";
        hex.opacity = 0.5;
        return new Group(hex);
    }

    // map hexagon grid row/col to cartesian coordinates
    coor(i, j) {
        return [i * this.dx + j * this.ddx, j * this.dy + i * this.ddy];
    }

    // generate hexagonal grid
    * grid(nr, nc) {
        const u = this.unit(this.R);
        for (var i = 0; i < nr; i++) {
            for (var j = 0; j < nc - Math.floor(i / 2); j++) {
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

    face(h, k) {
        const n = h + k + 1;

        var p = this.walk(h, k, 0, k);
        var f = new Path(p);
        f.closed = true;
        f.strokeColor = "black";
        // f.fillColor = "grey";
        f.opacity = 0.5;

        // computer intersection of triangle with hexagonal grid
        var g = [];
        for (var u of this.grid(n, n)) {
            for (var i = 0; i < u.children.length; i++) {
                var x = f.intersect(u.children[i]);
                x.fillColor = u.children[i].fillColor;
                g.push(x);
            }
            u.remove();
        }
        f.remove();
        var g = new Group(g);

        var c = p[0].add(p[1]).add(p[2]).multiply(1 / 3);
        g.rotate(90 - c.subtract(p[0]).angle, c);

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
        tri1.fillColor = "red";
        tri1.opacity = 0.5;
        var tri2 = tri1.clone().rotate(-180, tri1.bounds.bottomLeft)
        var hex = new Path.RegularPolygon([0, 0], 6, this.R).rotate(30);
        hex.fillColor = "grey";
        hex.opacity = 0.5;
        return new Group([tri1, tri2, hex]);
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
        tri1.fillColor = "red";
        tri1.opacity = 0.5;
        var tri2 = tri1.clone().rotate(-60, tri1.bounds.bottomLeft);
        var tri3 = tri1.clone().rotate(-120, tri1.bounds.bottomLeft);
        var tri4 = tri1.clone().rotate(-180, tri1.bounds.bottomLeft);
        var tri5 = tri4.clone().rotate(-60, tri4.bounds.bottomCenter);
        var tri6 = tri4.clone().rotate(-120, tri4.bounds.bottomCenter);
        var tri7 = tri4.clone().rotate(-180, tri4.bounds.bottomCenter);
        var tri8 = tri7.clone().rotate(-60, tri7.bounds.bottomRight);
        var hex = new Path.RegularPolygon([0, 0], 6, this.R).rotate(30);
        hex.fillColor = "grey";
        hex.opacity = 0.5;
        return new Group([tri1, tri2, tri3, tri4, tri5, tri6, tri7, tri8, hex]);
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
        hex.fillColor = "grey";
        hex.opacity = 0.50;

        var sqr1 = new Path.RegularPolygon([0, 0], 4, Math.sqrt(2 * this.R * this.R) / 2);
        sqr1.fillColor = "orange";
        sqr1.opacity = 0.50;
        sqr1.bounds.x = hex.bounds.left - sqr1.bounds.width;
        var sqr2 = sqr1.clone().rotate(150, sqr1.bounds.topRight);
        var sqr3 = sqr1.clone().rotate(-150, sqr1.bounds.bottomRight);

        var tri1 = new Path.RegularPolygon([0, 0], 3, this.R * root3 / 3).rotate(180);
        tri1.fillColor = "red";
        tri1.position.y = hex.bounds.top - this.R * root3 / 2 / 2;
        var tri2 = tri1.clone().rotate(180);
        tri2.position = sqr1.position;
        tri2.bounds.bottom = sqr1.bounds.top;
        return new Group([sqr1, sqr2, sqr3, tri1, tri2, hex]);
    }
}

function calcNet(face) {
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

function draw() {
    const [h, k, R] = [5, 0, 20];
    // var hex = new Hex(R);
    // var hex = new TriHex(R);
    // var hex = new SnubHex(R);
    var hex = new RhombiTriHex(R);
    var face = hex.face(h, k, R);
    // face.rotate(60);
    var net = calcNet(face);
    net.position = view.center;
    face.remove();
}
