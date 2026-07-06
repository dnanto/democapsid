const COS30 = Math.cos((Math.PI / 180) * 30);
const ft_vectors = [
    [0, 0],
    [0, COS30],
    [0.5, COS30],
];

function hash_point(point, digits = 5) {
    return `[${point.x.toFixed(digits)}, ${point.y.toFixed(digits)}]`;
}

function pointify(o) {
    return [o.x, o.y];
}

function congruent_polygon_id(path, digits = 5) {
    return [
        path
            .map((e) => new paper.Point(e))
            .cycle()
            .map((e) => e[0].subtract(e[1]).getAngle(e[2].subtract(e[1])))
            .sort((a, b) => a - b)
            .filter((e) => Math.abs(e - 180) > 0.0001)
            .map((e) => e.toFixed(5))
            .join(","),
        path.shoelace().toFixed(5),
    ].join("_");
}

function calc_tile(paper, ft, R = 1) {
    paper.activate();
    paper.project.clear();

    const r = (R * SQRT3) / 2;
    const basis = [
        [2 * r, 0],
        [r, SQRT3 * r],
    ];
    const ck = ck_vectors(basis, 1, 0, 1, 0);
    const grid = Array.from(tile_grid(ck, basis));

    // calculate the tile based on the fundamental triangle
    const tile = new paper.Group({
        children: [
            // rotate fundamental triangle within hexagon
            ...Array.from({ length: 6 }, (_, i) => ft.clone().rotate(i * 60, [0, 0])),
            // rotate fundamental triangle within hexagon, then flip
            ...new paper.Group(Array.from({ length: 6 }, (_, i) => ft.clone().rotate(i * 60, [0, 0]))).scale(1, -1).children,
        ].flatMap((e) => e.children),
    })
        .scale(R)
        .rotate(30);

    // const lattice_tile = new paper.Group(polygons);
    const lattice = new paper.Group({
        children: grid.map((e) => {
            const x = tile.clone();
            x.position = e.coor;
            return x;
        }),
        strokeCap: "round",
        strokeJoin: "round",
        strokeColor: "black",
        strokeWidth: 4,
        position: paper.view.center,
    });

    const pieces = new Graph((hasher = hash_point))
        .add_edges(lattice.children.flatMap((e) => e.children).map((e) => [e.segments[0].point, e.segments[1].point]))
        .polygonize()
        .sort((a, b) => b.shoelace() - a.shoelace())
        .map(
            (e) =>
                new paper.Path({
                    segments: e,
                    strokeWidth: 4,
                    strokeCap: "round",
                    strokeJoin: "round",
                    strokeColor: "black",
                    closed: true,
                    data: {
                        key: congruent_polygon_id(e, 5),
                    },
                }),
        );
    const keys = [...new Set(pieces.map((e) => e.data.key))];
    const vals = chroma.scale("viridis").colors(keys.length).reverse();
    const colors = new Map(keys.map((e, i) => [e, vals[i]]));
    console.log(Array.from(colors.keys()).join("\n"));
    pieces.forEach((e) => (e.fillColor = colors.get(e.data.key)));

    // lattice.remove();
    lattice.bringToFront();
    tile.remove();
    // return;
}

function is_collinear(l1, l2) {
    const [v1, v2] = [l1, l2].map((e) => e.segments[1].point.subtract(l1.segments[0].point));
    return v1.isCollinear(v2);
}

function planarize_ft(ft, g) {
    const [width, height, topleft] = [ft.bounds.width, ft.bounds.height, ft.bounds.topLeft];
    const p = [((g.x - topleft.x) / width) * 0.5, ((g.y - topleft.y) / height) * COS30];
    const x = [[0, p[1]], [p[0], COS30], p.proj(ft_vectors[2])];
    return new paper.Group(
        [
            ...ft.children.slice(0, 3).map((e, i) => (e.data.selected ? [p, x[i]] : [])),
            ...ft.children.slice(3, 6).flatMap((e, i) => {
                const j = (i + 1) % 3;
                if (e.data.selected) {
                    if (ft.children[i].data.selected) {
                        return [
                            [ft_vectors[i], x[i]],
                            [x[i], ft_vectors[j]],
                        ];
                    } else {
                        return [[ft_vectors[i], ft_vectors[j]]];
                    }
                } else {
                    return [];
                }
            }),
        ]
            .filter((e) => e.length)
            .map((e) => new paper.Path.Line(e[0], e[1])),
    );
}

function ft_input(paper1, paper2, scale = 300) {
    paper1.activate();

    // const pg = [0.175, COS30 / 1.25];
    const pg = [0, 0];
    const tri_lines = [
        [pg, [ft_vectors[0][0], pg[1]]], // <-
        [pg, [pg[0], ft_vectors[1][1]]], // v
        [pg, pg.proj(ft_vectors[2])], ///// /
        [ft_vectors[0], ft_vectors[1]], /// |
        [ft_vectors[1], ft_vectors[2]], /// _
        [ft_vectors[2], ft_vectors[0]], /// \
    ].map(
        (e) =>
            new paper1.Path.Line({
                from: e[0],
                to: e[1],
                strokeWidth: 6,
                strokeColor: "black",
                strokeCap: "round",
                strokeJoin: "round",
                data: { selected: true },
            }),
    );
    const generator = new paper1.Path.Circle({
        center: pg,
        radius: 0.025,
        fillColor: "blue",
    });
    const ft_group = new paper1.Group({
        children: [...tri_lines, generator],
        position: paper1.view.center,
    }).scale(scale);
    const ft_tri = new paper1.Path({
        segments: [ft_vectors[0], ft_vectors[1], ft_vectors[2]],
        position: paper1.view.center,
        closed: true,
    }).scale(scale);

    // events
    console.log(ft_group);
    ft_group.children.slice(0, -1).forEach((e) => {
        e.onClick = function (event) {
            this.data.selected = !this.data.selected;
            this.strokeColor = this.data.selected ? "black" : "red";
            calc_tile(paper2, planarize_ft(ft_group, generator.position), (R = ft_group.bounds.width / SQRT3));
        };
    });
    ft_group.children.slice(-1)[0].onMouseDrag = function (event) {
        if (ft_tri.contains(event.point)) {
            this.position = event.point;
        } else {
            this.position = ft_tri.getNearestPoint(event.point);
        }

        // ![0, 1, 2].some((_, i) => e.segments[1].point.subtract(e.segments[0].point).isCollinear(ft_vectors[i]));

        tri_lines.slice(0, 3).forEach((e, i) => (e.segments[0].point = this.position));
        tri_lines[0].segments[1].point.y = this.position.y;
        tri_lines[1].segments[1].point.x = this.position.x;
        tri_lines[2].segments[1].point = tri_lines[5].getNearestPoint(this.position);
        calc_tile(paper2, planarize_ft(ft_group, this.position), (R = ft_group.bounds.width / SQRT3));
    };
    calc_tile(paper2, planarize_ft(ft_group, generator.position), (R = ft_group.bounds.width / SQRT3));
}
