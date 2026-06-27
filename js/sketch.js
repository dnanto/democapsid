class Graph {
    constructor(hasher = (e) => e) {
        this.nodes = new Map();
        this.edges = new Map();
        this.hasher = hasher;
    }

    add_node(node) {
        this.nodes.set(this.hasher(node), node);
        return this;
    }

    add_edge(node1, node2) {
        [node1, node2].forEach((e) => {
            this.add_node(e);
        });
        this.neighbors(node1).push(node2);
        this.neighbors(node2).push(node1);
        return this;
    }

    add_edges(edges) {
        edges.forEach((e) => {
            this.add_edge(e[0], e[1]);
        });
        return this;
    }

    has_edge(node1, node2) {
        const target = this.hasher(node2);
        return this.neighbors(node1).find((e) => this.hasher(e) === target) !== undefined;
    }

    neighbors(node) {
        // not the best...
        return this.edges.getOrInsert(this.hasher(node), []);
    }

    dfs(src, tar, dir = 0, path = new Set()) {
        // check cycle
        const src_key = this.hasher(src);
        if (path.has(src_key)) {
            return [Array.from(path).map((e) => this.nodes.get(e)), true];
        }
        // build path
        path.add(src_key);
        // get neighbors, excluding source node
        const tar_neighbors = this.neighbors(tar).filter((e) => this.hasher(e) !== this.hasher(src));
        if (!tar_neighbors.length) {
            return [Array.from(path).map((e) => this.nodes.get(e)), false];
        }
        // get next node with minumum angle: src - tar - next
        const tar_to_src = src.subtract(tar);
        // console.log(src, tar, tar_to_src);
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
        // console.log(">", src, tar, tar_neighbors, tar_neighbors[idx]);
        return this.dfs(tar, tar_neighbors[idx], dir, path);
    }
}

function hash_point(point, digits = 5) {
    return `[${point.x.toFixed(digits)}, ${point.y.toFixed(digits)}]`;
}

function draw() {
    const COS30 = Math.cos((Math.PI / 180) * 30);
    const v = [
        //
        new paper.Point(0, 0),
        new paper.Point(0, COS30),
        new paper.Point(0.5, COS30),
    ];
    // const pg = new paper.Point(0.175, COS30 / 1.25);
    const pg = new paper.Point(0, 0);
    const w = [
        //
        new paper.Path.Line({ from: v[0], to: v[1], strokeColor: "black" }),
        new paper.Path.Line({ from: v[1], to: v[2], strokeColor: "black" }),
        new paper.Path.Line({ from: v[2], to: v[0], strokeColor: "black" }),
    ];
    const m = w.map((e) => new paper.Path.Line({ from: pg, to: e.getNearestPoint(pg), strokeColor: "blue" }));
    const xw = w.map((e) => e.segments[0].point);
    const xm = m.map((e) => e.segments[1].point);
    const s = [
        // [xw[0], xm[0]],
        // [xm[0], xw[1]],
        // [xw[1], xm[1]],
        // [xm[1], xw[2]],
        // [xw[2], xm[2]],
        // [xm[2], xw[0]],
        // [pg, xm[0]],
        // [pg, xm[1]],
        // [pg, xm[2]],
        [xw[0], xw[1]],
        // [xw[1], xw[2]],
        // [xw[2], xw[0]],
    ];

    const R = 75;
    const r = R * (Math.sqrt(3) / 2);
    const g = new paper.Group(s.map((e) => new paper.Path.Line(e[0], e[1])));
    const g1 = new paper.Group({
        children: [...[0, 1, 2, 3, 4, 5].map((e) => g.clone().rotate(e * 60, v[0]))],
    });
    const g2 = new paper.Group({
        children: [...[0, 1, 2, 3, 4, 5].map((e) => g.clone().rotate(e * 60, v[0]))],
    }).scale(1, -1);
    const g3 = new paper.Group({
        children: [...g1.children, ...g2.children].flatMap((e) => e.children),
        position: paper.view.center,
        strokeColor: "black",
    })
        .scale(R)
        .rotate(30);

    const basis = [
        [2 * r, 0],
        [r, SQRT3 * r],
    ];
    const ck = ck_vectors(basis, 2, 1, 2, 1, "levo");
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
    // console.log(lattice.children.flatMap((e) => e.children).map((e) => [e.segments[0].point, e.segments[1].point]));

    const G = new Graph((hasher = hash_point)).add_edges(lattice.children.flatMap((e) => e.children).map((e) => [e.segments[0].point, e.segments[1].point]));

    const nodes = Array.from(G.nodes.values());
    const src = nodes[Math.floor(Math.random() * nodes.length)];
    const neighbors = Array.from(G.neighbors(src));
    const tar = neighbors[Math.floor(Math.random() * neighbors.length)];
    const paths = [0, 1]
        .map((e) => {
            console.log();
            return G.dfs(src, tar, e);
        })
        .filter((e) => e[1]);
    console.log(">>", paths);

    let path;
    /****/ if (paths.length === 0) {
        path = [];
    } else if (paths.length === 1) {
        path = paths[0][0];
    } else if (paths.length === 2) {
        path = paths[0][0].length < paths[1][0].length ? paths[0][0] : paths[1][0];
    }
    console.log(path);
    const p = new paper.Group({
        children: [
            new paper.Path.Circle({ center: src, radius: 2, fillColor: "green" }),
            new paper.Path.Circle({ center: tar, radius: 2, fillColor: "red" }),
            new paper.Path({ segments: path, strokeColor: "blue", strokeWidth: 2, closed: true }),
        ],
    });
}

window.onload = function (opt) {
    paper.setup("view");
    draw();
};
