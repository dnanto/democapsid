function deg2rad(x) {
    return x * Math.PI / 180;
}

function draw_regular_polygon(ctx, n, x, y, r, t = 0) {
    ctx.beginPath();
    // encircle
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    // draw R'
    ctx.lineTo(x, y);
    // draw edges
    var coor = [0, 0];
    for (var i = 0; i <= n; i++) {
        ctx.lineTo(
            x + r * Math.cos(t + i * 2 * Math.PI / n),
            y + r * Math.sin(t + i * 2 * Math.PI / n)
        );
    }
    // draw R
    n *= 2;
    for (var i = 0; i <= n; i++) {
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + r * Math.cos(t + i * 2 * Math.PI / n),
            y + r * Math.sin(t + i * 2 * Math.PI / n)
        );
    }
    ctx.stroke();
}

window.onload = function () {
    var c = document.getElementById("canvas");
    var ctx = c.getContext("2d");

    var r = 100;
    var t = deg2rad(0);
    var x = c.width / 2, y = c.height / 2;

    // rotate 5 -> 6
    draw_regular_polygon(ctx, 5, x, y, r, t);
    draw_regular_polygon(ctx, 6, x, y, 2 * r * Math.sin(Math.PI / 5), t + deg2rad(6));

    // rotate 6 -> 5
    // draw_regular_polygon(ctx, 6, x, y, 2 * r * Math.sin(Math.PI / 5));
    // draw_regular_polygon(ctx, 5, x, y, r, t + deg2rad(30));
}
