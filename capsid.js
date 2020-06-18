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
    ctx.stroke();
}

window.onload = function () {
    var F = 1, h = 5, k = 0;
    var t = 0;
    var dextro = 3, laevo = -1;
    var handedness = laevo;

    var R5 = 75;
    var R6 = 2 * R5 * Math.sin(Math.PI / 5);
    var r5 = R6 / (2 * Math.tan(Math.PI / 5));
    var r6 = R6 * Math.cos(Math.PI / 6);

    var c = document.getElementById("canvas");
    var ctx = c.getContext("2d");
    var x1 = R5, y1 = R5;
    draw_regular_polygon(ctx, 5, x1, y1, R5, r5, deg2rad(t));

    var d = r5 + r6, a1 = 36, a2 = 6;
    for (let f = 0; f < F; f++) {

        for (let i = 0; i < h - ((f == F - 1) * (k == 0)); i++) {
            x2 = x1 + d * Math.cos(deg2rad(a1 + t));
            y2 = y1 + d * Math.sin(deg2rad(a1 + t));
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            draw_regular_polygon(ctx, 6, x2, y2, R6, r6, deg2rad(a2 + t));
            x1 = x2, y1 = y2;
            d = 2 * r6;
        }

        a1 = 30, a2 = 6;
        for (let j = 0; j < k - (f == F - 1); j++) {
            x2 = x1 + d * Math.cos(deg2rad(handedness * a1 + a2 + t));
            y2 = y1 + d * Math.sin(deg2rad(handedness * a1 + a2 + t));
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            draw_regular_polygon(ctx, 6, x2, y2, R6, r6, deg2rad(a2 + t));
            x1 = x2, y1 = y2;
        }
        a1 = 36, a2 = 6;
    }

    d = r5 + r6;
    if (k > 0) {
        a1 = 30;
        x2 = x1 + d * Math.cos(deg2rad(handedness * 30 + 6 + t));
        y2 = y1 + d * Math.sin(deg2rad(handedness * 30 + 6 + t));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        draw_regular_polygon(ctx, 5, x2, y2, R5, r5, deg2rad((handedness == dextro) ? 24 : -24 + t));
        x1 = x2, y1 = y2;
    } else {
        x2 = x1 + d * Math.cos(deg2rad(36 + t));
        y2 = y1 + d * Math.sin(deg2rad(36 + t));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        draw_regular_polygon(ctx, 5, x2, y2, R5, r5, deg2rad(36 + t));
    }
}
