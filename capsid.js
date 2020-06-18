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

window.onload = function () {
    var F = 3, h = 2, k = 1;
    var s = 25, t = 0;
    var dextro = 3, laevo = -1;
    var handedness = dextro;

    var R5 = 50;
    var R6 = 2 * R5 * Math.sin(Math.PI / 5);
    var r5 = R6 / (2 * Math.tan(Math.PI / 5));
    var r6 = R6 * Math.cos(Math.PI / 6);

    var c = document.getElementById("canvas");
    var ctx = c.getContext("2d");
    var x1 = R5, y1 = R5;
    ctx.beginPath();
    draw_regular_polygon(ctx, 5, x1, y1, R5, r5, deg2rad(t));
    ctx.stroke();

    var rot1 = deg2rad(36 + t), rot2 = deg2rad(6 + t), rot3 = deg2rad(handedness * 30 + 6 + t);
    for (let f = 0; f < F; f++) {

        for (let i = 0, r = f ? r6 : r5; i < h - ((f == F - 1) * !k); i++, r = r6) {
            x2 = x1 + (r + r6 + s) * Math.cos(rot1);
            y2 = y1 + (r + r6 + s) * Math.sin(rot1);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.beginPath();
            draw_regular_polygon(ctx, 6, x2, y2, R6, r6, rot2);
            ctx.stroke()
            x1 = x2, y1 = y2;
        }

        for (let j = 0; j < k - (f == F - 1); j++) {
            x2 = x1 + (r6 + r6 + s) * Math.cos(rot3);
            y2 = y1 + (r6 + r6 + s) * Math.sin(rot3);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.beginPath();
            draw_regular_polygon(ctx, 6, x2, y2, R6, r6, rot2);
            ctx.stroke();
            x1 = x2, y1 = y2;
        }
    }

    var rot1 = deg2rad(36 + t), rot2 = deg2rad(36 + t);
    if (k > 0) {
        rot1 = deg2rad(handedness * 30 + 6 + t);
        rot2 = deg2rad((handedness == dextro) ? 24 : -24 + t);
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
