import math

def sign(a):
    return (a > 0) - (a < 0)

def bisection(f, a, b, tol, nmax):
  for i in range(nmax):
    c = (a + b) /2
    f_of_c = f(c)
    print(f_of_c, sign(f_of_c), sign(f(a)))
    if f_of_c == 0 or (b - a) / 2 < tol:
      return c
    if sign(f_of_c) == sign(f(a)):
      a = c
    else:
      b = c

def brackets(f, a, b, iter):
    frac = b / iter
    prev = sign(f(a))
    for i in range(iter):
        x = a + i * frac
        curr = sign(f(x))
        if prev != curr:
            yield a + (i - 1) * frac, x
            prev = curr

ux, vx, cx = (0.75593, -0.42258, 0.475)
uy, vy, cy = (-0.65465, -0.48795, 0.72689)
uz, vz, cz = (0, -0.76376, 0.32095)
r = 1.64545
fx = lambda t: r * ux * math.cos(t) + r * vx * math.sin(t) + cx
fy = lambda t: r * uy * math.cos(t) + r * vy * math.sin(t) + cy
fz = lambda t: r * uz * math.cos(t) + r * vz * math.sin(t) + cz
f = lambda t: 0.872673589 - (math.pow(fx(t), 2) + math.pow(fz(t), 2))

for a, b in brackets(f, 0, 2 * 3.14, 10000):
    t = bisection(f, a, b, 0.001, 10000)
    print(t, "->", fx(t), fy(t), fz(t))
    print()
