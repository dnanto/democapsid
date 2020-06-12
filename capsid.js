function draw_regular_polygon(ctx, n, x, y, r, t = 0) {
    ctx.beginPath();
    // draw R
    ctx.lineTo(x, y);
    // draw outline
    for (var i = 0; i <= n; i++) {
        ctx.lineTo(
            x + r * Math.cos(t + i * 2 * Math.PI / n),
            y + r * Math.sin(t + i * 2 * Math.PI / n)
        );
    }
    // draw each R
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
    var x = c.width / 2, y = c.height / 2;
    // encircle
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
    // polygon
    draw_regular_polygon(ctx, 6, x, y, r, Math.PI / 4);
}
