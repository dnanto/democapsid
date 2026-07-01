class Graph {
    constructor(hasher = (e) => e) {
        this.nodes = new Map();
        this.edges = new Map();
        this.neigh = new Map();
        this.hasher = hasher;
    }

    add_node(key, val) {
        this.nodes.set(key, val);
        this.neigh.getOrInsert(key, []);
        return this;
    }

    edgeify(src, tar) {
        const edge = [src, tar];
        const keys = edge.map((e) => this.hasher(e));
        return keys[0] < keys[1] ? [keys, edge] : [keys, edge].map((e) => e.toReversed());
    }

    add_edge(node1, node2) {
        const [keys, edge] = this.edgeify(node1, node2);
        [0, 1].forEach((i) => {
            this.add_node(keys[i], edge[i]);
            this.neigh.getOrInsert(keys[i]).push(keys[(i + 1) % 2]);
        });
        this.edges.set(keys.join("-"), edge);
        return this;
    }

    add_edges(edges) {
        edges.forEach((e) => this.add_edge(e[0], e[1]));
        return this;
    }

    has_edge(node1, node2) {
        return this.edges.get(this.sort_edge(node1, node2)[1].join("-"));
    }

    neighbors(key) {
        return this.neigh.get(key) ?? [];
    }

    polygonize(src, tar, dir = 0, path = new Set()) {
        // check cycle
        const [src_key, tar_key] = [src, tar].map((e) => this.hasher(e));
        if (path.has(src_key)) {
            return [
                //
                Array.from(path).map((e) => this.nodes.get(e)),
                path.values().next().value == src_key,
            ];
        }
        // build path
        path.add(src_key);
        // check source node only has no neighbors or is a sink
        if (this.neighbors(src_key).length <= 1) {
            return [Array.from(path).map((e) => this.nodes.get(e)), false];
        }
        // get neighbors
        // exclude source node
        // exclude those with exactly one neighbor
        const tar_neighbors = this.neighbors(tar_key)
            .filter((e) => e !== src_key)
            .filter((e) => this.neighbors(e).length > 1)
            .map((e) => this.nodes.get(e));
        // check if neighbors exist
        if (!tar_neighbors.length) {
            return [Array.from(path).map((e) => this.nodes.get(e)), false];
        }
        // get next node with minumum angle: src - tar - next
        const tar_to_src = src.subtract(tar);
        const cmp = dir ? (a, b) => a < b : (a, b) => a > b;
        const idx = tar_neighbors
            .map((e) => tar_to_src.getDirectedAngle(e.subtract(tar)))
            .reduce((acc, val, idx, arr) => {
                /****/ if (cmp(arr[acc], 0) && cmp(0, val)) {
                    return idx;
                } else if (cmp(val, 0) && cmp(0, arr[acc])) {
                    return acc;
                } else {
                    return cmp(arr[acc], val) ? acc : idx;
                }
            }, 0);
        // recurse
        return this.polygonize(tar, tar_neighbors[idx], dir, path);
    }
}

function hash_point(point, digits = 5) {
    return `[${point.x.toFixed(digits)}, ${point.y.toFixed(digits)}]`;
}

const COS30 = Math.cos((Math.PI / 180) * 30);
const v = [
    [0, 0],
    [0, COS30],
    [0.5, COS30],
];

async function draw(paper, s, R = 50) {
    paper.activate();
    paper.project.clear();

    const r = R * (Math.sqrt(3) / 2);
    const g = new paper.Group(s.map((e) => new paper.Path.Line(e[0], e[1])));
    const g1 = new paper.Group({
        children: [...[0, 1, 2, 3, 4, 5].map((e) => g.clone().rotate(e * 60, [0, 0]))],
    });
    const g2 = new paper.Group({
        children: [...[0, 1, 2, 3, 4, 5].map((e) => g.clone().rotate(e * 60, [0, 0]))],
    }).scale(1, -1);
    const g3 = new paper.Group({
        children: [...g1.children, ...g2.children].flatMap((e) => e.children),
        position: paper.view.center,
        strokeColor: "black",
    })
        .scale(R)
        .rotate(30);
    // return;
    const basis = [
        [2 * r, 0],
        [r, SQRT3 * r],
    ];
    const ck = ck_vectors(basis, 1, 0, 0, 0, "levo");
    const grid = Array.from(tile_grid(ck, basis));
    const lattice = new paper.Group({
        children: grid.map((e) => {
            const x = g3.clone();
            x.position = e.coor;
            return x;
        }),
        position: paper.view.center,
    });
    [g, g1, g2, g3].forEach((e) => e.remove());

    const G = new Graph((hasher = hash_point)).add_edges(lattice.children.flatMap((e) => e.children).map((e) => [e.segments[0].point, e.segments[1].point]));
    const edges = new Map(G.edges);
    let last = -1;
    while (edges.size > 0) {
        let [key, val] = edges.entries().next().value;
        // new paper.Group({
        //     children: [new paper.Path.Circle({ center: val[0], radius: 6, fillColor: "green" }), new paper.Path.Circle({ center: val[1], radius: 6, fillColor: "red" })],
        // });
        // await new Promise((r) => setTimeout(r, 2000));
        let path = G.polygonize(val[0], val[1]);
        if (path[0].length > 1) {
            path[0].map((e, i, a) => G.edgeify(e, a[(i + 1) % a.length])[0].join("-")).map((e) => [e, edges.delete(e)]);
        } else {
            edges.delete(key);
        }
        if (edges.size === last) {
            console.log("what", last);
            return;
        } else {
            last = edges.size;
        }
        if (path[1]) {
            new paper.Path({
                //
                segments: path[0],
                strokeWidth: 2,
                strokeCap: "round",
                strokeJoin: "round",
                strokeColor: path[1] ? "blue" : "orange",
                closed: path[1],
            });
            // await new Promise((r) => setTimeout(r, 2000));
        }
    }
    console.log(edges.size);
}

function pointify(o) {
    return [o.x, o.y];
}

function path_coors(path) {
    return path.segments.map((e) => [e.point._x, e.point._y]);
}

function path_centroid(path) {
    return path_coors(path).centroid();
}

function schwartz_triangle_control(paper1, paper2, scale = 300) {
    paper1.activate();

    const pg = [0.175, COS30 / 1.25];
    const h = new paper1.Path.Line({ from: v[2], to: v[0], strokeColor: "black" });

    const tri_lines = [
        [pg, [v[0][0], pg[1]]], // <-
        [pg, [pg[0], v[1][1]]], // v
        [pg, h.getNearestPoint(pg)], // /
        [v[0], v[1]], // |
        [v[1], v[2]], // _
        [v[2], v[0]], // \
    ].map(
        (e) =>
            new paper1.Path.Line({
                //
                from: e[0],
                to: e[1],
                strokeWidth: 6,
                strokeColor: "black",
                strokeCap: "round",
                strokeJoin: "round",
                data: { selected: true },
            }),
    );
    tri_lines[0].data.selected = false;
    tri_lines[1].data.selected = false;
    tri_lines[0].strokeColor = "red";
    tri_lines[1].strokeColor = "red";

    const cg = new paper1.Path.Circle({
        //
        center: pg,
        radius: 0.025,
        fillColor: "blue",
        data: { selected: true },
    });
    const tri = new paper1.Group({
        children: [...tri_lines, cg],
        position: paper1.view.center,
        closed: true,
    }).scale(scale);

    // events
    update = function (position) {
        const [width, height, topleft] = [...[0.5, COS30].mul(scale), tri_lines[3].segments[0].point];
        const [sx, sy] = [(position.x - topleft._x) / (0.5 * scale), (position.y - topleft._y) / (COS30 * scale)];
        const p = [sx * 0.5, sy * COS30];
        const x = [[0, p[1]], [p[0], COS30], pointify(h.getNearestPoint(p))];
        draw(
            paper2,
            [
                ...tri_lines.slice(0, 3).map((e, i) => (e.data.selected ? [p, x[i]] : [])),
                ...tri_lines.slice(3, 6).flatMap((e, i) => {
                    if (e.data.selected) {
                        if (tri_lines[i].data.selected) {
                            return [
                                [v[i], x[i]],
                                [x[i], v[(i + 1) % 3]],
                            ];
                        } else {
                            return [[v[i], v[(i + 1) % 3]]];
                        }
                    } else {
                        return [];
                    }
                }),
            ].filter((e) => e.length),
        );
    };
    tri_lines.forEach((e) => {
        e.onClick = function (event) {
            this.data.selected = !this.data.selected;
            this.strokeColor = this.data.selected ? "black" : "red";
            update(cg.position);
        };
    });
    cg.onMouseDrag = function (event) {
        this.position = event.point;
        tri_lines.slice(0, 3).forEach((e, i) => (e.segments[0].point = event.point));
        tri_lines[0].segments[1].point.y = event.point.y;
        tri_lines[1].segments[1].point.x = event.point.x;
        tri_lines[2].segments[1].point = tri_lines[5].getNearestPoint(event.point);
        update(event.point);
    };

    update(cg.position);
}

window.onload = function (opt) {
    const paper1 = new paper.PaperScope();
    const canvas1 = document.getElementById("view1");
    paper1.setup(canvas1);
    // control(scope1);

    const paper2 = new paper.PaperScope();
    const canvas2 = document.getElementById("view2");
    paper2.setup(canvas2);
    // draw(scope2);

    schwartz_triangle_control(paper1, paper2);
};
