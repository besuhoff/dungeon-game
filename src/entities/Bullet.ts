import { ScreenObject } from './ScreenObject';
import { Vector2D } from '../utils/Vector2D';
import * as config from '../config';
import { IWorld, IBullet, IPoint, IEnemy } from '../types';

export class Bullet extends ScreenObject implements IBullet {
    private velocity: Vector2D;
    private speed: number;
    private _active: boolean = true;
    private _damage: number;

    get active(): boolean {
        return this._active;
    }

    constructor(private world: IWorld, point: IPoint, private rotation: number, private isEnemy: boolean) {
        super(point, config.BULLET_SIZE, config.BULLET_SIZE);
        this._damage = config.BULLET_DAMAGE;
        this.speed = isEnemy ? config.ENEMY_BULLET_SPEED : config.PLAYER_BULLET_SPEED;
        this.velocity = Vector2D.fromAngle(rotation * Math.PI / 180).multiply(this.speed);
    }

    update(dt: number): void {
        if (!this._active) return;

        // Calculate movement based on velocity and delta time
        const dx = this.velocity.x * dt;
        const dy = this.velocity.y * dt;

        // Check collisions with walls
        const collisionRect = this.getCollisionRect(dx, dy);
        const nearbyWalls = this.world.getNeighboringObjects(this.getPosition(), this.world.walls);

        let collision = false;
        for (const wall of nearbyWalls) {
            if (wall.checkCollision(collisionRect.left, collisionRect.top, collisionRect.width, collisionRect.height)) {
                collision = true;
                break;
            }
        }

        if (collision) {
            this._active = false;
        } else {
            this.moveBy(dx, dy);

            // Check hits with enemies
            const hitEnemies = this.checkHitsEnemies();
            if (hitEnemies.length > 0) {
                hitEnemies.forEach(enemy => enemy.takeDamage(this._damage));
                this._active = false;
            }

            // Check hits with player
            if (this.checkHitsPlayer()) {
                this.world.player.takeDamage(this._damage);
                this._active = false;
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this._active) return;

        const screenPoint = this.world.worldToScreenCoordinates(this.getPosition());

        ctx.save();
        ctx.translate(screenPoint.x, screenPoint.y);
        ctx.rotate(this.rotation * Math.PI / 180);

        // Draw bullet
        ctx.fillStyle = this.isEnemy ? config.ENEMY_BULLET_COLOR : config.PLAYER_BULLET_COLOR;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    checkHitsEnemies(): IEnemy[] {
        if (this.isEnemy) {
            return [];
        }

        return this.world.enemies
            .filter((enemy) => enemy.isAlive() && this.checkCollisionWithObject(enemy));
    }

    checkHitsPlayer(): boolean {
        return this.isEnemy && this.world.player.isAlive() && this.checkCollisionWithObject(this.world.player);
    }
}
