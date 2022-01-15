/**
 * @jest-environment jsdom
 */

const paper = require("paper");
const [
  Matrix,
  Hex,
  TriHex,
  SnubHex,
  RhombiTriHex,
  DualTriHex,
  DualSnubHex,
  DualRhombiTriHex,
] = require("../js/capsid");

paper.install(window);
paper.setup([500, 100]);
var opt = {
  face: {
    strokeColor: "#000000ff",
    strokeWidth: 1,
  },
  levo: true,
  "hex.mer-1": {
    fillColor: "#01665eff",
  },
  "pen.mer-1": {
    fillColor: "#5ab4acff",
  },
  "hex.mer-2": {
    fillColor: "#c7eae5ff",
  },
  "pen.mer-2": {
    fillColor: "#f6e8c3ff",
  },
  "hex.mer-3": {
    fillColor: "#d8b365ff",
  },
  "pen.mer-3": {
    fillColor: "#8c510aff",
  },
};

beforeEach(() => {
  project.activeLayer.removeChildren();
  view.draw();
});

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

test("lattice - hex ", () => {
  var face = new Hex(10).face(2, 1, opt);
  face.position = view.center;
  expect(project.exportSVG({ asString: true })).toEqual(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="100" viewBox="0,0,500,100"><g fill="none" f' +
      'ill-rule="nonzero" stroke="#000000" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset=' +
      '"0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><g><path d="M259.81981,54.72456l6.54654,7.5' +
      '5929l1.96396,-0.37796l-6.87386,-11.90588z" fill="#01665e"/><path d="M272.91288,69.84313l-4.58258,-7.93725l-1.96396,0.37796l-2.61861,7.55929z" fill="#5ab4ac"/><p' +
      'ath d="M250,30.15687l-4.58258,7.93725l1.30931,1.51186l7.85584,-1.51186z" fill="#5ab4ac"/><path d="M246.72673,39.60598l-3.27327,9.44911l6.54654,7.55929l9.81981,-' +
      '1.88982l1.63663,-4.72456l-6.87386,-11.90588z" fill="#01665e"/><path d="M259.81981,54.72456l-9.81981,1.88982l-3.27327,9.44911l3.27327,3.77964h13.74773l2.61861,-7' +
      '.55929z" fill="#01665e"/><path d="M243.45346,49.05509l3.27327,-9.44911l-1.30931,-1.51186l-6.87386,11.90588z" fill="#01665e"/><path d="M243.45346,49.05509l-4.909' +
      '9,0.94491l-6.87386,11.90588l5.23723,6.04743l9.81981,-1.88982l3.27327,-9.44911z" fill="#01665e"/><path d="M246.72673,66.06349l-9.81981,1.88982l-0.65465,1.88982h1' +
      '3.74773z" fill="#01665e"/><path d="M227.08712,69.84313h9.16515l0.65465,-1.88982l-5.23723,-6.04743z" fill="#5ab4ac"/></g></g></svg>'
  );
});

test("lattice - trihex ", () => {
  var face = new TriHex(10).face(2, 1, opt);
  face.position = view.center;
  expect(project.exportSVG({ asString: true })).toEqual(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="100" viewBox="0,0,500,100"><g fill="none" f' +
      'ill-rule="nonzero" stroke="#000000" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset=' +
      '"0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><g><path d="M251.88982,36.90693l4.72456,1.63663l-2.20479,-3' +
      '.81881z" fill="#c7eae5"/><path d="M263.22876,50l-7.55929,6.54654l9.44911,3.27327z" id="mer-2 1 1 1" fill="#c7eae5"/><path d="M265.11858,59.81981l1.88982,9.81981' +
      'l5.03953,-4.36436l-2.20479,-3.81881z" fill="#c7eae5"/><path d="M265.11858,59.81981l4.72456,1.63663l-6.61438,-11.45644z" fill="#01665e"/><path d="M265.11858,59.8' +
      '1981l1.88982,9.81981l5.03953,-4.36436l-2.20479,-3.81881z" fill="#f6e8c3"/><path d="M267.0084,69.63961l-3.77964,3.27327h4.40959z" fill="#f6e8c3"/><path d="M276.4' +
      '5751,72.91288l-4.40959,-7.63763l-5.03953,4.36436l0.62994,3.27327z" fill="#5ab4ac"/><path d="M244.33053,43.45346l7.55929,-6.54654l-6.29941,-2.18218l-2.20479,3.81' +
      '881z" fill="#f6e8c3"/><path d="M251.88982,36.90693l4.72456,1.63663l-2.20479,-3.81881z" fill="#f6e8c3"/><path d="M250,27.08712l-4.40959,7.63763l6.29941,2.18218l2' +
      '.51976,-2.18218z" fill="#5ab4ac"/><path d="M251.88982,36.90693l-6.29941,-2.18218l-2.20479,3.81881l0.94491,4.9099z" fill="#c7eae5"/><path d="M244.33053,43.45346l' +
      '-7.55929,6.54654l9.44911,3.27327z" id="mer-2 1 1 1" fill="#c7eae5"/><path d="M246.22036,53.27327l1.88982,9.81981l7.55929,-6.54654z" id="mer-2 2 1 1" fill="#c7ea' +
      'e5"/><path d="M255.66947,56.54654l9.44911,3.27327l-1.88982,-9.81981z" id="mer-2 3 1 1" fill="#c7eae5"/><path d="M251.88982,36.90693l4.72456,1.63663l-2.20479,-3.' +
      '81881z" fill="#c7eae5"/><path d="M251.88982,36.90693l-7.55929,6.54654l1.88982,9.81981l9.44911,3.27327l7.55929,-6.54654l-6.61438,-11.45644z" fill="#01665e"/><pat' +
      'h d="M255.66947,56.54654l-9.44911,-3.27327l1.88982,9.81981z" id="mer-2 6 1" fill="#c7eae5"/><path d="M248.11018,63.09307l-7.55929,6.54654l9.44911,3.27327z" id="' +
      'mer-2 1 1 1" fill="#c7eae5"/><path d="M267.0084,69.63961l-3.77964,3.27327h4.40959z" fill="#c7eae5"/><path d="M267.0084,69.63961l5.03953,-4.36436l-2.20479,-3.818' +
      '81l-4.72456,-1.63663z" fill="#c7eae5"/><path d="M265.11858,59.81981l-1.88982,-9.81981l-7.55929,6.54654z" id="mer-2 5 1 1" fill="#c7eae5"/><path d="M255.66947,56' +
      '.54654l-7.55929,6.54654l1.88982,9.81981l13.22876,0l3.77964,-3.27327l-1.88982,-9.81981z" fill="#01665e"/><path d="M267.0084,69.63961l-3.77964,3.27327h4.40959z" f' +
      'ill="#c7eae5"/><path d="M236.77124,50l9.44911,3.27327l-1.88982,-9.81981z" id="mer-2 3 1 1" fill="#c7eae5"/><path d="M244.33053,43.45346l7.55929,-6.54654l-6.2994' +
      '1,-2.18218l-2.20479,3.81881z" fill="#c7eae5"/><path d="M244.33053,43.45346l-0.94491,-4.9099l-6.61438,11.45644z" fill="#01665e"/><path d="M231.10178,66.36634l-0.' +
      '94491,-4.9099l-2.20479,3.81881z" fill="#c7eae5"/><path d="M231.10178,66.36634l1.25988,6.54654h4.40959l3.77964,-3.27327z" fill="#c7eae5"/><path d="M240.55089,69.' +
      '63961l9.44911,3.27327l-1.88982,-9.81981z" id="mer-2 3 1 1" fill="#c7eae5"/><path d="M248.11018,63.09307l7.55929,-6.54654l-9.44911,-3.27327z" id="mer-2 4 1 1" fi' +
      'll="#c7eae5"/><path d="M246.22036,53.27327l-1.88982,-9.81981l-7.55929,6.54654z" id="mer-2 5 1 1" fill="#c7eae5"/><path d="M231.10178,66.36634l9.44911,3.27327l7.' +
      '55929,-6.54654l-1.88982,-9.81981l-9.44911,-3.27327l-6.61438,11.45644z" fill="#01665e"/><path d="M240.55089,69.63961l-9.44911,-3.27327l1.25988,6.54654h4.40959z" ' +
      'fill="#c7eae5"/><path d="M250,72.91288l-1.88982,-9.81981l-7.55929,6.54654z" id="mer-2 5 1 1" fill="#c7eae5"/><path d="M240.55089,69.63961l-3.77964,3.27327l13.22' +
      '876,0z" fill="#01665e"/><path d="M231.10178,66.36634l-0.94491,-4.9099l-2.20479,3.81881z" fill="#c7eae5"/><path d="M240.55089,69.63961l-9.44911,-3.27327l1.25988,' +
      '6.54654l4.40959,0z" fill="#f6e8c3"/><path d="M231.10178,66.36634l-0.94491,-4.9099l-2.20479,3.81881z" fill="#f6e8c3"/><path d="M223.54249,72.91288h8.81917l-1.259' +
      '88,-6.54654l-3.1497,-1.09109z" fill="#5ab4ac"/></g></g></svg>'
  );
});

test("lattice - snubhex ", () => {
  var face = new SnubHex(10).face(2, 1, opt);
  face.position = view.center;
  expect(project.exportSVG({ asString: true })).toEqual(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="100" viewBox="0,0,500,100"><g fill="none" f' +
      'ill-rule="nonzero" stroke="#000000" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset=' +
      '"0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><g><path d="M256.42857,35.77244l5.2381,4.12393l-2.91667,-5.05181z" fill="#c7eae5"/><path d=' +
      '"M256.42857,35.77244l2.32143,-0.92788l-1.75,-3.03109z" fill="#c7eae5"/><path d="M277.14286,74.12499l3.48214,-1.39183l-2.625,-4.54663z" fill="#c7eae5"/><path d="' +
      'M269.28571,67.9391l7.85714,6.1859l0.85714,-5.93846l-1.75,-3.03109z" fill="#c7eae5"/><path d="M270.71429,58.04166l-1.42857,9.89743l6.96429,-2.78365l-2.91667,-5.0' +
      '5181z" fill="#c7eae5"/><path d="M269.28571,67.9391l1.42857,-9.89743l-9.28571,3.71154z" id="mer-2 9 1 1" fill="#c7eae5"/><path d="M261.42857,61.7532l9.28571,-3.7' +
      '1154l-7.85714,-6.1859z" id="mer-2 10 1 1" fill="#c7eae5"/><path d="M262.85714,51.85577l7.85714,6.1859l0.28571,-1.97949l-3.5,-6.06218z" fill="#c7eae5"/><path d="' +
      'M262.85714,51.85577l4.64286,-1.85577l-3.5,-6.06218z" fill="#c7eae5"/><path d="M270.71429,58.04166l2.61905,2.06197l-2.33333,-4.04145z" fill="#01665e"/><path d="M' +
      '277.14286,74.12499l3.48214,-1.39183l-2.625,-4.54663z" fill="#f6e8c3"/><path d="M267.85714,77.83653l-0.35714,2.47436h3.5z" fill="#f6e8c3"/><path d="M267.85714,77' +
      '.83653l3.14286,2.47436l5.25,0l0.89286,-6.1859z" fill="#f6e8c3"/><path d="M269.28571,67.9391l7.85714,6.1859l0.85714,-5.93846l-1.75,-3.03109z" fill="#f6e8c3"/><pa' +
      'th d="M269.28571,67.9391l-1.42857,9.89743l9.28571,-3.71154z" id="mer-2 13 1 1" fill="#f6e8c3"/><path d="M285,80.31089l-4.375,-7.57772l-3.48214,1.39183l-0.89286,' +
      '6.1859z" fill="#5ab4ac"/><path d="M256.42857,35.77244l2.32143,-0.92788l-1.75,-3.03109z" fill="#f6e8c3"/><path d="M248.57143,29.58654l7.85714,6.1859l0.57143,-3.9' +
      '5897l-2.625,-4.54663z" fill="#f6e8c3"/><path d="M248.57143,29.58654l-1.42857,9.89743l9.28571,-3.71154z" id="mer-2 7 1 1" fill="#f6e8c3"/><path d="M248.57143,29.' +
      '58654l-5.57143,2.22692l-1.75,3.03109l5.89286,4.63942z" fill="#f6e8c3"/><path d="M248.57143,29.58654l-2.94643,-2.31971l-2.625,4.54663z" fill="#f6e8c3"/><path d="' +
      'M250,19.68911l-4.375,7.57772l2.94643,2.31971l5.80357,-2.31971z" fill="#5ab4ac"/><path d="M256.42857,35.77244l-7.85714,-6.1859l-1.42857,9.89743z" id="mer-2 14 1"' +
      ' fill="#c7eae5"/><path d="M256.42857,35.77244l0.57143,-3.95897l-2.625,-4.54663l-5.80357,2.31971z" fill="#c7eae5"/><path d="M256.42857,35.77244l2.32143,-0.92788l' +
      '-1.75,-3.03109z" fill="#c7eae5"/><path d="M256.42857,35.77244l5.2381,4.12393l-2.91667,-5.05181z" fill="#c7eae5"/><path d="M262.85714,51.85577l4.64286,-1.85577l-' +
      '3.5,-6.06218z" fill="#c7eae5"/><path d="M270.71429,58.04166l0.28571,-1.97949l-3.5,-6.06218l-4.64286,1.85577z" fill="#c7eae5"/><path d="M261.42857,61.7532l9.2857' +
      '1,-3.71154l-7.85714,-6.1859z" id="mer-2 6 1 1" fill="#c7eae5"/><path d="M253.57143,55.56731l7.85714,6.1859l1.42857,-9.89743z" id="mer-2 14 1" fill="#c7eae5"/><p' +
      'ath d="M253.57143,55.56731l-1.42857,9.89743l9.28571,-3.71154z" id="mer-2 7 1 1" fill="#c7eae5"/><path d="M253.57143,55.56731l-9.28571,3.71154l7.85714,6.1859z" i' +
      'd="mer-2 8 1 1" fill="#c7eae5"/><path d="M253.57143,55.56731l-7.85714,-6.1859l-1.42857,9.89743z" id="mer-2 14 1" fill="#c7eae5"/><path d="M244.28571,59.27884l1.' +
      '42857,-9.89743l-9.28571,3.71154z" id="mer-2 9 1 1" fill="#c7eae5"/><path d="M236.42857,53.09295l9.28571,-3.71154l-7.85714,-6.1859z" id="mer-2 10 1 1" fill="#c7e' +
      'ae5"/><path d="M237.85714,43.19551l7.85714,6.1859l1.42857,-9.89743z" id="mer-2 11 1 1" fill="#c7eae5"/><path d="M248.57143,29.58654l-5.57143,2.22692l-1.75,3.031' +
      '09l5.89286,4.63942z" fill="#c7eae5"/><path d="M237.85714,43.19551l9.28571,-3.71154l-5.89286,-4.63942l-2.91667,5.05181z" fill="#c7eae5"/><path d="M256.42857,35.7' +
      '7244l-9.28571,3.71154l-1.42857,9.89743l7.85714,6.1859l9.28571,-3.71154l1.14286,-7.91795l-2.33333,-4.04145z" fill="#01665e"/><path d="M261.42857,61.7532l-7.85714' +
      ',-6.1859l-1.42857,9.89743z" id="mer-2 14 1" fill="#c7eae5"/><path d="M261.42857,61.7532l1.42857,-9.89743l-9.28571,3.71154z" id="mer-2 1 1 1" fill="#c7eae5"/><pa' +
      'th d="M261.42857,61.7532l9.28571,-3.71154l-7.85714,-6.1859z" id="mer-2 2 1 1" fill="#c7eae5"/><path d="M261.42857,61.7532l7.85714,6.1859l1.42857,-9.89743z" id="' +
      'mer-2 14 1" fill="#c7eae5"/><path d="M270.71429,58.04166l-1.42857,9.89743l6.96429,-2.78365l-2.91667,-5.05181z" fill="#c7eae5"/><path d="M269.28571,67.9391l7.857' +
      '14,6.1859l0.85714,-5.93846l-1.75,-3.03109z" fill="#c7eae5"/><path d="M277.14286,74.12499l-7.85714,-6.1859l-1.42857,9.89743z" id="mer-2 14 1" fill="#c7eae5"/><pa' +
      'th d="M277.14286,74.12499l-9.28571,3.71154l3.14286,2.47436l5.25,0z" fill="#c7eae5"/><path d="M267.85714,77.83653l-0.35714,2.47436h3.5z" fill="#c7eae5"/><path d=' +
      '"M267.85714,77.83653l-6.19048,2.47436h5.83333z" fill="#c7eae5"/><path d="M250.71429,75.36217l-0.71429,4.94872l7,0z" fill="#c7eae5"/><path d="M250.71429,75.36217' +
      'l-9.28571,3.71154l1.57143,1.23718l7,0z" fill="#c7eae5"/><path d="M241.42857,79.07371l9.28571,-3.71154l-7.85714,-6.1859z" id="mer-2 10 1 1" fill="#c7eae5"/><path' +
      ' d="M242.85714,69.17628l7.85714,6.1859l1.42857,-9.89743z" id="mer-2 11 1 1" fill="#c7eae5"/><path d="M253.57143,55.56731l-9.28571,3.71154l7.85714,6.1859z" id="m' +
      'er-2 12 1 1" fill="#c7eae5"/><path d="M244.28571,59.27884l-1.42857,9.89743l9.28571,-3.71154z" id="mer-2 13 1 1" fill="#c7eae5"/><path d="M261.42857,61.7532l-9.2' +
      '8571,3.71154l-1.42857,9.89743l6.28571,4.94872l4.66667,0l6.19048,-2.47436l1.42857,-9.89743z" fill="#01665e"/><path d="M267.85714,77.83653l-6.19048,2.47436h5.8333' +
      '3z" fill="#c7eae5"/><path d="M267.85714,77.83653l-0.35714,2.47436h3.5z" fill="#c7eae5"/><path d="M248.57143,29.58654l-2.94643,-2.31971l-2.625,4.54663z" fill="#c' +
      '7eae5"/><path d="M248.57143,29.58654l-5.57143,2.22692l-1.75,3.03109l5.89286,4.63942z" fill="#c7eae5"/><path d="M247.14286,39.48398l-5.89286,-4.63942l-2.91667,5.' +
      '05181l-0.47619,3.29914z" fill="#c7eae5"/><path d="M245.71429,49.38141l1.42857,-9.89743l-9.28571,3.71154z" id="mer-2 5 1 1" fill="#c7eae5"/><path d="M236.42857,5' +
      '3.09295l9.28571,-3.71154l-7.85714,-6.1859z" id="mer-2 6 1 1" fill="#c7eae5"/><path d="M236.42857,53.09295l1.42857,-9.89743l-1.85714,0.74231l-3.5,6.06218z" fill=' +
      '"#c7eae5"/><path d="M236.42857,53.09295l-3.92857,-3.09295l-3.5,6.06218z" fill="#c7eae5"/><path d="M237.85714,43.19551l0.47619,-3.29914l-2.33333,4.04145z" fill="' +
      '#01665e"/><path d="M236.42857,53.09295l-3.92857,-3.09295l-3.5,6.06218z" fill="#c7eae5"/><path d="M236.42857,53.09295l1.42857,-9.89743l-1.85714,0.74231l-3.5,6.06' +
      '218z" fill="#c7eae5"/><path d="M236.42857,53.09295l9.28571,-3.71154l-7.85714,-6.1859z" id="mer-2 2 1 1" fill="#c7eae5"/><path d="M236.42857,53.09295l7.85714,6.1' +
      '859l1.42857,-9.89743z" id="mer-2 14 1" fill="#c7eae5"/><path d="M245.71429,49.38141l-1.42857,9.89743l9.28571,-3.71154z" id="mer-2 3 1 1" fill="#c7eae5"/><path d' +
      '="M253.57143,55.56731l-9.28571,3.71154l7.85714,6.1859z" id="mer-2 4 1 1" fill="#c7eae5"/><path d="M252.14286,65.46474l-7.85714,-6.1859l-1.42857,9.89743z" id="me' +
      'r-2 14 1" fill="#c7eae5"/><path d="M250.71429,75.36217l1.42857,-9.89743l-9.28571,3.71154z" id="mer-2 5 1 1" fill="#c7eae5"/><path d="M241.42857,79.07371l9.28571' +
      ',-3.71154l-7.85714,-6.1859z" id="mer-2 6 1 1" fill="#c7eae5"/><path d="M233.57143,72.88781l7.85714,6.1859l1.42857,-9.89743z" id="mer-2 14 1" fill="#c7eae5"/><pa' +
      'th d="M233.57143,72.88781l-1.07143,7.42307h5.83333l3.09524,-1.23718z" fill="#c7eae5"/><path d="M233.57143,72.88781l-9.28571,3.71154l4.71429,3.71154l3.5,0z" fill' +
      '="#c7eae5"/><path d="M233.57143,72.88781l-7.85714,-6.1859l-1.42857,9.89743z" id="mer-2 14 1" fill="#c7eae5"/><path d="M224.28571,76.59935l1.42857,-9.89743l-3.71' +
      '429,1.48461l-2.625,4.54663z" fill="#c7eae5"/><path d="M225.71429,66.70192l-1.96429,-1.54647l-1.75,3.03109z" fill="#c7eae5"/><path d="M225.71429,66.70192l0.95238' +
      ',-6.59829l-2.91667,5.05181z" fill="#c7eae5"/><path d="M236.42857,53.09295l-7.42857,2.96923l-2.33333,4.04145l-0.95238,6.59829l7.85714,6.1859l9.28571,-3.71154l1.4' +
      '2857,-9.89743z" fill="#01665e"/><path d="M241.42857,79.07371l-7.85714,-6.1859l-1.07143,7.42307h5.83333z" fill="#c7eae5"/><path d="M241.42857,79.07371l1.42857,-9' +
      '.89743l-9.28571,3.71154z" id="mer-2 1 1 1" fill="#c7eae5"/><path d="M241.42857,79.07371l9.28571,-3.71154l-7.85714,-6.1859z" id="mer-2 2 1 1" fill="#c7eae5"/><pa' +
      'th d="M241.42857,79.07371l1.57143,1.23718h7l0.71429,-4.94872z" fill="#c7eae5"/><path d="M250.71429,75.36217l-0.71429,4.94872h7z" fill="#c7eae5"/><path d="M233.5' +
      '7143,72.88781l-9.28571,3.71154l4.71429,3.71154h3.5z" fill="#c7eae5"/><path d="M224.28571,76.59935l-0.53571,3.71154h5.25z" fill="#c7eae5"/><path d="M241.42857,79' +
      '.07371l-3.09524,1.23718h4.66667z" fill="#01665e"/><path d="M225.71429,66.70192l0.95238,-6.59829l-2.91667,5.05181z" fill="#c7eae5"/><path d="M225.71429,66.70192l' +
      '-1.96429,-1.54647l-1.75,3.03109z" fill="#c7eae5"/><path d="M225.71429,66.70192l-1.96429,-1.54647l-1.75,3.03109z" fill="#f6e8c3"/><path d="M224.28571,76.59935l1.' +
      '42857,-9.89743l-3.71429,1.48461l-2.625,4.54663z" fill="#f6e8c3"/><path d="M225.71429,66.70192l-1.42857,9.89743l9.28571,-3.71154z" id="mer-2 3 1 1" fill="#f6e8c3' +
      '"/><path d="M233.57143,72.88781l-9.28571,3.71154l4.71429,3.71154l3.5,0z" fill="#f6e8c3"/><path d="M224.28571,76.59935l-0.53571,3.71154l5.25,0z" fill="#f6e8c3"/>' +
      '<path d="M215,80.31089l8.75,0l0.53571,-3.71154l-4.91071,-3.86618z" fill="#5ab4ac"/></g></g></svg>'
  );
});

test("lattice - rhombitrihex ", () => {
  var face = new RhombiTriHex(10).face(2, 1, opt);
  face.position = view.center;
  expect(project.exportSVG({ asString: true })).toEqual(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="100" viewBox="0,0,500,100"><g fill="none" f' +
      'ill-rule="nonzero" stroke="#000000" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset=' +
      '"0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><g><path d="M258.43636,36.07952l4.7924,5.53378l-3.72742,-6.' +
      '45608z" fill="#d8b365"/><path d="M258.43636,36.07952l1.06498,-0.9223l-1.86371,-3.22804z" fill="#c7eae5"/><path d="M261.70963,53.08792l9.44911,3.27327l0.21927,-0' +
      '.63297l-6.61438,-11.45644z" fill="#d8b365"/><path d="M263.59945,62.90773l6.54654,7.55929l6.49431,-5.62424l-3.72742,-6.45608l-1.75414,-2.02551z" fill="#d8b365"/>' +
      '<path d="M279.5951,73.74028l1.96396,-0.37796l-3.05505,-5.2915z" fill="#d8b365"/><path d="M263.59945,62.90773l7.55929,-6.54654l-9.44911,-3.27327z" id="mer-2 4 1 ' +
      '1" fill="#c7eae5"/><path d="M279.5951,73.74028l-1.09109,-5.66947l-1.86371,-3.22804l-6.49431,5.62424z" fill="#c7eae5"/><path d="M271.15874,56.36119l1.75414,2.025' +
      '51l-1.53487,-2.65848z" fill="#01665e"/><path d="M279.5951,73.74028l1.96396,-0.37796l-3.05505,-5.2915z" fill="#8c510a"/><path d="M270.14599,70.46702l-3.27327,9.4' +
      '4911l3.99366,1.38345h6.1101l2.61861,-7.55929z" fill="#8c510a"/><path d="M270.14599,70.46702l9.44911,3.27327l-1.09109,-5.66947l-1.86371,-3.22804z" fill="#f6e8c3"' +
      '/><path d="M266.87272,79.91613l0.26624,1.38345h3.72742z" fill="#f6e8c3"/><path d="M286.14164,81.29957l-4.58258,-7.93725l-1.96396,0.37796l-2.61861,7.55929z" fill' +
      '="#5ab4ac"/><path d="M246.72673,28.14954l-1.30931,-1.51186l-3.05505,5.2915z" fill="#8c510a"/><path d="M248.61655,37.96934l9.81981,-1.88982l-0.79873,-4.15034l-3.' +
      '05505,-5.2915l-7.85584,1.51186z" fill="#8c510a"/><path d="M258.43636,36.07952l1.06498,-0.9223l-1.86371,-3.22804z" fill="#f6e8c3"/><path d="M248.61655,37.96934l-' +
      '1.88982,-9.81981l-4.36436,3.77964l-1.86371,3.22804z" fill="#f6e8c3"/><path d="M250,18.70043l-4.58258,7.93725l1.30931,1.51186l7.85584,-1.51186z" fill="#5ab4ac"/>' +
      '<path d="M258.43636,36.07952l4.7924,5.53378l-3.72742,-6.45608z" fill="#d8b365"/><path d="M246.72673,28.14954l1.88982,9.81981l9.81981,-1.88982l-0.79873,-4.15034l' +
      '-3.05505,-5.2915z" fill="#d8b365"/><path d="M235.89417,44.14519l9.44911,3.27327l3.27327,-9.44911l-8.11789,-2.81212l-3.72742,6.45608z" fill="#d8b365"/><path d="M' +
      '237.784,53.96499l6.54654,7.55929l7.55929,-6.54654l-6.54654,-7.55929z" id="mer-3 3 1 1" fill="#d8b365"/><path d="M253.77964,64.79755l9.81981,-1.88982l-1.88982,-9' +
      '.81981l-9.81981,1.88982z" id="mer-3 4 1 1" fill="#d8b365"/><path d="M271.15874,56.36119l0.21927,-0.63297l-6.61438,-11.45644l-3.054,8.81614z" fill="#d8b365"/><pa' +
      'th d="M271.15874,56.36119l-9.44911,-3.27327l1.88982,9.81981z" id="mer-2 6 1" fill="#c7eae5"/><path d="M258.43636,36.07952l1.06498,-0.9223l-1.86371,-3.22804z" fi' +
      'll="#c7eae5"/><path d="M248.61655,37.96934l-1.88982,-9.81981l-4.36436,3.77964l-1.86371,3.22804z" fill="#c7eae5"/><path d="M237.784,53.96499l7.55929,-6.54654l-9.' +
      '44911,-3.27327z" id="mer-2 4 1 1" fill="#c7eae5"/><path d="M253.77964,64.79755l-1.88982,-9.81981l-7.55929,6.54654z" id="mer-2 5 1 1" fill="#c7eae5"/><path d="M2' +
      '58.43636,36.07952l-9.81981,1.88982l-3.27327,9.44911l6.54654,7.55929l9.81981,-1.88982l3.054,-8.81614l-1.53487,-2.65848z" fill="#01665e"/><path d="M271.15874,56.3' +
      '6119l-7.55929,6.54654l6.54654,7.55929l6.49431,-5.62424l-3.72742,-6.45608z" fill="#d8b365"/><path d="M261.70963,53.08792l-9.81981,1.88982l1.88982,9.81981l9.81981' +
      ',-1.88982z" id="mer-3 1 1 1" fill="#d8b365"/><path d="M244.33053,61.52428l-3.27327,9.44911l9.44911,3.27327l3.27327,-9.44911z" id="mer-3 2 1 1" fill="#d8b365"/><' +
      'path d="M242.94709,80.7932l0.43853,0.50638h13.22876l-6.108,-7.05291z" fill="#d8b365"/><path d="M266.87272,79.91613l-7.1886,1.38345l7.45484,0z" fill="#d8b365"/><' +
      'path d="M279.5951,73.74028l-9.44911,-3.27327l-3.27327,9.44911l3.99366,1.38345h6.1101z" fill="#d8b365"/><path d="M266.87272,79.91613l0.26624,1.38345l3.72742,0z" ' +
      'fill="#c7eae5"/><path d="M270.14599,70.46702l9.44911,3.27327l-1.09109,-5.66947l-1.86371,-3.22804z" fill="#c7eae5"/><path d="M261.70963,53.08792l1.88982,9.81981l' +
      '7.55929,-6.54654z" id="mer-2 2 1 1" fill="#c7eae5"/><path d="M244.33053,61.52428l9.44911,3.27327l-1.88982,-9.81981z" id="mer-2 3 1 1" fill="#c7eae5"/><path d="M' +
      '242.94709,80.7932l7.55929,-6.54654l-9.44911,-3.27327z" id="mer-2 4 1 1" fill="#c7eae5"/><path d="M263.59945,62.90773l-9.81981,1.88982l-3.27327,9.44911l6.108,7.0' +
      '5291h3.06974l7.1886,-1.38345l3.27327,-9.44911z" fill="#01665e"/><path d="M266.87272,79.91613l-7.1886,1.38345h7.45484z" fill="#d8b365"/><path d="M266.87272,79.91' +
      '613l0.26624,1.38345h3.72742z" fill="#c7eae5"/><path d="M246.72673,28.14954l-1.30931,-1.51186l-3.05505,5.2915z" fill="#d8b365"/><path d="M237.784,53.96499l-1.889' +
      '82,-9.81981l-0.6578,0.12659l-6.61438,11.45644z" fill="#d8b365"/><path d="M245.34329,47.41845l3.27327,-9.44911l-8.11789,-2.81212l-3.72742,6.45608l-0.87707,2.5318' +
      '8z" fill="#d8b365"/><path d="M245.34329,47.41845l-9.44911,-3.27327l1.88982,9.81981z" id="mer-2 6 1" fill="#c7eae5"/><path d="M246.72673,28.14954l-4.36436,3.7796' +
      '4l-1.86371,3.22804l8.11789,2.81212z" fill="#c7eae5"/><path d="M235.89417,44.14519l0.87707,-2.53188l-1.53487,2.65848z" fill="#01665e"/><path d="M251.88982,54.977' +
      '74l-6.54654,-7.55929l-7.55929,6.54654l6.54654,7.55929z" id="mer-3 6 1" fill="#d8b365"/><path d="M235.89417,44.14519l-0.6578,0.12659l-6.61438,11.45644l9.162,-1.7' +
      '6323z" fill="#d8b365"/><path d="M224.69092,65.30393l2.3962,-6.91723l-3.72742,6.45608z" fill="#d8b365"/><path d="M223.67817,79.40975l7.55929,-6.54654l-6.54654,-7' +
      '.55929l-3.19493,2.76689l-3.05505,5.2915z" fill="#d8b365"/><path d="M242.94709,80.7932l-1.88982,-9.81981l-9.81981,1.88982l1.62358,8.43636h7.45484z" fill="#d8b365' +
      '"/><path d="M250.50638,74.24666l3.27327,-9.44911l-9.44911,-3.27327l-3.27327,9.44911z" id="mer-3 5 1 1" fill="#d8b365"/><path d="M250.50638,74.24666l-9.44911,-3.' +
      '27327l1.88982,9.81981z" id="mer-2 6 1" fill="#c7eae5"/><path d="M251.88982,54.97774l-7.55929,6.54654l9.44911,3.27327z" id="mer-2 1 1 1" fill="#c7eae5"/><path d=' +
      '"M235.89417,44.14519l1.88982,9.81981l7.55929,-6.54654z" id="mer-2 2 1 1" fill="#c7eae5"/><path d="M224.69092,65.30393l-1.33122,-0.46115l-1.86371,3.22804z" fill=' +
      '"#c7eae5"/><path d="M231.23746,72.86321l-7.55929,6.54654l5.45545,1.88982h3.72742z" fill="#c7eae5"/><path d="M237.784,53.96499l-9.162,1.76323l-1.53487,2.65848l-2' +
      '.3962,6.91723l6.54654,7.55929l9.81981,-1.88982l3.27327,-9.44911z" fill="#01665e"/><path d="M250.50638,74.24666l-7.55929,6.54654l0.43853,0.50638h13.22876z" fill=' +
      '"#d8b365"/><path d="M241.05726,70.97339l-9.81981,1.88982l1.62358,8.43636h7.45484l2.63121,-0.50638z" fill="#d8b365"/><path d="M223.67817,79.40975l-0.65465,1.8898' +
      '2l6.1101,0z" fill="#d8b365"/><path d="M241.05726,70.97339l1.88982,9.81981l7.55929,-6.54654z" id="mer-2 2 1 1" fill="#c7eae5"/><path d="M223.67817,79.40975l5.455' +
      '45,1.88982l3.72742,0l-1.62358,-8.43636z" fill="#c7eae5"/><path d="M242.94709,80.7932l-2.63121,0.50638l3.06974,0z" fill="#01665e"/><path d="M224.69092,65.30393l2' +
      '.3962,-6.91723l-3.72742,6.45608z" fill="#d8b365"/><path d="M224.69092,65.30393l-1.33122,-0.46115l-1.86371,3.22804z" fill="#c7eae5"/><path d="M231.23746,72.86321' +
      'l-6.54654,-7.55929l-3.19493,2.76689l-3.05505,5.2915l5.23723,6.04743z" fill="#8c510a"/><path d="M223.67817,79.40975l-0.65465,1.88982l6.1101,0z" fill="#8c510a"/><' +
      'path d="M231.23746,72.86321l-7.55929,6.54654l5.45545,1.88982l3.72742,0z" fill="#f6e8c3"/><path d="M224.69092,65.30393l-1.33122,-0.46115l-1.86371,3.22804z" fill=' +
      '"#f6e8c3"/><path d="M213.85836,81.29957h9.16515l0.65465,-1.88982l-5.23723,-6.04743z" fill="#5ab4ac"/></g></g></svg>'
  );
});

test("lattice - dualtrihex ", () => {
  var face = new DualTriHex(10).face(2, 1, opt);
  face.position = view.center;
  expect(project.exportSVG({ asString: true })).toEqual(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="100" viewBox="0,0,500,100"><g fill="none" f' +
      'ill-rule="nonzero" stroke="#000000" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset=' +
      '"0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><g><path d=' +
      '"M280.23716,69.63961l6.80336,-1.30931l-3.96863,-6.87386z" fill="#01665e"/><path d="M280.23716,69.63961l7.55929,8.72872l4.53557,-0.87287l-5.2915,-9.16515z" fill=' +
      '"#c7eae5"/><path d="M272.67787,60.91089l7.55929,8.72872l2.83473,-8.18317l-6.61438,-11.45644z" fill="#c7eae5"/><path d="M295.35574,87.09704l7.55929,8.72872l-6.61' +
      '438,-11.45644z" fill="#5ab4ac"/><path d="M295.35574,87.09704l-11.33893,2.18218l5.66947,6.54654h13.22876z" fill="#5ab4ac"/><path d="M295.35574,87.09704l0.94491,-' +
      '2.72772l-3.96863,-6.87386l-4.53557,0.87287l-3.77964,10.91089z" fill="#f6e8c3"/><path d="M284.0168,89.27922l-2.26779,6.54654h7.93725z" fill="#f6e8c3"/><path d="M' +
      '246.22036,15.08514l7.55929,8.72872l2.83473,-8.18317l-6.61438,-11.45644z" fill="#5ab4ac"/><path d="M246.22036,15.08514l3.77964,-10.91089l-6.61438,11.45644z" fill' +
      '="#5ab4ac"/><path d="M253.77964,23.81385l6.80336,-1.30931l-3.96863,-6.87386z" fill="#f6e8c3"/><path d="M246.22036,15.08514l-2.83473,0.54554l-3.96863,6.87386l3.0' +
      '2372,3.49149l11.33893,-2.18218z" fill="#f6e8c3"/><path d="M261.33893,32.54257l-7.55929,-8.72872l-3.77964,10.91089l7.55929,8.72872z" id="mer-1 6 1" fill="#01665e' +
      '"/><path d="M268.89822,41.27128l0.94491,-2.72772l-3.96863,-6.87386l-4.53557,0.87287l-3.77964,10.91089z" fill="#01665e"/><path d="M265.11858,52.18218l11.33893,-2' +
      '.18218l-7.55929,-8.72872l-11.33893,2.18218z" id="mer-1 2 1 1" fill="#01665e"/><path d="M253.77964,54.36436l7.55929,8.72872l3.77964,-10.91089l-7.55929,-8.72872z"' +
      ' id="mer-1 3 1 1" fill="#01665e"/><path d="M246.22036,45.63564l-3.77964,10.91089l11.33893,-2.18218l3.77964,-10.91089z" id="mer-1 4 1 1" fill="#01665e"/><path d=' +
      '"M250,34.72475l-11.33893,2.18218l7.55929,8.72872l11.33893,-2.18218z" id="mer-1 5 1 1" fill="#01665e"/><path d="M250,34.72475l3.77964,-10.91089l-11.33893,2.18218' +
      'l-3.77964,10.91089z" id="mer-2 1 1" fill="#c7eae5"/><path d="M253.77964,23.81385l7.55929,8.72872l4.53557,-0.87287l-5.2915,-9.16515z" fill="#c7eae5"/><path d="M2' +
      '68.89822,41.27128l7.55929,8.72872l-6.61438,-11.45644z" fill="#c7eae5"/><path d="M272.67787,60.91089l3.77964,-10.91089l-11.33893,2.18218l-3.77964,10.91089z" id="' +
      'mer-2 1 1" fill="#c7eae5"/><path d="M253.77964,54.36436l-11.33893,2.18218l7.55929,8.72872l11.33893,-2.18218z" id="mer-2 1 1" fill="#c7eae5"/><path d="M234.88142' +
      ',47.81782l7.55929,8.72872l3.77964,-10.91089l-7.55929,-8.72872z" id="mer-2 1 1" fill="#c7eae5"/><path d="M268.89822,71.82179l-7.55929,-8.72872l-3.77964,10.91089l' +
      '7.55929,8.72872z" id="mer-1 6 1" fill="#01665e"/><path d="M276.45751,80.5505l3.77964,-10.91089l-11.33893,2.18218l-3.77964,10.91089z" id="mer-1 1 1 1" fill="#016' +
      '65e"/><path d="M272.67787,91.4614l11.33893,-2.18218l-7.55929,-8.72872l-11.33893,2.18218z" id="mer-1 2 1 1" fill="#01665e"/><path d="M261.33893,93.64358l1.88982,' +
      '2.18218h7.93725l1.51186,-4.36436l-7.55929,-8.72872z" fill="#01665e"/><path d="M253.77964,84.91486l-3.77964,10.91089l11.33893,-2.18218l3.77964,-10.91089z" id="me' +
      'r-1 4 1 1" fill="#01665e"/><path d="M257.55929,74.00397l-11.33893,2.18218l7.55929,8.72872l11.33893,-2.18218z" id="mer-1 5 1 1" fill="#01665e"/><path d="M257.559' +
      '29,74.00397l3.77964,-10.91089l-11.33893,2.18218l-3.77964,10.91089z" id="mer-2 1 1" fill="#c7eae5"/><path d="M272.67787,60.91089l-11.33893,2.18218l7.55929,8.7287' +
      '2l11.33893,-2.18218z" id="mer-2 1 1" fill="#c7eae5"/><path d="M276.45751,80.5505l7.55929,8.72872l3.77964,-10.91089l-7.55929,-8.72872z" id="mer-2 1 1" fill="#c7e' +
      'ae5"/><path d="M284.0168,89.27922l-11.33893,2.18218l-1.51186,4.36436h10.58301z" fill="#c7eae5"/><path d="M261.33893,93.64358l-11.33893,2.18218h13.22876z" fill="' +
      '#c7eae5"/><path d="M242.44071,87.09704l7.55929,8.72872l3.77964,-10.91089l-7.55929,-8.72872z" id="mer-2 1 1" fill="#c7eae5"/><path d="M238.66107,36.90693l-4.5355' +
      '7,-5.23723l-3.96863,6.87386z" fill="#01665e"/><path d="M238.66107,36.90693l3.77964,-10.91089l-3.02372,-3.49149l-5.2915,9.16515z" fill="#c7eae5"/><path d="M234.8' +
      '8142,47.81782l3.77964,-10.91089l-8.5042,1.63663l-6.61438,11.45644z" fill="#c7eae5"/><path d="M231.10178,58.72872l-7.55929,-8.72872l-3.77964,10.91089l7.55929,8.7' +
      '2872z" id="mer-1 6 1" fill="#01665e"/><path d="M238.66107,67.45743l3.77964,-10.91089l-11.33893,2.18218l-3.77964,10.91089z" id="mer-1 1 1 1" fill="#01665e"/><pat' +
      'h d="M234.88142,78.36833l11.33893,-2.18218l-7.55929,-8.72872l-11.33893,2.18218z" id="mer-1 2 1 1" fill="#01665e"/><path d="M223.54249,80.5505l7.55929,8.72872l3.' +
      '77964,-10.91089l-7.55929,-8.72872z" id="mer-1 3 1 1" fill="#01665e"/><path d="M215.9832,71.82179l-3.77964,10.91089l11.33893,-2.18218l3.77964,-10.91089z" id="mer' +
      '-1 4 1 1" fill="#01665e"/><path d="M219.76284,60.91089l-2.83473,0.54554l-3.96863,6.87386l3.02372,3.49149l11.33893,-2.18218z" fill="#01665e"/><path d="M219.76284' +
      ',60.91089l3.77964,-10.91089l-6.61438,11.45644z" fill="#c7eae5"/><path d="M234.88142,47.81782l-11.33893,2.18218l7.55929,8.72872l11.33893,-2.18218z" id="mer-2 1 1' +
      '" fill="#c7eae5"/><path d="M238.66107,67.45743l7.55929,8.72872l3.77964,-10.91089l-7.55929,-8.72872z" id="mer-2 1 1" fill="#c7eae5"/><path d="M242.44071,87.09704' +
      'l3.77964,-10.91089l-11.33893,2.18218l-3.77964,10.91089z" id="mer-2 1 1" fill="#c7eae5"/><path d="M223.54249,80.5505l-11.33893,2.18218l7.55929,8.72872l11.33893,-' +
      '2.18218z" id="mer-2 1 1" fill="#c7eae5"/><path d="M212.20355,82.73268l3.77964,-10.91089l-3.02372,-3.49149l-5.2915,9.16515z" fill="#c7eae5"/><path d="M231.10178,' +
      '89.27922l-2.26779,6.54654l7.93725,0z" fill="#01665e"/><path d="M231.10178,89.27922l-11.33893,2.18218l-1.51186,4.36436h10.58301z" fill="#c7eae5"/><path d="M242.4' +
      '4071,87.09704l-11.33893,2.18218l5.66947,6.54654l13.22876,0z" fill="#c7eae5"/><path d="M208.42391,93.64358l3.77964,-10.91089l-8.5042,1.63663l-6.61438,11.45644z" ' +
      'fill="#5ab4ac"/><path d="M208.42391,93.64358l-11.33893,2.18218h13.22876z" fill="#5ab4ac"/><path d="M212.20355,82.73268l-4.53557,-5.23723l-3.96863,6.87386z" fill' +
      '="#f6e8c3"/><path d="M208.42391,93.64358l1.88982,2.18218h7.93725l1.51186,-4.36436l-7.55929,-8.72872z" fill="#f6e8c3"/></g></g></svg>'
  );
});

test("lattice - dualsnubhex ", () => {
  var face = new DualSnubHex(10).face(2, 1, opt);
  face.position = view.center;
  expect(project.exportSVG({ asString: true })).toEqual(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="100" viewBox="0,0,500,100"><g fill="none" f' +
      'ill-rule="nonzero" stroke="#000000" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset=' +
      '"0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><g><path d="M268.57143,52.68055l0.51948,0.07498l-1.59091,-2.75554z" fill="#01665e"/><path d="M268.57143,52.68055l-3.57143,4.53632l2.14286,5' +
      '.36111l5.71429,0.82479l1.37363,-1.74474l-5.13986,-8.9025z" fill="#01665e"/><path d="M272.85714,63.40277l2.14286,5.36111l3.63636,0.52486l-4.40559,-7.63071z" fill' +
      '="#01665e"/><path d="M275,68.76388l-3.57143,4.53632l2.14286,5.36111l11.42857,1.64957l-6.36364,-11.02214z" fill="#5ab4ac"/><path d="M273.57143,78.66132l-1.2987,1' +
      '.64957h12.72727z" fill="#5ab4ac"/><path d="M245,34.12287l5.71429,0.82479l3.57143,-4.53632l-4.28571,-10.72222l-6.36364,11.02214z" fill="#5ab4ac"/><path d="M254.2' +
      '8571,30.41133l2.07792,0.29992l-6.36364,-11.02214z" fill="#5ab4ac"/><path d="M255,45.66987l-4.28571,-10.72222l-5.71429,-0.82479l-3.57143,4.53632l2.14286,5.36111z' +
      '" id="mer-1 6 1" fill="#01665e"/><path d="M255,45.66987l-11.42857,-1.64957l-3.57143,4.53632l2.14286,5.36111l5.71429,0.82479z" id="mer-1 1 1 1" fill="#01665e"/><' +
      'path d="M255,45.66987l-7.14286,9.07265l2.14286,5.36111l5.71429,0.82479l3.57143,-4.53632z" id="mer-1 2 1 1" fill="#01665e"/><path d="M255,45.66987l4.28571,10.722' +
      '22l5.71429,0.82479l3.57143,-4.53632l-1.07143,-2.68055l-1.59091,-2.75554z" fill="#01665e"/><path d="M255,45.66987l10.90909,1.57459l-5.13986,-8.9025z" fill="#0166' +
      '5e"/><path d="M255,45.66987l5.76923,-7.32791l-4.40559,-7.63071l-2.07792,-0.29992l-3.57143,4.53632z" fill="#01665e"/><path d="M260,71.65064l-4.28571,-10.72222l-5' +
      '.71429,-0.82479l-3.57143,4.53632l2.14286,5.36111z" id="mer-1 6 1" fill="#01665e"/><path d="M260,71.65064l-11.42857,-1.64957l-3.57143,4.53632l2.14286,5.36111l2.8' +
      '5714,0.41239h3.18182z" fill="#01665e"/><path d="M260,71.65064l-6.81818,8.66025l10.27972,0z" fill="#01665e"/><path d="M260,71.65064l3.46154,8.66025h8.81119l1.298' +
      '7,-1.64957l-2.14286,-5.36111z" fill="#01665e"/><path d="M260,71.65064l11.42857,1.64957l3.57143,-4.53632l-2.14286,-5.36111l-5.71429,-0.82479z" id="mer-1 4 1 1" f' +
      'ill="#01665e"/><path d="M260,71.65064l7.14286,-9.07265l-2.14286,-5.36111l-5.71429,-0.82479l-3.57143,4.53632z" id="mer-1 5 1 1" fill="#01665e"/><path d="M234.285' +
      '71,47.73184l-0.19481,-0.48737l-1.59091,2.75554z" fill="#01665e"/><path d="M234.28571,47.73184l5.71429,0.82479l3.57143,-4.53632l-2.14286,-5.36111l-2.1978,-0.3172' +
      '3l-5.13986,8.9025z" fill="#01665e"/><path d="M241.42857,38.65919l3.57143,-4.53632l-1.36364,-3.41162l-4.40559,7.63071z" fill="#01665e"/><path d="M235,62.99038l-4' +
      '.09091,-10.23485l-5.13986,8.9025z" fill="#01665e"/><path d="M235,62.99038l-9.23077,-1.33235l-4.40559,7.63071l0.77922,1.94949l5.71429,0.82479z" fill="#01665e"/><' +
      'path d="M235,62.99038l-7.14286,9.07265l2.14286,5.36111l5.71429,0.82479l3.57143,-4.53632z" id="mer-1 2 1 1" fill="#01665e"/><path d="M235,62.99038l4.28571,10.722' +
      '22l5.71429,0.82479l3.57143,-4.53632l-2.14286,-5.36111z" id="mer-1 3 1 1" fill="#01665e"/><path d="M235,62.99038l11.42857,1.64957l3.57143,-4.53632l-2.14286,-5.36' +
      '111l-5.71429,-0.82479z" id="mer-1 4 1 1" fill="#01665e"/><path d="M235,62.99038l7.14286,-9.07265l-2.14286,-5.36111l-5.71429,-0.82479l-1.78571,2.26816l-1.59091,2' +
      '.75554z" fill="#01665e"/><path d="M235.71429,78.24892l-5.71429,-0.82479l-2.27273,2.88675h8.81119z" fill="#01665e"/><path d="M247.14286,79.8985l-0.32468,0.41239l' +
      '3.18182,0z" fill="#01665e"/><path d="M247.14286,79.8985l-2.14286,-5.36111l-5.71429,-0.82479l-3.57143,4.53632l0.82418,2.06197h10.27972z" fill="#01665e"/><path d=' +
      '"M230,77.42414l-2.14286,-5.36111l-5.71429,-0.82479l-7.14286,9.07265l12.72727,0z" fill="#5ab4ac"/><path d="M222.14286,71.23824l-0.77922,-1.94949l-6.36364,11.0221' +
      '4z" fill="#5ab4ac"/></g></g></svg>'
  );
});

test("lattice - dualrhombitrihex ", () => {
  var face = new DualRhombiTriHex(10).face(2, 1, opt);
  face.position = view.center;
  expect(project.exportSVG({ asString: true })).toEqual(
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="100" viewBox="0,0,500,100"><g fill="none" f' +
      'ill-rule="nonzero" stroke="#000000" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset=' +
      '"0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="no' +
      'ne"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" ' +
      'fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><pa' +
      'th d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><path d="" fill="none"/><g><path d="M259.81981,54.72456l3.27327,3.77964l2.18218,-1.88982l-3' +
      '.81881,-6.61438z" fill="#01665e"/><path d="M263.09307,58.5042l3.27327,3.77964l1.96396,-0.37796l-3.05505,-5.2915z" fill="#01665e"/><path d="M266.36634,62.28385l-' +
      '1.63663,4.72456l8.18317,2.83473l-4.58258,-7.93725z" fill="#5ab4ac"/><path d="M264.72971,67.0084l-0.98198,2.83473h9.16515z" fill="#5ab4ac"/><path d="M251.63663,3' +
      '8.66107l2.94594,-0.56695l-4.58258,-7.93725z" fill="#5ab4ac"/><path d="M246.72673,39.60598l4.9099,-0.94491l-1.63663,-8.5042l-4.58258,7.93725z" fill="#5ab4ac"/><p' +
      'ath d="M254.9099,55.66947l4.9099,-0.94491l1.63663,-4.72456l-8.18317,-2.83473z" id="mer-1 6 1" fill="#01665e"/><path d="M253.27327,47.16527l8.18317,2.83473l-3.81' +
      '881,-6.61438z" fill="#01665e"/><path d="M251.63663,38.66107l1.63663,8.5042l4.36436,-3.77964l-3.05505,-5.2915z" fill="#01665e"/><path d="M251.63663,38.66107l-4.9' +
      '099,0.94491l-1.63663,4.72456l8.18317,2.83473z" id="mer-1 3 1 1" fill="#01665e"/><path d="M245.0901,44.33053l-1.63663,4.72456l3.27327,3.77964l6.54654,-5.66947z" ' +
      'id="mer-1 4 1 1" fill="#01665e"/><path d="M246.72673,52.83473l3.27327,3.77964l4.9099,-0.94491l-1.63663,-8.5042z" id="mer-1 5 1 1" fill="#01665e"/><path d="M264.' +
      '72971,67.0084l-8.18317,-2.83473l1.09109,5.66947l6.1101,0z" fill="#01665e"/><path d="M264.72971,67.0084l1.63663,-4.72456l-3.27327,-3.77964l-6.54654,5.66947z" id=' +
      '"mer-1 1 1 1" fill="#01665e"/><path d="M263.09307,58.5042l-3.27327,-3.77964l-4.9099,0.94491l1.63663,8.5042z" id="mer-1 2 1 1" fill="#01665e"/><path d="M254.9099' +
      ',55.66947l-4.9099,0.94491l-1.63663,4.72456l8.18317,2.83473z" id="mer-1 3 1 1" fill="#01665e"/><path d="M248.36337,61.33893l-1.63663,4.72456l3.27327,3.77964l6.54' +
      '654,-5.66947z" id="mer-1 4 1 1" fill="#01665e"/><path d="M256.54654,64.17367l-6.54654,5.66947h7.63763z" fill="#01665e"/><path d="M243.45346,49.05509l1.63663,-4.' +
      '72456l-2.72772,-0.94491l-3.81881,6.61438z" fill="#01665e"/><path d="M245.0901,44.33053l1.63663,-4.72456l-1.30931,-1.51186l-3.05505,5.2915z" fill="#01665e"/><pat' +
      'h d="M241.81683,67.0084l4.9099,-0.94491l1.63663,-4.72456l-8.18317,-2.83473z" id="mer-1 6 1" fill="#01665e"/><path d="M248.36337,61.33893l1.63663,-4.72456l-3.273' +
      '27,-3.77964l-6.54654,5.66947z" id="mer-1 1 1 1" fill="#01665e"/><path d="M246.72673,52.83473l-3.27327,-3.77964l-4.9099,0.94491l1.63663,8.5042z" id="mer-1 2 1 1"' +
      ' fill="#01665e"/><path d="M240.18019,58.5042l-1.63663,-8.5042l-3.81881,6.61438z" fill="#01665e"/><path d="M233.63366,64.17367l6.54654,-5.66947l-5.45545,-1.88982' +
      'l-3.05505,5.2915z" fill="#01665e"/><path d="M233.63366,64.17367l3.27327,3.77964l4.9099,-0.94491l-1.63663,-8.5042z" id="mer-1 5 1 1" fill="#01665e"/><path d="M24' +
      '6.72673,66.06349l-4.9099,0.94491l0.54554,2.83473l7.63763,0z" fill="#01665e"/><path d="M241.81683,67.0084l-4.9099,0.94491l-0.65465,1.88982h6.1101z" fill="#01665e' +
      '"/><path d="M236.90693,67.95331l-3.27327,-3.77964l-6.54654,5.66947l9.16515,0z" fill="#5ab4ac"/><path d="M233.63366,64.17367l-1.96396,-2.26779l-4.58258,7.93725z"' +
      ' fill="#5ab4ac"/></g></g></svg>'
  );
});
