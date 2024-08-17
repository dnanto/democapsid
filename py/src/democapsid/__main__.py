#!/usr/bin/env python3

import sys

from .cli import parse_args
from .democapsid import calc_ckm, calc_ckv, calc_ico, calc_lattice, cylinderize

args = parse_args(sys.argv[1:])
h, k, H, K, a, R, t, s, m = (getattr(args, key) for key in "h,k,H,K,a,R,t,s,m".split(","))
iter, tol = args.iter, args.tol

ckp = (h, k, H, K)
lat = calc_lattice(t, R)

if m == "ico":
    meshes = calc_ico(ckp, lat, a=a, s=s, iter=iter, tol=tol)
elif m == "tri":
    meshes = calc_ckm(ckp, lat)

print("x", "y", "z", "face", "polygon", "point", sep="\t")
for i, mesh in enumerate(meshes[1:], start=1):
    for j, polygon in enumerate(mesh, start=1):
        for k, point in enumerate(polygon[0], start=1):
            print(*point, i, j, k, sep="\t")
