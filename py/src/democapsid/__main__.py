#!/usr/bin/env python3

import sys

from .cli import parse_args
from .democapsid import calc_ckm, calc_ico, calc_lattice, dextrize

args = parse_args(sys.argv[1:])

ckp = (args.h, args.k, args.H, args.K)
lat = calc_lattice(args.t, args.R)

if args.m == "ico":
    meshes = calc_ico(ckp, lat, a=args.a, s=args.s, iter=args.iter, tol=args.tol)
elif args.m == "tri":
    meshes = calc_ckm(ckp, lat)

meshes = meshes if args.c == "levo" else dextrize(meshes)

print("x", "y", "z", "face", "polygon", "point", sep="\t")
for i, mesh in enumerate(meshes[1:], start=1):
    for j, polygon in enumerate(mesh, start=1):
        for k, point in enumerate(polygon[0], start=1):
            print(*point, i, j, k, sep="\t")
