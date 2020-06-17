function deg2rad(x) {
    return x * Math.PI / 180;
}

function draw_regular_polygon(ctx, n, x, y, R, r, t = 0) {
    ctx.beginPath();
    // circumscribe
    ctx.arc(x, y, R, 0, 2 * Math.PI);
    // inscribe
    ctx.arc(x, y, r, 0, 2 * Math.PI);
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
    ctx.stroke();
}

window.onload = function () {
    var R5 = 100;
    var R6 = 2 * R5 * Math.sin(Math.PI / 5);
    var r5 = R6 / (2 * Math.tan(Math.PI / 5));
    var r6 = R6 * Math.cos(Math.PI / 6);

    // 5 -> 5
    {
        var c = document.getElementById("canvas_5-5");
        var ctx = c.getContext("2d");
        var x1 = c.width / 2, y1 = c.height / 2;
        draw_regular_polygon(ctx, 5, x1, y1, R5, r5);
        var x2 = x1 + 2 * r5 * Math.cos(deg2rad(36));
        var y2 = y1 + 2 * r5 * Math.sin(deg2rad(36));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.arc(x1, y1, R5 / 4, 0, deg2rad(36));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        draw_regular_polygon(ctx, 5, x2, y2, R5, r5, deg2rad(36));
    }

    // 5 -> 6
    {
        var c = document.getElementById("canvas_5-6");
        var ctx = c.getContext("2d");
        var x1 = c.width / 2, y1 = c.height / 2;
        draw_regular_polygon(ctx, 5, x1, y1, R5, r5);
        var x2 = x1 + (r5 + r6) * Math.cos(deg2rad(36));
        var y2 = y1 + (r5 + r6) * Math.sin(deg2rad(36));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.arc(x1, y1, R5 / 4, 0, deg2rad(36));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        draw_regular_polygon(ctx, 6, x2, y2, R6, r6, deg2rad(6));
    }

    // 6 -> 5
    {
        var c = document.getElementById("canvas_6-5");
        var ctx = c.getContext("2d");
        var x1 = c.width / 2, y1 = c.height / 2;
        draw_regular_polygon(ctx, 6, x1, y1, R6, r6);
        var x2 = x1 + (r5 + r6) * Math.cos(deg2rad(30));
        var y2 = y1 + (r5 + r6) * Math.sin(deg2rad(30));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.arc(x1, y1, R6 / 4, 0, deg2rad(0));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        draw_regular_polygon(ctx, 5, x2, y2, R5, r5, deg2rad(30));
    }

    // 6 -> 6
    {
        var c = document.getElementById("canvas_6-6");
        var ctx = c.getContext("2d");
        var x1 = c.width / 2, y1 = c.height / 2;
        draw_regular_polygon(ctx, 6, x1, y1, R6, r6);
        var x2 = x1 + 2 * r6 * Math.cos(deg2rad(30));
        var y2 = y1 + 2 * r6 * Math.sin(deg2rad(30));
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.arc(x1, y1, R6 / 4, 0, deg2rad(30));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        draw_regular_polygon(ctx, 6, x2, y2, R6, r6, deg2rad(0));
    }
}
