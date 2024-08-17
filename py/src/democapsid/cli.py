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
    parser.add_argument("-a", "-axis", default=choices[0], type=int, help=f"the axial symmetry: {choices}")
    parser.add_argument("-R", "-radius", default=1, type=int, help="the hexagonal lattice unit circumradius")
    choices = ("hex", "trihex", "snubhex", "rhombitrihex")
    choices = (*choices, *("dual" + ele for ele in choices))
    parser.add_argument("-t", "-tile", default=choices[0], help="the hexagonal lattice unit tile")
    parser.add_argument("-s", "-sphericity", default=0, type=float, help="the sphericity value")
    choices = ("ico", "tri")
    parser.add_argument("-m", "-mode", default=choices[0], help="the render mode")
    return parser.parse_args(argv)
