    } else if (t === "trunhex") {
        const a12 = (SQRT2 * R) / (1 + SQRT3);
        const r12 = a12 * ((2 + SQRT3) / 2);
        const h3_12 = (SQRT3 / 2) * a12;
        const r3_12 = (SQRT3 / 6) * a12;
        tile = {
            basis: [
                [2 * r12, 0],
                [r12, r12 + 0.5 * a12 + h3_12],
            ],
            tile: (e) => [
                new paper.Path.RegularPolygon({
                    center: e.coor,
                    sides: 12,
                    radius: R,
                    data: { mer: 1 },
                }).rotate(15),
                ...Array.from({ length: 2 }, (_, i) =>
                    new paper.Path.RegularPolygon({
                        center: e.coor.add([0, -(r12 + r3_12)]),
                        sides: 3,
                        radius: a12 / SQRT3,
                        data: { mer: 2 },
                    }).rotate(i * 60, e.coor)
                ),
            ],
            radius: R + h3_12,
        };
    } else if (t === "triakistri") {
        tile = {
            basis: [
                [1.5 * R, r],
                [0, 2 * r],
            ],
            tile: (e) => [
                ...Array.from({ length: 6 }, (_, i) =>
                    new paper.Path({
                        segments: [
                            [-R / 2, r],
                            [+R / 2, r],
                            [0, R / SQRT3],
                        ].map((f) => e.coor.add(f)),
                        closed: true,
                        data: { mer: 1 },
                    }).rotate(i * 60, e.coor)
                ),
                ...Array.from({ length: 6 }, (_, i) =>
                    new paper.Path({
                        segments: [
                            [-R / 2, r],
                            [0, R / SQRT3],
                            [0, 0],
                        ].map((f) => e.coor.add(f)),
                        closed: true,
                        data: { mer: 1 },
                    }).rotate(i * 60, e.coor)
                ),
                ...Array.from({ length: 6 }, (_, i) =>
                    new paper.Path({
                        segments: [
                            [+R / 2, r],
                            [0, R / SQRT3],
                            [0, 0],
                        ].map((f) => e.coor.add(f)),
                        closed: true,
                        data: { mer: 1 },
                    }).rotate(i * 60, e.coor)
                ),
            ],
            radius: R,
        };
    } else if (t === "truntrihex") {
        const a12 = (SQRT2 * R) / (1 + SQRT3);
        const r12 = a12 * ((2 + SQRT3) / 2);
        const h3_12 = (SQRT3 / 2) * a12;
        tile = {
            basis: [
                [2 * r12 + a12, 0],
                [r12 + a12 / 2, a12 / 2 + 2 * h3_12 + r12],
            ],
            tile: (e) => [
                new paper.Path.RegularPolygon({
                    center: e.coor,
                    sides: 12,
                    radius: R,
                    data: { mer: 1 },
                }).rotate(15),
                ...Array.from({ length: 2 }, (_, i) =>
                    new paper.Path.RegularPolygon({
                        center: e.coor.add([0, r12 + h3_12]),
                        sides: 6,
                        radius: a12,
                        data: { mer: 2 },
                    })
                        .rotate(-30)
                        .rotate(-60 * i, e.coor)
                ),
                ...Array.from({ length: 3 }, (_, i) =>
                    new paper.Path.RegularPolygon({
                        center: e.coor.add([0, r12 + a12 / 2]),
                        sides: 4,
                        radius: (SQRT2 * a12) / 2,
                        data: { mer: 3 },
                    }).rotate(-30 - 60 * i, e.coor)
                ),
            ],
            radius: R + 2 * h3_12,
        };
    } else if (t === "bisectedhex") {
        tile = {
            basis: [
                [2 * r, 0],
                [r, SQRT3 * r],
            ],
            tile: (e) =>
                Array.from({ length: 6 }, (_, i) => {
                    const result = new paper.Path.RegularPolygon({
                        center: e.coor.add([0, r - (R * SQRT3) / 6]),
                        sides: 3,
                        radius: R / SQRT3,
                    })
                        .rotate(30 + i * 60, e.coor)
                        .divide(new paper.Path.RegularPolygon({ center: e.coor, sides: 3, radius: R }));
                    result.remove();
                    result.children.forEach((f) => (f.data = { mer: 1 }));
                    console.log(result.children);
                    return result.children.map((f) => f.clone());
                }).flat(),
            radius: R,
        };