const COS30 = Math.cos((Math.PI / 180) * 30);
const ft_vec = [
    [0, 0],
    [0, COS30],
    [0.5, COS30],
];

const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
});

function hash_point(point) {
    return `[${formatter.format(point[0])}, ${formatter.format(point[1])}]`;
}

function congruent_polygon_id(path) {
    return [
        path
            .map((e) => new paper.Point(e))
            .cycle()
            .map((e) => e[0].subtract(e[1]).getAngle(e[2].subtract(e[1])))
            .sort((a, b) => a - b)
            .map((e) => formatter.format(e))
            .join(","),
        formatter.format(path.shoelace()),
    ].join("_");
}

function ft_reflect_update(ft_gen, ft_mir, ft_ref) {
    ft_ref.children.slice(0, 3).forEach((e, i) => (e.segments[0].point = ft_gen));
    ft_ref.children[0].segments[1].point.y = ft_gen.y;
    ft_ref.children[1].segments[1].point.x = ft_gen.x;
    ft_ref.children[2].segments[1].point = ft_mir.children[2].getNearestPoint(ft_gen);
}

function p2a(point) {
    return [point.x, point.y];
}

function l2v(child) {
    return child.segments[1].point.subtract(child.segments[0].point);
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
    const grid = Array.from(tile_grid(ck, basis)).slice(1, -1);

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

    const pieces = new Graph((hasher = (e) => `[${formatter.format(e.x)}, ${formatter.format(e.y)}]`))
        .add_edges(lattice.children.flatMap((e) => e.children).map((e) => [e.segments[0].point, e.segments[1].point]))
        .polygonize()
        .sort((a, b) => b.shoelace() - a.shoelace())
        .map((e) =>
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
            }).reduce(),
        );
    const keys = [...new Set(pieces.map((e) => e.data.key))];
    const vals = chroma.scale("viridis").colors(keys.length).reverse();
    const colors = new Map(keys.map((e, i) => [e, vals[i]]));
    // console.log(Array.from(colors.keys()).join("\n"));
    pieces.forEach((e) => (e.fillColor = colors.get(e.data.key)));
    console.log(colors);
    // lattice.remove();
    lattice.bringToFront();
    tile.remove();
}

function ft_input(papers) {
    papers[0].activate();

    const scale = 300;
    const ctr = papers[0].view.center;
    const ft_mir = new paper.Group({
        children: ft_vec.cycle().map((e) => new paper.Path.Line({ from: e[1], to: e[2] })),
        position: ctr,
        strokeWidth: 8,
        strokeColor: "black",
        strokeCap: "round",
        strokeJoin: "round",
        closed: true,
    }).scale(scale);
    const ft_gen = new paper.Path.Circle({
        position: ft_mir.children
            .map((e) => e.segments[0].point)
            .reduce((a, b) => a.add(b))
            .divide(3),
        radius: 8,
        fillColor: "blue",
    });
    const ft_ref = new paper.Group({
        children: ft_mir.children.map((e) => new paper.Path.Line({ from: ft_gen.position, to: e.getNearestPoint(ft_gen.position) })),
        strokeWidth: 8,
        strokeColor: "black",
        strokeCap: "round",
        strokeJoin: "round",
    });

    update = function (event) {
        ft_reflect_update(ft_gen.position, ft_mir, ft_ref);
        const [width, height, topleft] = [ft_mir.bounds.width, ft_mir.bounds.height, ft_mir.bounds.topLeft];
        const g = ft_gen.position;
        const p = [((g.x - topleft.x) / width) * 0.5, ((g.y - topleft.y) / height) * COS30];
        const x = [[0, p[1]], [p[0], COS30], p.proj(ft_vec[2])];
        const k = [
            [
                [ft_vec[0], x[0]],
                [x[0], ft_vec[1]],
            ],
            [
                [ft_vec[1], x[1]],
                [x[1], ft_vec[2]],
            ],
            [
                [ft_vec[2], x[2]],
                [x[2], ft_vec[0]],
            ],
        ];
        const edges = [
            //
            ...x.filter((_, i) => ft_ref.children[i].data.selected).map((e) => [p, e]),
            ...k.filter((_, i) => ft_mir.children[i].data.selected).flat(),
        ].filter((e) => e[1].sub(e[0]).norm() > Number.EPSILON);
        console.log(edges);

        papers[1].activate();
        papers[1].project.clear();
        const vals = chroma.scale("viridis").colors(edges.length);
        const ft = new paper.Group([
            //
            ...edges
                .map(
                    (e, i) =>
                        new paper.Path.Line({
                            //
                            from: e[0],
                            to: e[1],
                            strokeColor: vals[i],
                            strokeWidth: i * 2 + 4,
                            strokeCap: "round",
                            strokeJoin: "round",
                        }),
                )
                .sort((a, b) => b.strokeWidth - a.strokeWidth),
        ]);
        ft.clone().translate(ctr).scale(300);

        calc_tile(papers[2], ft, ft_mir.bounds.width / SQRT3);
        ft.remove();
    };

    [...ft_mir.children, ...ft_ref.children].forEach((e) => {
        e.data.selected = true;
        e.onClick = function (event) {
            this.data.selected = !this.data.selected;
            this.strokeColor = this.data.selected ? "black" : "red";
            update(event);
        };
    });
    ft_gen.onMouseDrag = function (event) {
        const nodes = ft_mir.children.map((e) => [e.segments[0].point.x, e.segments[0].point.y]);
        const t = new paper.Path({ segments: nodes, closed: true, insert: false });
        ft_gen.position = t.contains(event.point) ? event.point : t.getNearestPoint(event.point);
        update(event);
    };
    update(ft_gen.position);
    ft_mir.bringToFront();
    ft_gen.bringToFront();
}
