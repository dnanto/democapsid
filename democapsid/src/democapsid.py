#!/usr/bin/env python3

import sys
from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser
from itertools import chain

import numpy as np

try:
    import bpy
except ImportError:
    pass


SQRT2 = np.sqrt(2)
SQRT3 = np.sqrt(3)
SQRT5 = np.sqrt(5)
PHI = (1 + SQRT5) / 2

ICO_CONFIG = (
    (),
    (),
    (
        (1, 1, 1, 1, 2, 2, 2, 2, 3, 3),
        (2, 2, 2, 2, 2, 2, 2, 2, 2, 2),
        ("T1-▔", "T1-▔", "T1▁", "T1▁", "T2-▼", "T2-▲", "T2-▼", "T2-▲", "T3-▼", "T3-▲"),
        [(0, 2, 1), (2, 4, 1), (9, 6, 10), (9, 10, 11), (0, 6, 2), (9, 2, 6), (2, 9, 4), (11, 4, 9), (0, 5, 6), (10, 6, 5)]
    ),
    (
        (1, 1, 1, 1, 2, 2, 3, 3),
        [1, 3, 3, 1, 3, 3, 3, 3],
        ("T1-▔", "T1-▲", "T1-▼", "T1-▁", "T2-▼", "T2-▲", "T3-▼", "T3-▲"),
        [(0, 1, 2), (1, 3, 2), (6, 11, 9), (9, 11, 10), (1, 6, 3), (9, 3, 6), (1, 5, 6), (11, 6, 5)]
    ),   
    (), 
    (
        (1, 1, 2, 2),
        (5, 5, 5, 5),
        ("T1-▲", "T1-▼", "T2-▲", "T2-▼"),
        [(0, 2, 1), (6, 7, 11), (2, 6, 1), (6, 2, 7)]
    )
)


def calc_hexagon(R, t=0):
    r = R * (SQRT3 / 2)
    points = (
        (0, 1), 
        (r, 0.5), 
        (r, -0.5), 
        (0, -1), 
        (-r, -0.5), 
        (-r, 0.5)
    )
    rmat_t = rmat(t)
    return [rmat_t @ ele for ele in points], r


def calc_square(R, t=0):
    r = R / SQRT2
    points = (
        (0, R),
        (R, 0),
        (0, -R),
        (-R, 0),
    )
    rmat_t = rmat(t)
    return [rmat_t @ ele for ele in points], r
    

def calc_triangle(R, t=0):
    r = R / 2
    a = SQRT3 * R
    points = (
        (0, R),
        (a / 2, -r),
        (-a / 2, -r)
    )
    rmat_t = rmat(t)
    return [rmat_t @ ele for ele in points], r


def calc_lattice(t, R6):
    if t == "hex":
        hex, r6 = calc_hexagon(R6)
        basis = np.array([[2 * r6, 0], [r6, r6 * SQRT3]])
        tiler = [lambda coor: hex + coor]
    elif t == "trihex": 
        hex, _ = calc_hexagon(R6, np.pi / 6)
        basis = np.array([[2 * R6, 0], [R6, R6 * SQRT3]])
        tiler = [lambda coor: hex + coor]
    elif t == "snubhex":
        hex, r6 = calc_hexagon(R6, np.pi / 6)
        tri1, r3 = calc_triangle(R3 := 2 / 3 * r6)
        tri2, r3 = calc_triangle(R3, np.pi / 3)
        basis = np.array([[2.5 * R6, R6 * SQRT3 / 2], [0.5 * R6, 3 * R6 * SQRT3 / 2]])
        tiler = [
            lambda coor: hex + coor,
            lambda coor: tri2 + coor + [0, -(r6 + r3)],
            lambda coor: tri1 + coor + [R6, -(r6 - r3)],
            lambda coor: tri2 + coor + [R6, r6 - r3],
            lambda coor: tri1 + coor + [0, r6 + r3],
            lambda coor: tri1 + coor + [R6, r6 + r3],
            lambda coor: tri1 + coor + [1.5 * R6, r3]
        ]
    elif t == "rhombitrihex":
        hex, r6 = calc_hexagon(R6, np.pi / 6)
        sqr1, r4 = calc_square(np.sqrt(2 * R6 * R6) / 2, np.pi / 4)
        sqr1 = [ele + [0, r4 + r6] for ele in sqr1]
        sqr2 = [rmat(np.pi / 3) @ ele for ele in sqr1]
        sqr3 = [rmat(2 * np.pi / 3) @ ele for ele in sqr1]
        basis = np.array([
            [R6 + r6 + 0.5 * R6, 0.5 * R6 + r6],
            [0, 2 * r6 + R6]
        ])
        tiler = [
            lambda coor: hex + coor,
            lambda coor: sqr1 + coor,
            lambda coor: sqr2 + coor,
            lambda coor: sqr3 + coor,
        ]
    elif t == "dualhex":
        #                 center: e.coor.add([0, r - (R * SQRT3) / 6]),
        r6 = R6 * (SQRT3 / 2)
        basis = np.array([
            [(3 / 2) * R6, r6],
            [0, 2 * r6],
        ])
        tri1, r3 = calc_triangle(R3 := R6 / SQRT3)
        tri1 = [ele + [0, -(r6 - r3)] for ele in tri1]
        tri2 = [rmat(np.pi / 3) @ ele for ele in tri1]
        tri3 = [rmat(2 * np.pi / 3) @ ele for ele in tri1]
        tri4 = [rmat(3 * np.pi / 3) @ ele for ele in tri1]
        tri5 = [rmat(4 * np.pi / 3) @ ele for ele in tri1]
        tri6 = [rmat(5 * np.pi / 3) @ ele for ele in tri1]
        tiler = [
            lambda coor: tri1 + coor,
            lambda coor: tri2 + coor,
            lambda coor: tri3 + coor,
            lambda coor: tri4 + coor,
            lambda coor: tri5 + coor,
            lambda coor: tri6 + coor,
        ]
    elif t == "dualtrihex":
        r6 = R6 * (SQRT3 / 2)
        rot = rmat(np.pi / 3)
        sin, cos = np.sin(np.pi / 6), np.cos(np.pi / 3)
        rmb1 = np.array([
            [0, 0],
            [0.5 * r6, -(0.25 * R6 * sin) / cos],
            [r6, 0],
            [0.5 * r6, (0.25 * R6 * sin) / cos]
        ])
        rmb2 = [
            [-0.5 * r6, 0.5 * R6 + (0.25 * R6 * sin) / cos],
            [0, 0.5 * R6],
            [r6 - 0.5 * r6, 0.5 * R6 + (0.25 * R6 * sin) / cos],
            [0, 0.5 * R6 + (2 * (0.25 * R6 * sin)) / cos]
        ]
        rmbs1 = [[rmat(i * np.pi / 3) @ ele for ele in rmb1] for i in range(6)]
        rmbs2 = [[rmat(i * np.pi / 3) @ ele for ele in rmb2] for i in range(6)]
        basis = np.array([
            [2 * r6, 0],
            [r6, SQRT3 * r6],
        ])
        tiler = [
            *((lambda coor, rmb=rmb: rmb + coor) for rmb in rmbs1),
            *((lambda coor, rmb=rmb: rmb + coor) for rmb in rmbs2),
        ]
    else:
        raise ValueError("invalid tile mode!")
    return (basis, tiler)


def iter_ring(elements):
    yield from ((elements[i], elements[(i + 1) % len(elements)]) for i in range(len(elements))) if len(elements) > 1 else ()


def proj(p, q):
    return (np.dot(p, q) / np.dot(q, q)) * q


def angle(p, q):
    return np.arccos(np.dot(p, q) / (np.linalg.norm(p) * np.linalg.norm(q)))


def uvec(v):
    return v / np.linalg.norm(v)


def rmat(t):
    cos, sin = np.cos(t), np.sin(t)
    return np.array([[cos, sin], [-sin, cos]])


def roro(v, k=np.array([0, 0, 1]), t=0):
    # https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
    return v * np.cos(t) + np.cross(k, v) * np.sin(t) + k * np.dot(k, v) * (1 - np.cos(t))


def on_same_line(a, b, c, d):
    return np.isclose(np.linalg.norm(np.cross(b - a, c - a)), 0) and np.isclose(np.linalg.norm(np.cross(b - a, d - a)), 0)


def triangle_area(p, q, r):
    # Weisstein, Eric W. "Triangle Area." From MathWorld--A Wolfram Web Resource.
    # https://mathworld.wolfram.com/TriangleArea.html
    return 0.5 * np.abs(np.cross(p - q, p - r))


def in_triangle(p, q1, q2, q3):
    return np.isclose(
        triangle_area(q1, q2, q3),
        sum(triangle_area(p, *ele) for ele in iter_ring((q1, q2, q3)))
    )


def intersection(p1, q1, p2, q2):
    # http://paulbourke.net/geometry/pointlineplane/edge_intersection.py

    x1, y1, x2, y2, x3, y3, x4, y4 = *p1, *q1, *p2, *q2

    d = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    if np.isclose(d, 0):
        return np.array([])

    ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / d
    if ua < 0 or ua > 1:
        return np.array([])

    ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / d
    if ub < 0 or ub > 1:
        return np.array([])

    return np.array([x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)])


def brackets(f, a, b, iter):
    frac = b / iter
    prev = np.sign(f(a))
    for i in range(iter):
        x = a + i * frac
        curr = np.sign(f(x))
        if prev != curr:
            yield a + (i - 1) * frac, x
            prev = curr


def bisection(f, a, b, tol, iter):
    for i in range(iter):
        c = (a + b) / 2
        f_of_c = f(c)
        if f_of_c == 0 or (b - a) / 2 < tol:
            break
        if np.sign(f_of_c) == np.sign(f(a)):
            a = c
        else:
            b = c
    return i, f_of_c, c


def triangle_circumcircle_center(p, q, r):
    # https://en.wikipedia.org/wiki/Circumcircle#Higher_dimensions
    a, b = p - r, q - r
    return np.cross(np.dot(np.linalg.norm(a) ** 2, b) - np.dot(np.linalg.norm(b) ** 2, a), np.cross(a, b)) / (2 * np.linalg.norm(np.cross(a, b)) ** 2) + r


def tetrahedron_circumsphere_center(v0, v1, v2, v3):
    # https://rodolphe-vaillant.fr/entry/127/find-a-tetrahedron-circumcenter 
    e1, e2, e3 = v1 - v0, v2 - v0, v3 - v0
    return v0 + (1 / (2 * np.linalg.det(np.stack((e1, e2, e3))))) * (np.linalg.norm(e3) ** 2 * np.cross(e1, e2) + np.linalg.norm(e2) ** 2 * np.cross(e3, e1) + np.linalg.norm(e1) ** 2 * np.cross(e2, e3))


def sd_sphere(p, s):
    return np.linalg.norm(p) - s


def zproj(coor):
    return np.array([0, 0, coor[2]])


def ico_coors_2(ckv, iter=100, tol=1E-15):
    a, b, c = np.linalg.norm(ckv[0]), np.linalg.norm(ckv[1]), np.linalg.norm(ckv[2] - ckv[1])

    pA = np.array([a / 2, 0, 0])
    pB = np.array([-(a / 2), 0, 0])
    pC = np.array([0, -((a * PHI) / 2), -(((a * PHI) - a) / 2)])
    pD = np.array([0, ((a * PHI) / 2), -(((a * PHI) - a) / 2)])

    def fold(t):
        p = (pB + pC) / 2
        v, k = p - pA, uvec(pC - pB)
        pE = p + roro(v, k, t)
        pF = roro(pE, np.array([0, 0, 1]), np.pi)

        t = angle(ckv[0], ckv[1])
        v, k = b * uvec(pC - pA), uvec(np.cross(pC, pA))
        o = roro(v, k, t)
        p, q = pA + proj(o, v), pA + o
        v, k = q - p, uvec(pA - pC)
        f = lambda t: c - np.linalg.norm((p + roro(v, k, t)) - pF)
        t = next(bisection(f, a, b, tol=tol, iter=iter)[2] for a, b in brackets(f, 0, 2 * np.pi, iter))
        pG = p + roro(v, k, t)
        
        return pE, pF, pG, np.linalg.norm(pE - np.array([0, 0, pE[2]])) - np.linalg.norm(pG - np.array([0, 0, pG[2]]))

    ## find a good starting point
    for t in np.arange(0, np.pi / 2, np.pi / 180 / 10):
        try:
            fold(t)
            break
        except StopIteration:
            pass
    obj = lambda t: fold(t)[-1]
    t = next(bisection(obj, a, b, tol=tol, iter=iter)[2] for a, b in brackets(obj, t, np.pi / 4, iter))
    pE, pF, pG, _ = fold(t)

    def obj(t):
        pK = roro(pA, np.array([0, 0, 1]), t) + np.array([0, 0, pG[2] + pE[2]])
        return np.linalg.norm(pK - pF) - b
    t = next(bisection(obj, a, b, tol=tol, iter=iter)[2] for a, b in brackets(obj, 0, 2 * np.pi, iter))
    pK = roro(pA, np.array([0, 0, 1]), t) + np.array([0, 0, pG[2] + pE[2]])
    pI = pD[1] * roro(uvec(pK - np.array([0, 0, pK[2]])), np.array([0, 0, 1]), np.pi / 2) + np.array([0, 0, pG[2] + pE[2] - pD[2]])

    coor = np.vstack(
        (
            pA, pB, pC, 
            pD, pE, pF,
            pG, roro(pG, np.array([0, 0, 1]), np.pi), pI,
            roro(pI, np.array([0, 0, 1]), np.pi), pK, roro(pK, np.array([0, 0, 1]), np.pi)
        )
    )

    return coor + np.array([0, 0, (coor[0, 2] - coor[-1, 2]) / 2])


def ico_coors_3(ckv, iter=100, tol=1E-15):
    a, b, c = np.linalg.norm(ckv[0]), np.linalg.norm(ckv[1]), np.linalg.norm(ckv[2] - ckv[1])

    pA = np.array([0, a * (1 / SQRT3), 0])
    pB = np.array([a / 2, -(a * (SQRT3 / 6)), 0])
    pC = np.array([-(a / 2), -(a * (SQRT3 / 6)), 0])
    qD = np.array([0, -(a * ((2 * SQRT3) / 3)), 0])
    qF = np.array([a, a / SQRT3, 0])

    def fold(t):
        v = (a * (SQRT3 / 2)) * uvec(qD)
        k = uvec(pB - pC)
        pD = np.array([0, -(a * (SQRT3 / 6)), 0]) + roro(v, k, t)
        pF = roro(pD, np.array([0, 0, 1]), (2 / 3) * np.pi)

        t = angle(ckv[0], ckv[1])
        v, k = b * uvec(pD - pB), uvec(np.cross(pD, pB))
        o = roro(v, k, t)
        p, q = pB + proj(o, v), pB + o
        v, k = q - p, uvec(pB - pD)
        f = lambda t: c - np.linalg.norm((p + roro(v, k, t)) - pF)
        t = next(bisection(f, a, b, tol=tol, iter=iter)[2] for a, b in brackets(f, 0, 2 * np.pi, iter))
        pG = p + roro(v, k, t)

        return pD, pF, pG, np.abs(pD[1]) - np.linalg.norm(pG - np.array([0, 0, pG[2]]))

    ## find a good starting point
    for t in np.arange(0, np.pi / 2, np.pi / 180 / 10):
        try:
            fold(t)
            break
        except StopIteration:
            pass
    obj = lambda t: fold(t)[-1]
    t = next(bisection(obj, a, b, tol=tol, iter=iter)[2] for a, b in brackets(obj, t, np.pi / 4, iter))
    pD, pF, pG, _ = fold(t)

    t = (2 * np.pi) / 3
    k = np.array([0, 0, 1])
    pH = roro(pG, k, -t)
    pJ = pA[1] * uvec(roro(pH - np.array([0, 0, pH[2]]), k, np.pi / 3)) + np.array([0, 0, pH[2] + pD[2] - pA[2]])

    coor = np.vstack(
        (
            pA, pB, pC, 
            pD, roro(pF, k, t), pF,
            pG, pH, roro(pH, k, -t),
            pJ, roro(pJ, k, -t), roro(pJ, k, -2 * t),
        )
    )
    
    return coor + np.array([0, 0, (coor[0, 2] - coor[-1, 2]) / 2])


def ico_coors_5(ckv):
    a, b = np.linalg.norm(ckv[0]), np.linalg.norm(ckv[1])
    
    # regular pentagon circumradius
    R5 = a * np.sqrt(((5 + SQRT5) / 10))
    # regular pentagonal pyramid height
    h5 = ((1 + SQRT5) * a) / (2 * np.sqrt(5 + 2 * SQRT5))

    pA = np.array([0, 0, h5])
    pB = roro(np.array([-R5, 0, 0]), np.array([0, 0, 1]), np.deg2rad(54))
    pC = pB + np.array([a, 0, 0])

    t = angle(ckv[0], ckv[1])
    q = pC + roro(np.array([b, 0, 0]), np.array([0, 1, 0]), -np.pi - t)
    p = pB + proj(q - pB, pC - pB)
    d = np.array([p[0], (-np.abs(p[1]) * np.sqrt(R5 * R5 * p[1] * p[1] - (p[0] * p[1]) ** 2)) / (p[1]* p[1]), 0])

    pG = d + np.array([0, 0, -np.sqrt(q[2] * q[2] - (p[1] - d[1]) ** 2)])

    coor = np.vstack(
        (
            pA, 
            pB, pC, 
            *(roro(pC, np.array([0, 0, 1]), i * 2 / 5 * np.pi) for i in range(1, 4)), # D, E, F
            pG, 
            *(roro(pG, np.array([0, 0, 1]), i * 2 / 5 * np.pi) for i in range(1, 5)), # H, I, J, K
            np.array([0, 0, pG[2] - pA[2]]) # pL
        )
    )

    return coor + np.array([0, 0, -pG[2] / 2])


def ico_coors(s, ckv, iter=100, tol=1E-15):
    if s == 2:
        return ico_coors_2(ckv, iter, tol)
    elif s == 3:
        return ico_coors_3(ckv, iter, tol)
    elif s == 5:
        return ico_coors_5(ckv)
    else:
        raise ValueError("invalid symmetry mode!")


def parse_args(argv):
    parser = ArgumentParser(formatter_class=ArgumentDefaultsHelpFormatter)
    for ele in "hkHK":
        parser.add_argument(ele, default=1, type=int, help=f"the {ele} lattice parameter")
    choices = (5, 3, 2)
    parser.add_argument("-symmetry", default=choices[0], type=int, help=f"the axial symmetry: {choices}")
    parser.add_argument("-sphericity", default=0, type=float, help="the sphericity value")
    return parser.parse_args(argv)


def main(argv):
    args = parse_args(argv[1:])
    h, k, H, K, s, c = args.h, args.k, args.H, args.K, args.symmetry, args.sphericity

    # tile
    tile = "dualtrihex"

    # lattice basis
    lattice = calc_lattice(tile, 1)
    basis = lattice[0]
    v1, v2, v3 = (*basis, basis[1] @ rmat(np.pi / 3)) 

    # Caspar-Klug vectors
    ckv = [
        [h, k] @ basis,
        [H, K] @ np.stack([v2, v3]),
        [-h - k, h] @ basis,
        [k, -h] @ np.stack([v1, v3])
    ]
    # Caspar-Klug triangles
    ckt = [
        [],
        [np.array([0, 0]), ckv[0], ckv[3]],
        [np.array([0, 0]), ckv[1], ckv[0]],
        [np.array([0, 0]), ckv[2], ckv[1]],
    ]

    meshes = [[]]
    for t_idx in range(1, 4):
        triangle = ckt[t_idx]
        bounds = np.array([ele @ np.linalg.inv(basis) for ele in ckv]).astype(int)
        # lattice grid
        lattice_coordinates = chain(
            (
                [i, j]
                for i in range(bounds[:, 0].min(), bounds[:, 0].max() + 1)
                for j in range(bounds[:, 1].min(), bounds[:, 1].max() + 1)
            )
        )
        mesh = []
        for coor in lattice_coordinates:
            # process tile subunits
            for calc_tile in lattice[1]:
                path = list(iter_ring(calc_tile(coor @ basis)))
                vertices = []
                # iterate polygon edges
                for src, tar in path:
                    # add point if it is within the triangle bounds
                    in_triangle(src, *triangle) and vertices.append((np.append(src, 1), 0))
                    # iterate triangle edges
                    for edge in iter_ring(triangle):
                        # add point that at the intersetion of the polygon and triangle edges
                        if (x := intersection(src, tar, *edge)).any():
                            vertices.append((np.append(x, 1), 1))
                # keep edges if they occur on the tile polygon path
                edges = [
                    (s1, t1) 
                    for s1, t1 in iter_ring(list(range(len(vertices))))
                    if any(on_same_line(vertices[s1][0], vertices[t1][0], np.append(s2, 1), np.append(t2, 1)) for s2, t2 in path)
                ]
                # if there are only two edges and they point to each other, then only keep one
                edges = [edges[0]] if len(edges) == 2 and edges[0] == edges[1][::-1] else edges        
                edges and mesh.append(([ele[0] for ele in vertices], edges))
        mesh and meshes.append(mesh)
    
    meshes3d = [[], [], [], []]
    config = ICO_CONFIG[s]
    coors = ico_coors(s, ckv)
    for t_idx, t_rep, t_id, v_idx in zip(*config):
        A = np.linalg.inv(np.transpose(np.hstack((np.stack(ckt[t_idx]), np.ones([3, 1])))))
        for i in range(t_rep):
            M = np.transpose(np.apply_along_axis(roro, 1, coors[v_idx,], t=i * (2 * np.pi) / s)) @ A
            meshes3d.append([([M @ point for point in vertices], edges) for vertices, edges in meshes[t_idx]])

    if "bpy" in sys.modules:
        for i, mesh in enumerate(meshes[1:], start=1):
            collection = bpy.data.collections.new(f"facet-{i}")
            bpy.context.scene.collection.children.link(collection)
            for j, polygon in enumerate(mesh, start=1):
                mesh = bpy.data.meshes.new(name=f"polygon_msh[{i},{j}]")
                mesh.from_pydata(*polygon, [])
                mesh.validate(verbose=True)
                obj = bpy.data.objects.new(f"polygon_obj-[{i},{j}]", mesh)
                collection.objects.link(obj)
    else:
        pass
    
    return 0


if __name__ == "__main__":
    if "bpy" in sys.modules:
        [bpy.data.objects.remove(obj, do_unlink=True) for obj in bpy.data.objects]
        [bpy.data.collections.remove(obj, do_unlink=True) for obj in bpy.data.collections]
        main(["capsid", "3", "1", "4", "2", "-symmetry", "5", "-sphericity", "0"])
    else:
        sys.exit(main(sys.argv))
