export function lineIntersectsRect(
    x1: number, y1: number, x2: number, y2: number, 
    rectX: number, rectY: number, 
    rectWidth: number, rectHeight: number
): boolean {
            
    // Line-rectangle intersection test
    const left = rectX;
    const right = rectX + rectWidth;
    const top = rectY;
    const bottom = rectY + rectHeight;

    // Check if line is completely to one side of rectangle
    if ((x1 <= left && x2 <= left) || (x1 >= right && x2 >= right) ||
    (y1 <= top && y2 <= top) || (y1 >= bottom && y2 >= bottom)) {
    return false;
    }

    // Check line intersection with each edge of rectangle
    const intersectLine = (x3: number, y3: number, x4: number, y4: number): boolean => {
    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denominator === 0) return false;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    };

    return intersectLine(left, top, right, top) || // Top edge
    intersectLine(right, top, right, bottom) || // Right edge
    intersectLine(right, bottom, left, bottom) || // Bottom edge
    intersectLine(left, bottom, left, top); // Left edge
}