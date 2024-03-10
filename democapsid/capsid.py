#!/usr/bin/env python3

import sys
from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser
from functools import partial
from itertools import chain
from functools import namedtuple

import numpy as np

try:
    import bpy
    from bpy.props import FloatVectorProperty
    from bpy.types import Operator
    from bpy_extras.object_utils import AddObjectHelper, object_data_add
except ImportError:
    pass


SQRT3 = np.sqrt(3)
SQRT5 = np.sqrt(5)
PHI = (1 + SQRT5) / 2


def proj(p, q):
    return (np.dot(p, q) / np.dot(q, q)) * q


def iter_ring(elements):
    """() -> (); A -> (); AB -> ((B, A), (A, B)); ABC -> ((C, A), (A, B), (B, C)); ...
    """
    yield from ((elements[i-1], elements[i]) for i in range(len(elements))) if len(elements) > 1 else ()


def angle(p, q):
    return np.arccos(np.dot(p, q) / (np.linalg.norm(p) * np.linalg.norm(q)))


def uvec(v):
    return v / np.linalg.norm(v)


def roro(v, k, t):
    # https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
    return v * np.cos(t) + np.cross(k, v) * np.sin(t) + k * np.dot(k, v) * (1 - np.cos(t))


def triangle_area(p, q, r):
    # Weisstein, Eric W. "Triangle Area." From MathWorld--A Wolfram Web Resource.
    # https://mathworld.wolfram.com/TriangleArea.html
    return 0.5 * np.abs(np.cross(p - q, p - r))


def in_triangle(p, q1, q2, q3):
    return np.isclose(
        triangle_area(q1, q2, q3),
        sum(triangle_area(p, *ele) for ele in iter_ring((q1, q2, q3)))
    )


def update_coor_to_id(coor_to_id, coors):
    for coor in map(tuple, coors):
        identifier = coor_to_id.get(coor, len(coor_to_id))
        coor_to_id[coor] = identifier
        yield identifier


def intersection(p1, q1, p2, q2):
    x1, y1, x2, y2, x3, y3, x4, y4 = *p1, *q1, *p2, *q2

    # adapted from http://paulbourke.net/geometry/pointlineplane/edge_intersection.py
    d = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    if np.isclose(d, 0):
        return ()

    ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / d
    if ua < 0 or ua > 1:
        return ()

    ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / d
    if ub < 0 or ub > 1:
        return ()

    return np.array([x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)])


def kabsch_umeyama(A, B):
    # https://zpl.fi/aligning-point-patterns-with-kabsch-umeyama-algorithm/

    assert A.shape == B.shape
    n, m = A.shape

    EA = np.mean(A, axis=0)
    EB = np.mean(B, axis=0)
    VarA = np.mean(np.linalg.norm(A - EA, axis=1) ** 2)

    H = ((A - EA).T @ (B - EB)) / n
    U, D, VT = np.linalg.svd(H)
    d = np.sign(np.linalg.det(U) * np.linalg.det(VT))
    S = np.diag([1] * (m - 1) + [d])

    R = U @ S @ VT
    c = VarA / np.trace(np.diag(D) @ S)
    t = EA - c * R @ EB

    return R, c, t


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


class Capsid(object):
    def __init__(self, h=1, k=1, H=1, K=1):
        self.h, self.k, self.H, self.K = h, k, H, K
        r = SQRT3 / 2   # hexagon inradius
        d = 2 * r       # hexagon-hexagon center distance
        # h/k-basis
        self.a1 = d * np.array([1, 0])              # →
        self.a2 = d * np.array([0.5, SQRT3 / 2])    # ↗
        # H/K-basis
        self.A1 = d * np.array([0.5, SQRT3 / 2])    # ↗
        self.A2 = d * np.array([-0.5, SQRT3 / 2])   # ↖
        # capsid vectors
        self.C1 = h * self.a1 + k * self.a2         # \vec{C}_{T}
        self.C2 = H * self.A1 + K * self.A2         # \vec{C}_{Q}
        self.C3 = (-h - k) * self.a1 + h * self.a2  # \vec{C}^{120^{\circ}}_{T}
        tht = -(np.pi / 3)
        self.C4 = np.array([[np.cos(tht), -np.sin(tht)], [np.sin(tht), np.cos(tht)]]) @ self.C1
    
    def __str__(self):
        return f"Capsid({h}, {k}, {H}, {K})"


    def verts5(self):
        a = np.linalg.norm(self.C1)
        b = np.linalg.norm(self.C2)
        
        R5 = a * np.sqrt(((5 + SQRT5) / 10))
        h5 = ((1 + SQRT5) * a) / (2 * np.sqrt(5 + 2 * SQRT5))
        pA = np.array([0, 0, h5])
        pB = roro(np.array([-R5, 0, 0]), np.array([0, 0, 1]), np.deg2rad(54))
        pC = pB + np.array([a, 0, 0])

        t = angle(self.C1, self.C2)
        q = pC + roro(np.array([b, 0, 0]), np.array([0, 1, 0]), -np.pi - t)
        p = pB + proj(q - pB, pC - pB)
        d = np.array([p[0], (p[1] * np.sqrt(R5 * R5 * p[1] * p[1] - p[0] * p[0])) / (p[1] * p[1]), 0])
        pG = d + np.array([0, 0, -np.sqrt(q[2] * q[2] - np.linalg.norm(p - d) ** 2)])

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


    def verts3(self, iter=100, tol=1E-15):
        a = np.linalg.norm(self.C1)
        b = np.linalg.norm(self.C2)
        c = np.linalg.norm(self.C3 - self.C2)
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

            t = angle(self.C1, self.C2)
            v, k = b * uvec(pD - pB), uvec(np.cross(pD, pB))
            o = roro(v, k, t)
            p, q = pB + proj(o, v), pB + o
            v, k = q - p, uvec(pB - pD)
            f = lambda t: c - np.linalg.norm((p + roro(v, k, t)) - pF)
            t = next(bisection(f, a, b, tol=tol, iter=iter)[2] for a, b in brackets(f, 0, 2 * np.pi, iter))
            pG = p + roro(v, k, t)
            return pD, pF, pG, np.abs(pD[1]) - np.linalg.norm(pG - np.array([0, 0, pG[2]]))

        def obj(t):
            # objective: |y(p_{D})| == |p_{G} - (0, 0, z(p_{G}))| @ t = ?
            return fold(t)[-1]

        ## find a good starting point
        
        for t in np.arange(0, np.pi / 2, np.pi / 180 / 10):
            try:
                fold(t)
                break
            except StopIteration:
                pass
        t = next(bisection(obj, a, b, tol=tol, iter=iter)[2] for a, b in brackets(obj, t, np.pi / 4, iter))
        pD, pF, pG, _ = fold(t)

        t = (2 / 3) * np.pi
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

    def verts2(self, iter=100, tol=1E-15):
        a = np.linalg.norm(self.C1)
        b = np.linalg.norm(self.C2)
        c = np.linalg.norm(self.C3 - self.C2)
        pA = np.array([a / 2, 0, 0])
        pB = np.array([-(a / 2), 0, 0])
        pC = np.array([0, -((a * PHI) / 2), -(((a * PHI) - a) / 2)])
        pD = np.array([0, ((a * PHI) / 2), -(((a * PHI) - a) / 2)])

        def fold(t):
            p = (pB + pC) / 2
            v, k = p - pA, uvec(pC - pB)
            pE = p + roro(v, k, t)
            pF = roro(pE, np.array([0, 0, 1]), np.pi)

            t = angle(self.C1, self.C2)
            v, k = b * uvec(pC - pA), uvec(np.cross(pC, pA))
            o = roro(v, k, t)
            p, q = pA + proj(o, v), pA + o
            v, k = q - p, uvec(pA - pC)
            f = lambda t: c - np.linalg.norm((p + roro(v, k, t)) - pF)
            t = next(bisection(f, a, b, tol=tol, iter=iter)[2] for a, b in brackets(f, 0, 2 * np.pi, iter))
            pG = p + roro(v, k, t)
            return pE, pF, pG, np.linalg.norm(pE - np.array([0, 0, pE[2]])) - np.linalg.norm(pG - np.array([0, 0, pG[2]]))

        def obj(t):
            # objective: |y(p_{D})| == |p_{G} - (0, 0, z(p_{G}))| @ t = ?
            return fold(t)[-1]

        ## find a good starting point
        
        for t in np.arange(0, np.pi / 2, np.pi / 180 / 10):
            try:
                fold(t)
                break
            except StopIteration:
                pass
        t = next(bisection(obj, a, b, tol=tol, iter=iter)[2] for a, b in brackets(obj, t, np.pi / 4, iter))
        print("t1>", t)
        pE, pF, pG, _ = fold(t)

        def obj(t):
            pK = roro(pA, np.array([0, 0, 1]), t) + np.array([0, 0, pG[2] + pE[2]])
            print("pK>", pK, "|pK - pF|", np.linalg.norm(pK - pF), b)
            return np.linalg.norm(pK - pF) - b

        t = next(bisection(obj, a, b, tol=tol, iter=iter)[2] for a, b in brackets(obj, 0, 2 * np.pi, iter))
        print("t>", t)
        pK = roro(pA, np.array([0, 0, 1]), t) + np.array([0, 0, pG[2] + pE[2]])
        print("pK>",pK)
        
        # y(p_{D}) Rotate(UnitVector(p_{K}-(0,0,z(p_{K}))),((π)/(2)),zAxis)+(0,0,z(p_{G})+z(p_{E})-z(p_{D}))
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

    def lattice(self, points):
        # change of basis to lattice coordinates
        a1, a2 = self.a1, self.a2
        
        M = np.linalg.inv(np.array([a1, a2])).T
        bounds = np.rint(np.array(list(map(M.dot, points)))).astype(int)
        # print(bounds)
        # print(bounds[:, 0].min(), bounds[:, 0].max() + 1)
        # print(bounds[:, 1].min(), bounds[:, 1].max() + 1)

        # ⬢ lattice unit
        HEX_CORNERS = np.array(
            [
                [0, 1], 
                [SQRT3 / 2, 0.5], 
                [SQRT3 / 2, -0.5], 
                [0, -1], 
                [-(SQRT3 / 2), -0.5], 
                [-(SQRT3 / 2), 0.5]
            ]
        )

        coor_to_id = {}
        edges = []
        for i in range(bounds[:, 0].min(), bounds[:, 0].max() + 1):
            for j in range(bounds[:, 1].min(), bounds[:, 1].max() + 1):
                coors = []
                corners = [(i * a1 + j * a2) + ele for ele in HEX_CORNERS]
                insiders = [in_triangle(ele, *points[:-1]) for ele in corners]
                for pair, flag in zip(iter_ring(corners), iter_ring(insiders)):
                    p, q = pair
                    ip, iq = flag
                    if ip:
                        coors.append(p)
                    if not ip or not iq:
                        for ele in iter_ring(points[:-1]):
                            ix = intersection(p, q, *ele)
                            if len(ix):
                                coors.append(ix)
                edges += list(iter_ring(list(update_coor_to_id(coor_to_id, coors))))
        
        # add edges
        edges += list(iter_ring(list(update_coor_to_id(coor_to_id, points[:-1]))))

        verts = [np.array([*ele, 0]) for ele in coor_to_id]

        return verts, edges
    
    def t1(self):
        points = (np.array([0, 0]), self.C1, self.C4, self.C1 + self.C4)
        return points, self.lattice(points)

    def t2(self):
        points = (np.array([0, 0]), self.C2, self.C1, self.C1 + self.C2)
        return points, self.lattice(points)
    
    def t3(self):
        points = (np.array([0, 0]), self.C3, self.C2, self.C2 + self.C3)
        return points, self.lattice(points)

    def f5(self):
        th = (2 * np.pi) / 5
        z = np.array([0, 0, 1])
        coor = self.verts5()
        
        from string import ascii_uppercase
        for item in zip(ascii_uppercase, coor):
            print(*item)

        points, lattice = self.t1()
        
        idx = (0, 1, 2)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(5):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T1-▲"
        
        idx = (6, 7, 11)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(5):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T1-▼"
        
        points, lattice = self.t2()
        
        idx = (1, 6, 2)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(5):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T2-▲"
        
        idx = (6, 2, 7)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(5):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T2-▼"
        
    def f3(self):
        th = (2 * np.pi) / 3
        z = np.array([0, 0, 1])
        coor = self.verts3()
        
        from string import ascii_uppercase
        for item in zip(ascii_uppercase, coor):
            print(*item)

        points, lattice = self.t1()
        
        idx = (0, 1, 2)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        facet = [t + c * R @ ele for ele in verts]
        yield facet, edges, "T1-▔"

        idx = (1, 3, 2)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(3):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T1-▲"

        idx = (6, 9, 11)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(3):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T1-▼"

        idx = (9, 10, 11)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        facet = [t + c * R @ ele for ele in verts]
        yield facet, edges, "T1-▁"
    
        points, lattice = self.t2()
    
        idx = (1, 6, 3)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(3):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T2-▼"
    
        idx = (9, 3, 6)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(3):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T2-▲"
    
        points, lattice = self.t3()
    
        idx = (1, 5, 6)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(3):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T3-▼"
 
        idx = (11, 6, 5)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        verts, edges = lattice
        for i in range(3):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T3-▲"
         
    def f2(self):
        th = np.pi
        z = np.array([0, 0, 1])
        coor = self.verts2()
        
        from string import ascii_uppercase
        for item in zip(ascii_uppercase, coor):
            print(*item)

        points, lattice = self.t1()
        verts, edges = lattice
        
        idx = (0, 2, 1)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T1-▔"
        
        idx = (2, 4, 1)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T1-▔"
        
        idx = (9, 6, 10)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T1▁"
        
        idx = (9, 10, 11)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T1▁"
        
        points, lattice = self.t2()
        verts, edges = lattice
        
        idx = (0, 6, 2)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T2-▼"
        
        idx = (9, 2, 6)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T2-▲"
        
        idx = (2, 9, 4)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T2-▼"
        
        idx = (9, 4, 11)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T2-▲"
        
        points, lattice = self.t3()
        verts, edges = lattice
        
        idx = (0, 5, 6)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T3-▼"
        
        idx = (10, 6, 5)
        R, c, t = kabsch_umeyama(coor[idx, :], np.vstack([(*ele, 0) for ele in points[:-1]]))
        for i in range(2):
            facet = [roro(t + c * R @ ele, z, i * th) for ele in verts]
            yield facet, edges, "T3-▲"
        
    def facets(self, s=2):
        if s == 5:
            yield from self.f5()
        elif s == 3:
            yield from self.f3()
        elif s == 2:
            yield from self.f2()
        else:
            raise ValueError(f"the axial symmetry should be 2, 3, or 5, and not {s}...")
            
        
def parse_args(argv):
    parser = ArgumentParser(formatter_class=ArgumentDefaultsHelpFormatter)
    for ele in "hkHK":
        parser.add_argument(ele, default=1, type=int, help=f"the {ele} lattice parameter")
    choices = (5, 3, 2)
    parser.add_argument("-symmetry", default=choices[0], type=int, help=f"the axial symmetry: {choices}")
    return parser.parse_args(argv)


def main(argv):
    args = parse_args(argv[1:])
    h, k, H, K, s = args.h, args.k, args.H, args.K, args.symmetry

    capsid = Capsid(h, k, H, K)
    facets = list(capsid.facets(s))

    if "bpy" in sys.modules:
        # facets    
        for idx, ele in enumerate(facets, start=1):
            verts, edges, T = ele
            mesh = bpy.data.meshes.new(name=f"Facet[{h}, {k}, {H}, {K}, T={T}, i={idx}]")
            mesh.from_pydata(verts, edges, [])
            mesh.validate(verbose=True)
            # create the object with the mesh just created
            obj = bpy.data.objects.new("capsid", mesh)
            # add the object to the scene
            scene = bpy.context.scene
            scene.collection.objects.link(obj)

    return 0


if __name__ == "__main__":
    if "bpy" in sys.modules:
        [bpy.data.objects.remove(obj, do_unlink=True) for obj in bpy.data.objects]
        main(["capsid", "1", "1", "1", "2", "-s", "5"])
    else:
        sys.exit(main(sys.argv))
