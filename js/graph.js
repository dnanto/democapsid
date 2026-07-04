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

    loopback(src, tar, dir = 0, path = new Set()) {
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
        const tar_to_src = src.subtract(tar); // TODO: generalize
        const cmp = dir ? (a, b) => a < b : (a, b) => a > b;
        const idx = tar_neighbors
            .map((e) => tar_to_src.getDirectedAngle(e.subtract(tar))) // TODO: generalize
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
        return this.loopback(tar, tar_neighbors[idx], dir, path);
    }

    polygonize() {
        const centroids = new Set();
        let paths = [];
        for (const [key, val] of this.edges) {
            let [path, closed] = this.loopback(val[0], val[1]);
            path = path.map(pointify); // TODO: generalize
            if (closed) {
                const centroid = path
                    .centroid()
                    .map((e) => e.toFixed(5))
                    .join(", ");
                if (!centroids.has(centroid) && path.shoelace() > 0) {
                    centroids.add(centroid);
                    paths.push(path);
                }
            }
        }
        return paths;
    }
}
