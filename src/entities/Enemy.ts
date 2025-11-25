import { ScreenObject } from './ScreenObject';
import * as config from '../config';
import { IEnemy } from '../types/screen-objects/IEnemy';
import { IBullet } from "../types/screen-objects/IBullet";
import { IWall } from "../types/screen-objects/IWall";
import { IPoint } from "../types/geometry/IPoint";
import { IWorld } from "../types/IWorld";
import { loadImage } from '../utils/loadImage';
import { Point2D } from '../utils/geometry/Point2D';
import { lineIntersectsRect } from '../utils/lineIntersectsRect';
import { AudioManager } from '../utils/AudioManager';
import { Bullet } from './Bullet';
import { randomChoiceWeighted } from '../utils/randomChoiceWeighted';

export class Enemy extends ScreenObject implements IEnemy {
    private speed: number = config.ENEMY_SPEED;
    private image: HTMLImageElement | null = null;
    private bloodImage: HTMLImageElement | null = null;
    private direction: number = 1;
    private nightVisionDetectionRadius: number = config.NIGHT_VISION_DETECTION_RADIUS;
    private dead: boolean = false;
    private deadTimer: number = 0;
    private shootDelay: number = 0;
    private reward: number = config.ENEMY_REWARD;
    private _lives = config.ENEMY_LIVES;
    private _bullets: IBullet[] = [];
    private _rotation: number = 0;

    get lives(): number {
        return this._lives;
    }

    get wall(): IWall {
        return this._wall;
    }

    constructor(private world: IWorld, private _wall: IWall, neighboringWalls: IWall[], id?: string) {
        const size = config.ENEMY_SIZE;
        const wallSide = Math.random() < 0.5 ? 1 : -1;

        let x: number, y: number;

        if (_wall.orientation === 'vertical') {
            x = _wall.x - wallSide * (_wall.width / 2 + size / 2);
            y = _wall.y + Math.random() * _wall.height;
            let dy = size;
            let direction = 1;
            // Check if there is a wall in the way
            while (y >= _wall.y + size && y < _wall.y + _wall.height && neighboringWalls.some(wall => wall.checkCollision(x - size/2, y - size/2, size, size))) {
                y += direction * dy;
                dy += size;
                direction *= -1;
            }
        } else {
            x = _wall.x + Math.random() * _wall.width;
            y = _wall.y - wallSide * (_wall.height / 2 + size / 2);
            let dx = size;
            let direction = 1;
            // Check if there is a wall in the way
            while (x >= _wall.x + size && x < _wall.x + _wall.width && neighboringWalls.some(wall => wall.checkCollision(x - size/2, y - size/2, size, size))) {
                x += direction * dx;
                dx += size;
                direction *= -1;
            }
        }

        super(new Point2D(x, y), size, size, id);

        // Load sounds
        const audioManager = AudioManager.getInstance();
        audioManager.loadSound(config.SOUNDS.BULLET);
        audioManager.loadSound(config.SOUNDS.ENEMY_HURT);

        // Load enemy sprite
        loadImage(config.TEXTURES.ENEMY).then(img => {
            this.image = img;
        });

        // Load blood texture
        loadImage(config.TEXTURES.ENEMY_BLOOD).then(img => {
            this.bloodImage = img;
        });
    }

    canSeePlayer(): boolean {
        const player = this.world.player;
        if (this.world.gameOver || !player) {
            return false;
        }

        // Check if player is in line of sight
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (player.nightVisionTimer > 0 && distance > this.nightVisionDetectionRadius) {
            return false;
        }

        if (distance > this.world.torchRadius) {
            return false;
        }

        // Check if any nearby walls block the line of sight
        for (const wall of this.world.walls) {
            const wallPoint = wall.getLeftTopCorner();
            if (lineIntersectsRect(this.x, this.y, player.x, player.y, 
                                   wallPoint.x, wallPoint.y, 
                                   wall.width, wall.height)) {
                return false;
            }
        }
        return true;
    }

    get rotation(): number {
        return this._rotation;
    }
        
    getGunPoint(): IPoint {
        // Get gun position
        return this.getPosition().movedByPointCoordinates(
            config.ENEMY_TEXTURE_CENTER.inverted()  
        )
            .moveByPointCoordinates(config.ENEMY_GUN_END)
            .rotateAroundPointCoordinates(this.getPosition(), this.rotation)
    }

    shoot(dt: number): void { 
        if (this.shootDelay > 0) {
            this.shootDelay = Math.max(0, this.shootDelay - dt);
            return;
        }

        const bulletPoint = this.getGunPoint();

        // Create bullet
        const bullet = new Bullet(
            this.world,
            bulletPoint,
            this.rotation,
            true
        );

        this._bullets.push(bullet);
        AudioManager.getInstance().playSound(config.SOUNDS.BULLET);
        this.shootDelay = config.ENEMY_SHOOT_DELAY;
    }

    update(dt: number): void {
        const player = this.world.player;
        this._bullets.forEach(bullet => {
            bullet.update(dt);
        });

        if (this.dead) {
            this.deadTimer -= dt;
            if (this.deadTimer <= 0) {
                this.world.removeEnemy(this);
            }
            return;
        }

        if (player && this.canSeePlayer()) {
            this._rotation = 90 + Math.atan2(this.y - player.y, this.x - player.x) * 180 / Math.PI;
            // Shoot at player
            this.shoot(dt);
            return
        }

        // Patrol logic
        let dx = 0;
        let dy = 0;

        if (this._wall.orientation === 'vertical') {
            // Move up and down along vertical walls
            dy = this.speed * this.direction * dt;
        } else {
            // Move left and right along horizontal walls
            dx = this.speed * this.direction * dt;
        }

        // Check collisions
        let collision = false;
        const collisionRect = this.getCollisionRect(dx, dy);

        // Check collisions with nearby walls
        for (const wall of this.world.walls) {
            if (wall.checkCollision(collisionRect.left, collisionRect.top, collisionRect.width, collisionRect.height)) {
                collision = true;
                break;
            }
        }

        // Check collisions with nearby enemies
        if (!collision) {
            for (const enemy of this.world.enemies.filter((enemy) => enemy.isAlive() && enemy.id !== this.id)) {
                if (enemy.checkCollision(collisionRect.left, collisionRect.top, collisionRect.width, collisionRect.height)) {
                    collision = true;
                    break;
                }
            }
        }

        if (collision) {
            this.direction *= -1;
        } else {
            this.moveBy(dx, dy);
        }

        let y = this.y;
        let x = this.x;

        // Check patrol boundaries
        if (this._wall.orientation === 'vertical') {
            if (y < this._wall.y || y > this._wall.y + this._wall.height) {
                this.direction *= -1;
                // Clamp position to wall boundaries
                y = Math.max(this._wall.y, Math.min(this._wall.y + this._wall.height, y));
            }
        } else {
            if (x < this._wall.x || x > this._wall.x + this._wall.width) {
                this.direction *= -1;
                // Clamp position to wall boundaries
                x = Math.max(this._wall.x, Math.min(this._wall.x + this._wall.width, x));
            }
        }
        if (this._wall.orientation == 'vertical') {
            this._rotation = 90 - 90 * this.direction;
        } else {
            this._rotation = -90 * this.direction;
        }
        this.moveBy(x - this.x, y - this.y);
    }

    draw(ctx: CanvasRenderingContext2D): void {    
        this._bullets.forEach(bullet => {  
            bullet.draw(ctx);
        });

        const player = this.world.player;

        if (!this.image || !player) {
            return;
        }

        const distance = this.getPosition().distanceTo(player.getPosition());
        const shouldDraw = (distance <= this.world.torchRadius + this.width || player.nightVisionTimer > 0) && !this.world.gameOver;
        const screenPoint = this.world.worldToScreenCoordinates(this.getPosition());

        ctx.save();
        ctx.translate(screenPoint.x, screenPoint.y);

        const textureSize = !this.dead ? config.ENEMY_TEXTURE_SIZE : config.ENEMY_BLOOD_TEXTURE_SIZE;
        const texturePoint = !this.dead ? config.ENEMY_TEXTURE_CENTER.inverted() : new Point2D(-textureSize / 2, -textureSize / 2);

        ctx.rotate(this.rotation * Math.PI / 180);

        if (this.dead && shouldDraw && this.bloodImage) {
            ctx.drawImage(this.bloodImage, -this.width / 2, -this.height / 2, this.width, this.height);
        }

        if (!this.dead && shouldDraw && this.image) {
            ctx.drawImage(
                this.image,
                texturePoint.x,
                texturePoint.y,
                textureSize,
                textureSize
            );
        }

        ctx.rotate(-this.rotation * Math.PI / 180);

        if (this.world.debug) {
            // Draw debug information
            ctx.strokeStyle = '#00ff00';

            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            if (!this.dead) {
                // Draw gun end point
                ctx.rotate(this.rotation * Math.PI / 180);
                
                ctx.fillStyle = 'magenta';
                const gunPoint = texturePoint.movedByPointCoordinates(config.ENEMY_GUN_END);
                ctx.beginPath();
                ctx.arc(gunPoint.x, gunPoint.y, 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.rotate(-this.rotation * Math.PI / 180);
            }

            ctx.fillStyle = 'white';
            ctx.font = `12px ${config.FONT_NAME}`;
            ctx.textAlign = 'left';
            ctx.fillText(`Wall #${this._wall.id}`, -20, 24);
            ctx.fillText(`Position: ${this.getPosition()}`, -20, 36);
        }

        ctx.restore();
    }

    takeDamage(damage: number): void {
        this._lives -= damage;

        if (this._lives <= 0) {
            this.die();
            if (this.world.player) {
                this.world.player.recordKill(this.reward)
            }
        }

        // Play hurt sound with volume based on distance to player
        const player = this.world.player;
        if (!player) {
            return;
        }

        const distance = Math.sqrt((this.x - player.x) ** 2 + (this.y - player.y) ** 2);
        const volume = Math.max(1 - 0.5 * distance / config.TORCH_RADIUS, 0);
        AudioManager.getInstance().playSound(config.SOUNDS.ENEMY_HURT, volume);
    }

    die(withDrop = true): void {
        this.deadTimer = config.ENEMY_DEATH_TRACE_TIME;
        this.dead = true;

        if (withDrop && Math.random() < config.ENEMY_DROP_CHANCE) {
            const bonusType = randomChoiceWeighted(config.ENEMY_DROP_TYPE_CHANCES);
            if (bonusType) {
                this.world.spawnBonus(bonusType, this.getPosition());
            }
        }
    }

    isAlive(): boolean {
        return !this.dead;
    }
}
