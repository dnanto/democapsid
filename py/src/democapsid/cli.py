#!/usr/bin/env python3

def parse_args(argv):
    from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser
    parser = ArgumentParser(
        prog="democapsid",
        formatter_class=ArgumentDefaultsHelpFormatter,
        description="Calculate meshes for icosahedral virus capsids."
    )
    for ele in "hkHK":
        parser.add_argument(ele, type=int, help=f"the {ele} Caspar-Klug parameter")
    choices = (5, 3, 2)
    parser.add_argument("-a", "-axis", default=choices[0], choices=choices, type=int, help="the axial symmetry")
    parser.add_argument("-R", "-radius", default=1, type=int, help="the hexagonal lattice unit circumradius")
    choices = tuple(pfx + ele for pfx in ("", "dual") for ele in ("hex", "trihex", "snubhex", "rhombitrihex"))
    parser.add_argument("-t", "-tile", default=choices[0], choices=choices, help="the hexagonal lattice unit tile")
    parser.add_argument("-s", "-sphericity", default=0, type=float, help="the sphericity value")
    choices = ("ico", "tri")
    parser.add_argument("-m", "-mode", default=choices[0], choices=choices, help="the render mode")
    parser.add_argument("-iter", default=100, type=int, help="the iteration number for numerical methods")
    parser.add_argument("-tol", default=1E-15, type=float, help="the machine epsilon for numerical methods")
    return parser.parse_args(argv)
