export class Vector2D {
  constructor(
    public x: number,
    public y: number
  ) {}

  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  normalize(): Vector2D {
    const length = Math.sqrt(this.x * this.x + this.y * this.y);
    if (length === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / length, this.y / length);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  static fromAngle(angle: number): Vector2D {
    return new Vector2D(-Math.sin(angle), Math.cos(angle));
  }

  getAngle(): number {
    return 270 + (Math.atan2(this.y, this.x) * 180) / Math.PI;
  }
}
