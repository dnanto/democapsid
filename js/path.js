var dextro = 3, levo = -1;

function deg2rad(x) {
    return x * Math.PI / 180;
}

function draw_regular_polygon(ctx, n, x, y, R, r, t = 0) {
    // inscribe
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    // circumscribe
    ctx.arc(x, y, R, 0, 2 * Math.PI);
    // draw 0-degree radius
    ctx.lineTo(x, y);
    // draw edges
    for (var i = 0; i <= n; i++) {
        ctx.lineTo(
            x + R * Math.cos(t + i * 2 * Math.PI / n),
            y + R * Math.sin(t + i * 2 * Math.PI / n)
        );
    }
    // draw R
    for (var i = 0; i < n; i++) {
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + R * Math.cos(t + i * 2 * Math.PI / n),
            y + R * Math.sin(t + i * 2 * Math.PI / n)
        );
    }
    // draw r
    n *= 2;
    for (var i = 0; i < n; i++) {
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + r * Math.cos(t + i * 2 * Math.PI / n),
            y + r * Math.sin(t + i * 2 * Math.PI / n)
        );
    }
    // angle of triangle
    ctx.moveTo(x, y);
    ctx.arc(x, y, R / 4, 0, 2 * Math.PI / n + t);
    // angle tilt
    ctx.moveTo(x, y);
    ctx.arc(x, y, R / 2, 0, t);
}

function edge2radii(e) {
    // R5, r5, R6, r6
    return [
        e / 2 / Math.sin(Math.PI / 5), e / 2 / Math.tan(Math.PI / 5),
        e, e * Math.cos(Math.PI / 6)
    ]
}

function displacement(e, F, h, k, s, t, rota) {
    let [R5, r5, R6, r6] = edge2radii(e);
    var x = 0, y = 0;
    var rot1 = deg2rad(36 + t), rot2 = deg2rad(rota * 30 + 6 + t);
    for (let f = 0; f < F; f++) {
        for (let i = 0, r = f ? r6 : r5; i < h - ((f == F - 1) * !k); i++, r = r6) {
            x += (r + r6 + s) * Math.cos(rot1);
            y += (r + r6 + s) * Math.sin(rot1);
        }
        for (let j = 0; j < k - (f == F - 1); j++) {
            x += (r6 + r6 + s) * Math.cos(rot2);
            y += (r6 + r6 + s) * Math.sin(rot2);
        }
    }

    var rot1 = deg2rad(36 + t), rot2 = deg2rad(36 + t);
    if (k > 0) {
        rot1 = deg2rad(rota * 30 + 6 + t);
        rot2 = deg2rad((rota == dextro) ? 24 : -24 + t);
    }
    var r = (h == 1 && k == 0) ? r5 : r6;

    return [x + (r5 + r + s) * Math.cos(rot1), y + (r5 + r + s) * Math.sin(rot1)];
}

function draw(ctx, x, y, e, F, h, k, s, t, rota) {
    var x1 = x, y1 = y;
    let [R5, r5, R6, r6] = edge2radii(e);

    ctx.beginPath();
    draw_regular_polygon(ctx, 5, x1, y1, R5, r5, deg2rad(t));
    ctx.stroke();

    var rot1 = deg2rad(36 + t), rot2 = deg2rad(rota * 30 + 6 + t), rot3 = deg2rad(6 + t);
    for (let f = 0; f < F; f++) {

        for (let i = 0, r = f ? r6 : r5; i < h - ((f == F - 1) * !k); i++, r = r6) {
            x2 = x1 + (r + r6 + s) * Math.cos(rot1);
            y2 = y1 + (r + r6 + s) * Math.sin(rot1);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.beginPath();
            draw_regular_polygon(ctx, 6, x2, y2, R6, r6, rot3);
            ctx.stroke()
            x1 = x2, y1 = y2;
        }

        for (let j = 0; j < k - (f == F - 1); j++) {
            x2 = x1 + (r6 + r6 + s) * Math.cos(rot2);
            y2 = y1 + (r6 + r6 + s) * Math.sin(rot2);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.beginPath();
            draw_regular_polygon(ctx, 6, x2, y2, R6, r6, rot3);
            ctx.stroke();
            x1 = x2, y1 = y2;
        }
    }

    var rot1 = deg2rad(36 + t), rot2 = deg2rad(36 + t);
    if (k > 0) {
        rot1 = deg2rad(rota * 30 + 6 + t);
        rot2 = deg2rad(((rota == dextro) ? 24 : -24) + t);
    }
    var r = (h == 1 && k == 0) ? r5 : r6;
    x2 = x1 + (r5 + r + s) * Math.cos(rot1);
    y2 = y1 + (r5 + r + s) * Math.sin(rot1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    draw_regular_polygon(ctx, 5, x2, y2, R5, r5, rot2);
    ctx.stroke();
}

function draw_centered(c, e, F, h, k, s, t, rota) {
    let [R5, r5, R6, r6] = edge2radii(e);
    var ctx = c.getContext("2d");
    let [x, y] = displacement(e, F, h, k, s, t, rota);
    x = (c.width - x) / 2, y = (c.height - y) / 2;
    draw(ctx, x, y, e, F, h, k, s, t, rota);
}

function clear(c) {
    var ctx = c.getContext("2d");
    console.log("hey");
    ctx.clearRect(0, 0, c.width, c.height);
}

window.onload = function () {
    var F = parseInt(document.getElementById("F").value);
    var h = parseInt(document.getElementById("h").value);
    var k = parseInt(document.getElementById("k").value);
    var e = parseInt(document.getElementById("e").value);
    var s = parseInt(document.getElementById("s").value);
    var t = parseInt(document.getElementById("t").value);
    var rota = dextro;

    var c = document.getElementById("canvas");
    draw_centered(c, e, F, h, k, s, t, rota);

    document.getElementById("F").addEventListener("input", function (ele) {
        F = parseInt(ele.target.value);
        clear(c);
        draw_centered(c, e, F, h, k, s, t, rota);
    });
    document.getElementById("h").addEventListener("input", function (ele) {
        h = parseInt(ele.target.value);
        clear(c);
        draw_centered(c, e, F, h, k, s, t, rota);
    });
    document.getElementById("k").addEventListener("input", function (ele) {
        k = parseInt(ele.target.value);
        clear(c);
        draw_centered(c, e, F, h, k, s, t, rota);
    });
    document.getElementById("e").addEventListener("input", function (ele) {
        e = parseInt(ele.target.value);
        clear(c);
        draw_centered(c, e, F, h, k, s, t, rota);
    });
    document.getElementById("s").addEventListener("input", function (ele) {
        s = parseInt(ele.target.value);
        clear(c);
        draw_centered(c, e, F, h, k, s, t, rota);
    });
    document.getElementById("t").addEventListener("input", function (ele) {
        t = parseInt(ele.target.value);
        clear(c);
        draw_centered(c, e, F, h, k, s, t, rota);
    });    
    document.getElementById("dextro").addEventListener("change", function (ele) {
        rota = parseInt(ele.target.value);
        clear(c);
        draw_centered(c, e, F, h, k, s, t, rota);
    });
    document.getElementById("levo").addEventListener("change", function (ele) {
        rota = parseInt(ele.target.value);
        clear(c);
        draw_centered(c, e, F, h, k, s, t, rota);
    });
}
