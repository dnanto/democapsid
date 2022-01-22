/**
 * @jest-environment jsdom
 */

const [Matrix /*, Hex, TriHex, SnubHex, RhombiTriHex, DualTriHex, DualSnubHex, DualRhombiTriHex*/] = require("../js/capsid");
// const paper = require("paper");

// paper.install(window);
// paper.setup([500, 100]);

// beforeEach(() => {
//     project.activeLayer.removeChildren();
//     view.draw();
// });

test("matrix multiplication", () => {
    expect(
        Matrix.mul(
            [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1],
            ],
            [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ]
        )
    ).toMatchObject([
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
    ]);
    expect(
        Matrix.mul(
            [
                [2, 8, 5],
                [1, 6, 7],
                [9, 4, 3],
            ],
            [
                [5, 8, 7],
                [3, 4, 1],
                [6, 9, 2],
            ]
        )
    ).toMatchObject([
        [64, 93, 32],
        [65, 95, 27],
        [75, 115, 73],
    ]);
    expect(
        Matrix.mul(
            [
                [9, 1, 6],
                [3, 2, 5],
                [7, 4, 8],
            ],
            [
                [3, 7, 5],
                [9, 4, 1],
                [6, 8, 2],
            ]
        )
    ).toMatchObject([
        [72, 115, 58],
        [57, 69, 27],
        [105, 129, 55],
    ]);
});

test("matrix determinant", () => {
    expect(
        Matrix.det3([
            [9, 1, 6],
            [3, 2, 5],
            [7, 4, 8],
        ])
    ).toBe(-37);
    expect(
        Matrix.det3([
            [3, 7, 5],
            [9, 4, 1],
            [6, 8, 2],
        ])
    ).toBe(156);
    expect(
        Matrix.det3([
            [72, 115, 58],
            [57, 69, 27],
            [105, 129, 55],
        ])
    ).toBe(-5772);
});

test("matrix inverse", () => {
    // https://www.mathcentre.ac.uk/resources/uploaded/sigma-matrices11-2009-1.pdf
    expect(
        Matrix.inv3([
            [7, 2, 1],
            [0, 3, -1],
            [-3, 4, -2],
        ])
    ).toMatchObject([
        [-2, 8, -5],
        [3, -11, 7],
        [9, -34, 21],
    ]);
});
