#!/usr/bin/env python3

import sys

from .cli import parse_args
from .democapsid import calc_ckm, calc_ckv, calc_ico, calc_lattice, cylinderize

args = parse_args(sys.argv[1:])
h, k, H, K, a, R, t, s, m = (getattr(args, key) for key in "h,k,H,K,a,R,t,s,m".split(","))

ckp = (h, k, H, K)
lattice = calc_lattice(t, R)

if m == "ico":
    meshes = calc_ico(ckp, lattice, a, s)
elif m == "tri":
    meshes = calc_ckm(ckp, lattice)

print("x", "y", "z", "face", "polygon", "point", sep="\t")
for i, mesh in enumerate(meshes[1:], start=1):
    for j, polygon in enumerate(mesh, start=1):
        for k, point in enumerate(polygon[0], start=1):
            print(*point, i, j, k, sep="\t")
