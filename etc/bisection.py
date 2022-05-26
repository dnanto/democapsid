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

ux, vx, cx = (0.7559289460184544, -0.42257712736425823, 62.50000000000001)
uy, vy, cy = (-0.6546536707079771, -0.48795003647426666, 116.77154487033951)
uz, vz, cz = (1.312742527237846e-16, -0.7637626158259734, 152.85593669469102)
r = 216.50635094610973
fx = lambda t: r * ux * math.cos(t) + r * vx * math.sin(t) + cx
fy = lambda t: r * uy * math.cos(t) + r * vy * math.sin(t) + cy
fz = lambda t: r * uz * math.cos(t) + r * vz * math.sin(t) + cz
f = lambda t: r * r - (math.pow(fx(t), 2) + math.pow(fz(t), 2))

for a, b in brackets(f, 0, 2 * 3.14, 10000):
    t = bisection(f, a, b, 0.001, 10000)
    print(t, "->", fx(t), fy(t), fz(t))
    print()
