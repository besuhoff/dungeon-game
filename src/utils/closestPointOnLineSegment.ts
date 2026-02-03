// Returns the closest point on the line segment AB to point P
export const closestPointOnLineSegment = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  px: number,
  py: number,
): [number, number] => {
  const apx = px - ax;
  const apy = py - ay;
  const abx = bx - ax;
  const aby = by - ay;

  const ab2 = abx * abx + aby * aby;
  if (ab2 === 0) {
    return [ax, ay]; // a and b are the same point
  }

  const ap_ab = apx * abx + apy * aby;
  const t = ap_ab / ab2;

  if (t < 0) {
    return [ax, ay];
  } else if (t > 1) {
    return [bx, by];
  }

  return [ax + abx * t, ay + aby * t];
};
