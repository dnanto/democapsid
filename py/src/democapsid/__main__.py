#!/usr/bin/env python3

import sys
from functools import partial

from .cli import parse_args
from .democapsid import calc_ckm, calc_ckv, calc_ico, calc_lattice, cylinderize

args = parse_args(sys.argv[1:])
h, k, H, K, s, R, t, c = args.h, args.k, args.H, args.K, args.symmetry, args.radius, args.tile, args.sphericity

lattice = calc_lattice(t, R)
ckv = calc_ckv(h, k, H, K, lattice[0])
ckm = calc_ckm(ckv, lattice)

if args.mode == "ico":
    inflater = spherize if h == H and k == K else partial(cylinderize, s=s)
    meshes = calc_ico(ckv, ckm, s, c, inflater)

print("x", "y", "z", "face", "polygon", "point", sep="\t")
for i, mesh in enumerate(meshes[1:], start=1):
    for j, polygon in enumerate(mesh, start=1):
        for k, point in enumerate(polygon[0], start=1):
            print(*point, i, j, k, sep="\t")
