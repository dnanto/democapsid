const lattice = new paper.Group({
    children: grid.map((e) => {
        const x = g3.clone();
        x.position = e.coor;
        return x;
    }),
    position: paper.view.center,
});

const ctr = [paper.view.center.x, paper.view.center.y];
const triangles = [
    [3, 0],
    [0, 1],
    [1, 2],
]
    // .map((e) => [ck[e[0]], ck[e[1]]])
    .map((e) => [ck[e[0]], ck[e[1]]].map((e) => e.add(ctr)))
    .map((e) => new paper.Path({ segments: [ctr, ...e], data: { vectors: [ctr, ...e] } }));
const facets = triangles.map(
    (e) =>
        new paper.Group(
            paths
                .map((f) => {
                    const x = f.intersect(e);
                    x.data.centroid = x.segments.map((e) => pointify(e.point)).centroid();
                    return x;
                })
                .filter((e) => e.segments.length),
        ),
);
facets.strokeColor = "black";
// facets.position = paper.view.center;
paths.forEach((e) => e.remove());
lattice.remove();

// coordinates
const PARAMS = { a: 5, s: 0, θ: 0, ψ: 0, φ: 0 };
const ico_cfg = ico_config(PARAMS.a);
const ico_coors = ["", "", ico_axis_2, ico_axis_3, "", ico_axis_5][PARAMS.a](ck, ITER, TOL);

// transform
const th = (2 * Math.PI) / PARAMS.a;
const is_equilateral = h == H && k == K;
const inflater = is_equilateral ? (e) => spherize(e, ico_coors[0].norm(), PARAMS.s) : (e) => cylinderize(e, ico_coors, PARAMS.a, PARAMS.s);
const CAMERA = camera(...[PARAMS.θ, PARAMS.ψ, PARAMS.φ].map(radians));
let results = [];
for (let idx = 0, id = 0; idx < ico_cfg.t_idx.length; idx++) {
    const facet = facets[ico_cfg.t_idx[idx] - 1];
    const trr = triangles[ico_cfg.t_idx[idx] - 1];
    const A = inv3(T(trr.data.vectors.map((e) => e.concat(1))));
    const V = [0, 1, 2].map((e) => ico_coors[ico_cfg.v_idx[idx][e]]);
    for (let i = 0; i < ico_cfg.t_rep[idx]; i++, id++) {
        const X = V.map((e) => e.roro([0, 0, 1], i * th));
        const M = mmul(T(X), A);
        const xfacet = facet.children.map((e) => {
            const segments = e.segments
                .map((f) => [f.point.x, f.point.y, 1])
                .map((f) => mmul(M, f.T()).flat()) // map to face of icosahedron
                .map((e) => inflater(e)) // spherize
                .map((e) => mmul(CAMERA, e.concat(1).T()).flat()); // camera projection
            const centroid = mmul(
                CAMERA,
                inflater(mmul(M, [e.data.centroid.x, e.data.centroid.y, 1].T()).flat())
                    .concat(1)
                    .T(),
            ).flat();
            return new paper.Path({
                segments: segments.map((f) => f.slice(0, 2)),
                closed: e.closed,
                data: Object.assign({}, e.data, {
                    id: id,
                    centroid: centroid,
                    segments_3D: segments,
                    normal: segments[1].sub(segments[0]).cross(segments[2].sub(segments[0])).uvec(),
                }),
                style: e.style,
            });
        });
        results = results.concat(new paper.Group({ children: xfacet, data: { type: "facet", centroid: mmul(CAMERA, inflater(X.centroid()).concat(1).T()).flat() } }));
    }
}
facets.forEach((e) => e.remove());
new paper.Group({ children: results, position: paper.view.center });
