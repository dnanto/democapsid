/**
 * @jest-environment jsdom
 */

const paper = require('paper');

const [
    Matrix,
    Hex,
    TriHex,
    SnubHex,
    RhombiTriHex,
    DualTriHex,
    DualSnubHex,
    DualRhombiTriHex
] = require('../js/capsid');

test('matrix multiplication', () => {
    expect(
        Matrix.mul(
            [[1, 1, 1], [1, 1, 1], [1, 1, 1]],
            [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
        )
    ).toMatchObject(
        [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
    );
    expect(
        Matrix.mul(
            [[2, 8, 5], [1, 6, 7], [9, 4, 3]],
            [[5, 8, 7], [3, 4, 1], [6, 9, 2]]
        )
    ).toMatchObject(
        [[64, 93, 32], [65, 95, 27], [75, 115, 73]]
    );
    expect(
        Matrix.mul(
            [[9, 1, 6], [3, 2, 5], [7, 4, 8]],
            [[3, 7, 5], [9, 4, 1], [6, 8, 2]]
        )
    ).toMatchObject(
        [[72, 115, 58], [57, 69, 27], [105, 129, 55]]
    );
});

test('matrix determinant', () => {
    expect(Matrix.det3([[9, 1, 6], [3, 2, 5], [7, 4, 8]])).toBe(-37);
    expect(Matrix.det3([[3, 7, 5], [9, 4, 1], [6, 8, 2]])).toBe(156);
    expect(Matrix.det3([[72, 115, 58], [57, 69, 27], [105, 129, 55]])).toBe(-5772);
});

test('matrix inverse', () => {
    // https://www.mathcentre.ac.uk/resources/uploaded/sigma-matrices11-2009-1.pdf
    expect(
        Matrix.inv3([[7, 2, 1], [0, 3, -1], [-3, 4, -2]])
    ).toMatchObject(
        [[-2, 8, -5], [3, -11, 7], [9, -34, 21]]
    );
});

test("lattice", () => {
    paper.install(window);
    paper.setup([500, 100]);

    var opt = {
        "face": {
            "strokeColor": "#000000ff",
            "strokeWidth": 1
        },
        "levo": true,
        "hex.mer-1": {
            "fillColor": "#01665eff"
        },
        "pen.mer-1": {
            "fillColor": "#5ab4acff"
        },
        "hex.mer-2": {
            "fillColor": "#c7eae5ff"
        },
        "pen.mer-2": {
            "fillColor": "#f6e8c3ff"
        },
        "hex.mer-3": {
            "fillColor": "#d8b365ff"
        },
        "pen.mer-3": {
            "fillColor": "#8c510aff"
        }
    }

    var face;
    var val;

    face = new Hex(10).face(2, 1, opt);
    face.position = view.center;
    val = project.exportSVG({ asString: true });
    console.log(val);
    project.activeLayer.removeChildren();
    view.draw();
    face = new TriHex(10).face(2, 1, opt);
    face.position = view.center;
    val = project.exportSVG({ asString: true });
    console.log(val);
    project.activeLayer.removeChildren();
    view.draw();
    face = new SnubHex(10).face(2, 1, opt);
    face.position = view.center;
    val = project.exportSVG({ asString: true });
    console.log(val);
    project.activeLayer.removeChildren();
    view.draw();
    face = new RhombiTriHex(10).face(2, 1, opt);
    face.position = view.center;
    val = project.exportSVG({ asString: true });
    console.log(val);
    project.activeLayer.removeChildren();
    view.draw();
    face = new DualTriHex(10).face(2, 1, opt);
    face.position = view.center;
    val = project.exportSVG({ asString: true });
    console.log(val);
    project.activeLayer.removeChildren();
    view.draw();
    face = new DualSnubHex(10).face(2, 1, opt);
    face.position = view.center;
    val = project.exportSVG({ asString: true });
    console.log(val);
    project.activeLayer.removeChildren();
    view.draw();
    face = new DualRhombiTriHex(10).face(2, 1, opt);
    face.position = view.center;
    val = project.exportSVG({ asString: true });
    console.log(val);
    project.activeLayer.removeChildren();
    view.draw();
});
