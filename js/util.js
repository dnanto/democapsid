function p2c(p) {
    return [p.x, p.y];
}

function parse_number(value) {
    return Number.isNaN((result = parseFloat(value))) ? value : result;
}
