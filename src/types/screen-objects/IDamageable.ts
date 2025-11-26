export interface IDamageable {
  takeDamage(damage?: number): void;
  isInvulnerable(): boolean;
}
