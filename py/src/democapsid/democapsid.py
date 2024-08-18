#!/usr/bin/env python3

import sys
from functools import partial
from itertools import chain

import numpy as np

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


def iter_ring(elements):
    """Iterate successive element pairs as a ring.

    "ABCD"  -> [('A', 'B'), ('B', 'C'), ('C', 'D'), ('D', 'A')]
    "AB"    -> [('A', 'B'), ('B', 'A')]
    "A"     -> []
    ""      -> []

    Args:
        elements (list): The list of elements.

    Yields:
        tuple: The next pair.
    """
    yield from ((elements[i], elements[(i + 1) % len(elements)]) for i in range(len(elements))) if len(elements) > 1 else ()


def angle(p, q):
    """Calculate the angle between two vectors.

    Args:
        p (list): The vector.
        q (list): The vector.

    Returns:
        float: The angle (radians).
    """
    return np.arccos(np.dot(p, q) / (np.linalg.norm(p) * np.linalg.norm(q)))


def uvec(v):
    """Calculate the unit vector.

    Args:
        v (list): The vector.

    Returns:
        np.array: The numpy array.
    """
    return v / np.linalg.norm(v)


def proj(p, q):
    """Calculate the vector projection of p onto q.

    Args:
        p (np.array): The vector.
        q (np.array): The vector.

    Returns:
        np.array: The vector projection.
    """
    return (np.dot(p, q) / np.dot(q, q)) * q


def rmat_2d(t):
    """Calculate the two-dimensional rotation matrix.

    Args:
        t (float): The rotation angle (radians).

    Returns:
        np.array: The two-dimensional rotation matrix.
    """
    cos, sin = np.cos(t), np.sin(t)
    return np.array([[cos, sin], [-sin, cos]])


def roro(v, k=np.array([0, 0, 1]), t=0):
    """Calculate the rotated vector based on Rodrigues' rotation formula.

    Args:
        v (np.array): The vector.
        k (np.array, optional): The rotation axis vector. Defaults to np.array([0, 0, 1]).
        t (int, optional): The rotation angle (radians). Defaults to 0.

    Returns:
        np.array: The rotated vector.
    """
    # https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
    return v * np.cos(t) + np.cross(k, v) * np.sin(t) + k * np.dot(k, v) * (1 - np.cos(t))


def calc_triangle(R, t=0):
    """Calculate equilateral triangle coordinates (△).

    Args:
        R (float): The circumradius.
        t (int, optional): The rotation angle (radians). Defaults to 0.

    Returns:
        tuple: The tuple of shape coordinates and inradius.
    """
    r = R / 2
    a = SQRT3 * R
    points = (
        (0, R),
        (a / 2, -r),
        (-a / 2, -r)
    )
    rmat_t = rmat_2d(t)
    return [rmat_t @ ele for ele in points], r


def calc_square(R, t=0):
    """Calculate square coordinates (◇).

    Args:
        R (float): The circumradius.
        t (int, optional): The rotation angle in (radians). Defaults to 0.

    Returns:
        tuple: The tuple of shape coordinates and inradius.
    """
    r = R / SQRT2
    points = (
        (0, R),
        (R, 0),
        (0, -R),
        (-R, 0),
    )
    rmat_t = rmat_2d(t)
    return [rmat_t @ ele for ele in points], r
    

def calc_hexagon(R, t=0):
    """Calculate regular hexagon coordinates (⬡).

    Args:
        R (float): The circumradius.
        t (int, optional): The rotation angle in (radians). Defaults to 0.

    Returns:
        tuple: The tuple of shape coordinates and inradius.
    """
    r = R * (SQRT3 / 2)
    points = (
        (0, 1), 
        (r, 0.5), 
        (r, -0.5), 
        (0, -1), 
        (-r, -0.5), 
        (-r, 0.5)
    )
    rmat_t = rmat_2d(t)
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
        sqr2 = [rmat_2d(np.pi / 3) @ ele for ele in sqr1]
        sqr3 = [rmat_2d(2 * np.pi / 3) @ ele for ele in sqr1]
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
        r6 = R6 * (SQRT3 / 2)
        basis = np.array([
            [(3 / 2) * R6, r6],
            [0, 2 * r6],
        ])
        tri, r3 = calc_triangle(R3 := R6 / SQRT3)
        tri = [ele + [0, -(r6 - r3)] for ele in tri]
        tris = [[rmat_2d(i * np.pi / 3) @ ele for ele in tri] for i in range(6)]
        tiler = [
            *((lambda coor, tri=tri: tri + coor) for tri in tris)
        ]
    elif t == "dualtrihex":
        r6 = R6 * (SQRT3 / 2)
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
        rmbs1 = [[rmat_2d(i * np.pi / 3) @ ele for ele in rmb1] for i in range(6)]
        rmbs2 = [[rmat_2d(i * np.pi / 3) @ ele for ele in rmb2] for i in range(6)]
        basis = np.array([
            [2 * r6, 0],
            [r6, SQRT3 * r6],
        ])
        tiler = [
            *((lambda coor, rmb=rmb: rmb + coor) for rmb in rmbs1),
            *((lambda coor, rmb=rmb: rmb + coor) for rmb in rmbs2),
        ]
    elif t == "dualsnubhex":
        r6 = R6 * (SQRT3 / 2)
        basis = np.array([
            [2.5 * R6, r6],
            [0.5 * R6, 2 * r6 + 2 * ((R6 * SQRT3) / 3) - (R6 * SQRT3) / 6],
        ])
        sgm = np.array([
            [0, 0],
            [0, r6 + (R6 * SQRT3) / 6],
            [0.5 * R6, r6 + (R6 * SQRT3) / 3],
            [R6, r6 + (R6 * SQRT3) / 6],
            [R6, (R6 * SQRT3) / 3],
        ])
        sgms = [[rmat_2d(i * np.pi / 3) @ ele for ele in sgm] for i in range(6)]
        tiler = [
            *((lambda coor, sgm=sgm: sgm + coor) for sgm in sgms)
        ]
    elif t == "dualrhombitrihex":
        r6 = R6 * (SQRT3 / 2)
        basis = np.array([
            [(3 / 2) * R6, r6],
            [0, 2 * r6],
        ])
        sgm = np.array([
            [0, 0],
            [0, r6],
            [0.5 * R6, r6],
            [(SQRT3 / 2) * r6, 0.5 * r6]
        ])
        sgms = [[rmat_2d(i * np.pi / 3) @ ele for ele in sgm] for i in range(6)]
        tiler = [
            *((lambda coor, sgm=sgm: sgm + coor) for sgm in sgms)
        ]
    else:
        raise ValueError("invalid tile mode!")
    return (basis, tiler)


def triangle_area(p1, p2, p3):
    """Calculate the area of a triangle.

    Args:
        p1 (np.array): The point.
        p2 (np.array): The point.
        p3 (np.array): The point.

    Returns:
        float: The area.
    """
    # Weisstein, Eric W. "Triangle Area." From MathWorld--A Wolfram Web Resource.
    # https://mathworld.wolfram.com/TriangleArea.html
    return 0.5 * np.abs(np.cross(p1 - p2, p1 - p3))


def in_triangle(q, p1, p2, p3):
    """Calculate whether a point occurs within a triangle.

    Args:
        q (np.array): The point to test.
        p1 (np.array): The triangle point.
        p2 (np.array): The triangle point.
        p3 (np.array): The triangle point.

    Returns:
        bool: The test result.
    """
    return np.isclose(triangle_area(p1, p2, p3), sum(triangle_area(q, *ele) for ele in iter_ring((p1, p2, p3))))


def on_same_line(p1, q1, p2, q2):
    """Calculate whether two line segments occur on the same line.

    Args:
        p1 (np.array): The first point of the first segment.
        q1 (np.array): The second point of the first segment.
        p2 (np.array): The first point of the second segment.
        q2 (np.array): The second point of the second segment.

    Returns:
        bool: The test result.
    """
    return np.isclose(np.linalg.norm(np.cross(q1 - p1, p2 - p1)), 0) and np.isclose(np.linalg.norm(np.cross(q1 - p1, q2 - p1)), 0)


def intersection(p1, q1, p2, q2):
    """Calculate the intersection point of two segments.

    Args:
        p1 (list): The first point of the first segment.
        q1 (list): The second point of the first segment.
        p2 (list): The first point of the second segment.
        q2 (list): The second point of the second segment.

    Returns:
        np.array: The intersection point or empty array.
    """
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
    """Calculate the roots of a function within the interval.

    Args:
        f (function): The function.
        a (float): The initial bracket interval value.
        b (float): The final bracket interval value.
        iter (int): The number of interations.

    Yields:
        float: The next root-generating function parameter.
    """
    prev, frac = np.sign(f(a)), b / iter
    for i in range(iter):
        curr = np.sign(f(x := a + i * frac))
        if prev != curr:
            yield a + (i - 1) * frac, x
            prev = curr


def bisection(f, a, b, iter, tol):
    """Caculate the root of a function within the interval.

    Args:
        f (function): The function.
        a (float): The initial bracket interval value.
        b (float): The final bracket interval value.
        iter (int): The maximum number of interations.
        tol (float): The machine tolerance.

    Returns:
        tuple: The iteration number, the root value, the root-generating parameter.
    """
    for i in range(iter):
        f_of_c = f(c := (a + b) / 2)
        if f_of_c == 0 or (b - a) / 2 < tol:
            break
        if np.sign(f_of_c) == np.sign(f(a)):
            a = c
        else:
            b = c
    return i, f_of_c, c


def triangle_circumcircle_center(p1, p2, p3):
    """Calculate the triangle circumcircle center.

    Args:
        p1 (np.array): The triangle point.
        p2 (np.array): The triangle point.
        p3 (np.array): The triangle point.

    Returns:
        np.array: The triangle circumcircle center.
    """
    # https://en.wikipedia.org/wiki/Circumcircle#Higher_dimensions
    a, b = p1 - p3, p2 - p3
    return np.cross(np.dot(np.linalg.norm(a) ** 2, b) - np.dot(np.linalg.norm(b) ** 2, a), np.cross(a, b)) / (2 * np.linalg.norm(np.cross(a, b)) ** 2) + p3


def tetrahedron_circumsphere_center(p1, p2, p3, p4):
    """Calculate the tetrahedron circumsphere center.

    Args:
        p1 (np.array): The tetrahedron point.
        p2 (np.array): The tetrahedron point.
        p3 (np.array): The tetrahedron point.
        p4 (np.array): The tetrahedron point.

    Returns:
        np.array: The tetrahedron circumsphere center.
    """
    # https://rodolphe-vaillant.fr/entry/127/find-a-tetrahedron-circumcenter 
    e1, e2, e3 = p2 - p1, p3 - p1, p4 - p1
    return p1 + (1 / (2 * np.linalg.det(np.stack((e1, e2, e3))))) * (np.linalg.norm(e3) ** 2 * np.cross(e1, e2) + np.linalg.norm(e2) ** 2 * np.cross(e3, e1) + np.linalg.norm(e1) ** 2 * np.cross(e2, e3))


def sd_sphere(p, r):
    """Calculate the signed distance of a point from a sphere centered at the origin.

    Args:
        p (np.array): The point.
        r (float): The radius.

    Returns:
        float: The signed distance.
    """
    return np.linalg.norm(p) - r


def spherize(coor, verts, sphericity):
    """Project the coordinates to the circumsphere.

    Args:
        coor (np.array): The coordinate.
        verts (np.array): The icosahedron coordinates.
        sphericity (float): The sphericity factor.

    Returns:
        np.array: The projected coordinate.
    """
    return coor + uvec(coor) * (np.abs(sd_sphere(coor, np.linalg.norm(verts[6] - verts[6][2]))) * -sphericity)


def cylinderize(coor, verts, sphericity, a=5):
    """Project the coordinate to the encapsulating cylinder.

    Args:
        coor (np.array): The coordinate.
        verts (np.array): The icosahedron coordinates.
        sphericity (float): The sphericity factor.
        a (int, optional): The axial symmetry. Defaults to 5.

    Returns:
        np.array: The projected coordinate.
    """
    r = np.linalg.norm(verts[6] - verts[6][2])
    h2 = (verts[4][2] - verts[6][2]) / 2

    if a == 5:
        pos = np.array([0, 0, h2 - (r / 2)])
        rad = verts[0][2] + (r / 2) - h2
    elif a == 3:
        p1, p2 = verts[0], verts[3]
        pos = triangle_circumcircle_center(p1, p2, np.array([p2[0], -p2[1], p2[2]]))
        rad = np.linalg.norm(p1 - pos)
    elif a == 2:
        p1 = verts[0]
        pos = tetrahedron_circumsphere_center(p1, *verts[(1, 4, 5), :])
        rad = np.linalg.norm(p1 - pos)

    pos1 = np.array([0, 0, pos[2]])
    pos2 = np.array([0, 0, -pos[2]])
    tmid = np.array([0, 0, h2])
    bmid = np.array([0, 0, -h2])
    if h2 < coor[2]:    # top cap
        d = sd_sphere(coor - pos1, rad)
        d = np.abs(d)
        return (d * sphericity * uvec(coor - tmid)) + coor
    elif coor[2] < -h2: # bottom cap
        d = sd_sphere(coor - pos2, rad)
        d = np.abs(d)
        return (d * sphericity * uvec(coor - bmid)) + coor
    
    # body cylinder
    return ((r - np.linalg.norm(coor[:2])) * sphericity * uvec(coor - coor[2])) + coor


def ico_coors_2(ckv, iter=100, tol=1E-15):
    """Calculate icosahedron vertex coordinates with two-fold axial symmetry.

    Args:
        ckv (list): The Casar-Klug vectors.
        iter (int, optional): The iteration number for numerical methods. Defaults to 100.
        tol (float, optional): The machine epsilon for numerical methods. Defaults to 1E-15.

    Returns:
        np.array: The array of vertex coordinates.
    """
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
        t = next(bisection(f, a, b, iter=iter, tol=tol)[2] for a, b in brackets(f, 0, 2 * np.pi, iter))
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
    t = next(bisection(obj, a, b, iter=iter, tol=tol)[2] for a, b in brackets(obj, t, np.pi / 4, iter))
    pE, pF, pG, _ = fold(t)

    def obj(t):
        pK = roro(pA, np.array([0, 0, 1]), t) + np.array([0, 0, pG[2] + pE[2]])
        return np.linalg.norm(pK - pF) - b
    t = next(bisection(obj, a, b, iter=iter, tol=tol)[2] for a, b in brackets(obj, 0, 2 * np.pi, iter))
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
    """Calculate icosahedron vertex coordinates with three-fold axial symmetry.

    Args:
        ckv (list): The Casar-Klug vectors.
        iter (int, optional): The iteration number for numerical methods. Defaults to 100.
        tol (float, optional): The machine epsilon for numerical methods. Defaults to 1E-15.

    Returns:
        np.array: The array of vertex coordinates.
    """
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
        t = next(bisection(f, a, b, iter=iter, tol=tol)[2] for a, b in brackets(f, 0, 2 * np.pi, iter))
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
    t = next(bisection(obj, a, b, iter=iter, tol=tol)[2] for a, b in brackets(obj, t, np.pi / 4, iter))
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
    """Calculate icosahedron vertex coordinates with five-fold axial symmetry.

    Args:
        ckv (list): The Casar-Klug vectors.

    Returns:
        np.array: The array of vertex coordinates.
    """
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


def calc_ckv(ckp, basis):
    """Calcaulte the Caspar-Klug vectors.

    Args:
        ckp (tuple): The Caspar-Klug parameter tuple (h, k, H, K).
        basis (np.array): The lattice basis.

    Returns:
        list: The list of Caspar-Klug vectors.
    """
    h, k, H, K = ckp
    v1, v2, v3 = (*basis, basis[1] @ rmat_2d(np.pi / 3)) 
    return [
        [h, k] @ basis,
        [H, K] @ np.stack([v2, v3]),
        [-h - k, h] @ basis,
        [k, -h] @ np.stack([v1, v3])
    ]


def calc_ckt(ckv):
    """Calculate the Caspar-Klug triangles.

    Args:
        ckv (tuple): The Caspara-Klug vectors.

    Returns:
        list: The list of triangles.
    """
    return [
        [],
        [np.array([0, 0]), ckv[0], ckv[3]],
        [np.array([0, 0]), ckv[1], ckv[0]],
        [np.array([0, 0]), ckv[2], ckv[1]]
    ]


def calc_ckm(ckp, lat):
    """Calculate the Caspar-Klug mesh for each Caspar-Klug triangle.

    Args:
        ckp (tuple): The Caspar-Klug parameter tuple (h, k, H, K).
        lat (tuple): The lattice tuple (basis, list of unit tiler functions).

    Returns:
        list: The list of meshes, each mesh is a tuple (vertices, edges).
    """
    ckt = calc_ckt(ckv := calc_ckv(ckp, lat[0]))
    meshes = [[]]
    for t_idx in range(1, 4):
        triangle = ckt[t_idx]
        bounds = np.array([ele @ np.linalg.inv(lat[0]) for ele in ckv]).astype(int)
        # lattice grid
        lattice_coordinates = chain(
            (
                [i, j]
                for i in range(bounds[:, 0].min(), bounds[:, 0].max() + 2)
                for j in range(bounds[:, 1].min(), bounds[:, 1].max() + 2)
            )
        )
        mesh = []
        for coor in lattice_coordinates:
            # process tile subunits
            for calc_tile in lat[1]:
                path = [(np.append(src, 0), np.append(tar, 0)) for src, tar in iter_ring(calc_tile(coor @ lat[0]))]
                vertices = []
                # iterate polygon edges
                for src, tar in path:
                    # add point if it is within the triangle bounds
                    in_triangle(src[:2], *triangle) and vertices.append(src)
                    # iterate triangle edges
                    for edge in iter_ring(triangle):
                        # add point that at the intersetion of the polygon and triangle edges
                        (x := intersection(src[:2], tar[:2], *edge)).any() and vertices.append(np.append(x, 0))
                # keep edges if they occur on the tile polygon path
                edges = [
                    (s1, t1) 
                    for s1, t1 in iter_ring(list(range(len(vertices))))
                    if any(on_same_line(vertices[s1], vertices[t1], s2, t2) for s2, t2 in path)
                ]
                # if there are only two edges and they point to each other, then only keep one
                edges = [edges[0]] if len(edges) == 2 and edges[0] == edges[1][::-1] else edges        
                edges and mesh.append((vertices, edges))
        mesh and meshes.append(mesh)
    return meshes


def calc_ico(ckp, lat, a=5, s=0, iter=100, tol=1E-15):
    """Calculate the icosahedral mesh.

    Args:
        ckp (tuple): The Caspar-Klug parameter tuple (h, k, H, K).
        lat (tuple): The lattice tuple (basis, list of unit tiler functions).
        a (int, optional): The axial symmetry. Defaults to 5.
        s (int, optional): The sphericity. Defaults to 0.
        iter (int, optional): The iteration number for numerical methods. Defaults to 100.
        tol (float, optional): The machine epsilon for numerical methods. Defaults to 1E-15.

    Returns:
        list: The list of meshes for each face.
    """
    h, k, H, K = ckp
    inflater = spherize if h == H and k == K else partial(cylinderize, a=a)
    ckt, ckm = calc_ckt(ckv := calc_ckv(ckp, lat[0])), calc_ckm(ckp, lat)
    coors = (None, None, ico_coors_2, ico_coors_3, None, lambda ckv, _, __: ico_coors_5(ckv))[a](ckv, iter, tol)
    meshes = [[], [], [], []]
    for t_idx, t_rep, t_id, v_idx in zip(*ICO_CONFIG[a]):
        # calculate matrix of ck-triangle net
        A = np.linalg.inv(np.transpose(np.hstack((np.stack(ckt[t_idx]), np.ones([3, 1])))))
        for i in range(t_rep):
            # rotate the icosahedron triangle face around symmetry axis
            # to calculate the matrix for the affine transform
            M = np.transpose(np.apply_along_axis(roro, 1, coors[v_idx,], t=i * (2 * np.pi) / a)) @ A
            # apply transform and inflate coordinates
            meshes.append([([inflater(M @ point, coors, s) for point in vertices], edges) for vertices, edges in ckm[t_idx]])
    return meshes
