#!/usr/bin/env python3

def parse_args(argv):
    from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser
    parser = ArgumentParser(
        prog="democapsid",
        formatter_class=ArgumentDefaultsHelpFormatter,
        description="Calculate meshes for icosahedral virus capsids."
    )
    for ele in "hkHK":
        parser.add_argument(ele, default=1, type=int, help=f"the {ele} lattice parameter")
    choices = (5, 3, 2)
    parser.add_argument("-symmetry", default=choices[0], type=int, help=f"the axial symmetry: {choices}")
    parser.add_argument("-radius", default=1, type=int, help="the hexagonal lattice unit radius")
    choices = ("hex", "trihex", "snubhex", "rhombitrihex")
    choices = (*choices, *("dual" + ele for ele in choices))
    parser.add_argument("-tile", default=choices[0], help="the hexagonal lattice unit tile")
    parser.add_argument("-sphericity", default=0, type=float, help="the sphericity value")
    choices = ("ico", "net")
    parser.add_argument("-mode", default=choices[0], help="the sphericity value")
    return parser.parse_args(argv)
