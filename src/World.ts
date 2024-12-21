import * as config from './config';
import { ScreenObject } from './entities/ScreenObject';
import { IPlayer, IChunk, IWorld, IPoint, IEnemy, IWall, IScreenObject, IBonus, IPlayerFactory, IEnemyFactory, IWallFactory, IBonusFactory, BonusType } from './types';
import { loadImage } from './utils/loadImage';
import { Point2D } from './utils/Point2D';
import { AudioManager } from './utils/AudioManager';

export class World implements IWorld {
    private readonly CHUNK_SIZE = 800; // Same as screen width for now
    private _player: IPlayer;
    private _enemies: IEnemy[] = [];
    private _walls: IWall[] = [];
    private _bonuses: IBonus[] = [];
    private _gameOver: boolean = false;
    private _paused: boolean = false;
    private floorTexture: HTMLImageElement | null = null;
    private chunks: Map<string, IChunk> = new Map();
    private generatedChunks: Set<string> = new Set();
    private _cameraPoint: IPoint = new Point2D(0, 0);
    private _torchRadius: number = config.TORCH_RADIUS;
    private _debug = false;

    get debug(): boolean {
        return this._debug;
    }

    toggleDebug(): void {
        this._debug = !this._debug;
    }

    get gameOver(): boolean {
        return this._gameOver;
    }

    get paused(): boolean {
        return this._paused;
    }

    get player(): IPlayer {
        return this._player;
    }

    get walls(): IWall[] {
        return this._walls;
    }

    get enemies(): IEnemy[] {
        return this._enemies;
    }

    get bonuses(): IBonus[] {
        return this._bonuses;
    }

    get cameraPoint(): IPoint {
        return this._cameraPoint;
    }

    get torchRadius(): number {
        return this._torchRadius;
    }

    constructor(private _Player: IPlayerFactory, private _Enemy: IEnemyFactory, private _Wall: IWallFactory, private _Bonus: IBonusFactory) {
        // Load sounds
        const audioManager = AudioManager.getInstance();
        audioManager.loadSound(config.SOUNDS.TORCH).then(() => {
            // Start playing torch sound in a loop
            audioManager.playSound(config.SOUNDS.TORCH, 1, true);
        });
        
        audioManager.loadSound(config.SOUNDS.GAME_OVER);

        // Create player at center of screen
        this._player = new _Player(
            this,
            new Point2D(0, 0),
        );

        // Load floor texture
        loadImage(config.TEXTURES.FLOOR).then(img => {
            this.floorTexture = img;
        });

        this.initializeLevel();

        
    }

    private getChunkKey(x: number, y: number): string {
        return `${x},${y}`;
    }

    private getChunkLeftTop(worldPoint: IPoint): IPoint {
        return new Point2D(Math.floor(worldPoint.x / this.CHUNK_SIZE), Math.floor(worldPoint.y / this.CHUNK_SIZE));
    }

    private getPlayerChunkLeftTop(): IPoint {
        return this.getChunkLeftTop(this._player.getPosition());
    }

    private generateWallsForChunk(chunkPoint: IPoint): void {
        // If chunk already generated, skip
        const chunkKey = this.getChunkKey(chunkPoint.x, chunkPoint.y);
        if (this.generatedChunks.has(chunkKey)) {
            return;
        }

        // Mark chunk as generated
        this.generatedChunks.add(chunkKey);

        // Calculate chunk boundaries
        const chunkStartX = chunkPoint.x * this.CHUNK_SIZE;
        const chunkStartY = chunkPoint.y * this.CHUNK_SIZE;
        const newWalls: IWall[] = [];
        const newEnemies: IEnemy[] = [];

        // Generate 2-3 random walls in this chunk
        const numWalls = Math.floor(Math.random() * 20) + 20; // 2-3 walls

        for (let i = 0; i < numWalls; i++) {
            // Randomly decide wall orientation
            const orientation = Math.random() < 0.5 ? 'vertical' : 'horizontal';
            let x: number, y: number, width: number, height: number;

            if (orientation === 'vertical') {
                x = Math.floor(Math.random() * (this.CHUNK_SIZE - 200) + chunkStartX + 100);
                y = Math.floor(Math.random() * (this.CHUNK_SIZE - 300) + chunkStartY + 100);
                width = 30;
                height = Math.floor(Math.random() * 101) + 200; // 200-300
            } else {
                x = Math.floor(Math.random() * (this.CHUNK_SIZE - 300) + chunkStartX + 100);
                y = Math.floor(Math.random() * (this.CHUNK_SIZE - 200) + chunkStartY + 100);
                width = Math.floor(Math.random() * 101) + 200; // 200-300
                height = 30;
            }

            // Check if the wall overlaps with existing walls
            let overlaps = false;
            for (const wall of this.getNeighboringObjects<IWall>(new Point2D(x, y), this._walls)) {
                const rect1 = wall.getCollisionRect();
                const rect2 = {
                    left: x - width/2,
                    top: y - height/2,
                    width,
                    height
                };

                // Add padding to prevent walls from being too close
                const padding = 40;
                if (rect1.left < rect2.left + rect2.width + padding &&
                    rect1.left + rect1.width + padding > rect2.left &&
                    rect1.top < rect2.top + rect2.height + padding &&
                    rect1.top + rect1.height + padding > rect2.top) {
                    overlaps = true;
                    break;
                }
            }

            if (!overlaps) {
                const wall = new this._Wall(this, new Point2D(x, y), width, height, orientation);
                newWalls.push(wall);
                this._walls.push(wall);

                // Create enemy for each wall
                const enemy = new this._Enemy(this, wall);
                newEnemies.push(enemy);
                this._enemies.push(enemy);
            }
        }

        // Store chunk data
        this.chunks.set(chunkKey, {
            x: chunkPoint.x,
            y: chunkPoint.y,
            walls: newWalls,
            enemies: newEnemies,
        });
    }

    private updateChunks(): void {
        if (!this._player || this.paused) {
            return;
        }

        // Get current chunk coordinates
        const chunkPoint = this.getPlayerChunkLeftTop();

        // Generate walls for current and adjacent chunks
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                this.generateWallsForChunk(chunkPoint.movedBy(dx, dy));
            }
        }
    }

    getNeighboringObjects<T extends IScreenObject>(point: IPoint, allObjects: T[]): T[] {
        const chunkPoint = this.getChunkLeftTop(point)
        const neighboringChunkLeftTop = { x: (chunkPoint.x - 1) * this.CHUNK_SIZE, y: (chunkPoint.y - 1) * this.CHUNK_SIZE };
        const neighboringChunkRightBottom = { x: (chunkPoint.x + 2) * this.CHUNK_SIZE, y: (chunkPoint.y + 2) * this.CHUNK_SIZE };

        return allObjects.filter(object => {
            const rect = object.getCollisionRect();
            return rect.left < neighboringChunkRightBottom.x + object.width &&
                rect.left + rect.width > neighboringChunkLeftTop.x &&
                rect.top < neighboringChunkRightBottom.y + object.height &&
                rect.top + rect.height > neighboringChunkLeftTop.y;
        });
    }

    update(dt: number): void {
        if (this.gameOver || this.paused) return;

        // Update chunks based on player position
        this.updateChunks();

        // Update player
        this._player.update(dt);

        // Update camera position
        this._cameraPoint = this._player.getPosition().clone();

        // Update enemies
        this.getNeighboringObjects(this._cameraPoint, this._enemies).forEach(enemy => enemy.update(dt));

        // Check bonus pickups
        this.getNeighboringObjects(this._cameraPoint, this._bonuses).forEach(bonus => bonus.update(dt));

        // Check win/lose conditions
        if (!this._player.isAlive()) {
            this.endGame();
        }
    }

    endGame(): void {
        if (!this._gameOver) {
            this._gameOver = true;
            AudioManager.getInstance().playSound(config.SOUNDS.GAME_OVER);
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        // Clear the canvas
        ctx.clearRect(0, 0, config.SCREEN_WIDTH, config.SCREEN_HEIGHT);

        // Draw floor texture
        if (this.floorTexture) {
            const resultingFloorWidth = this.floorTexture.width / 2;
            const resultingFloorHeight = this.floorTexture.height / 2;
        
            const textureX = (this.cameraPoint.x % resultingFloorWidth) - resultingFloorWidth;
            const textureY = (this.cameraPoint.y % resultingFloorHeight) - resultingFloorHeight;

            for (let y = -1; y < config.SCREEN_HEIGHT / resultingFloorHeight + 2; y++) {
                for (let x = -1; x < config.SCREEN_WIDTH / resultingFloorWidth + 2; x++) {
                    ctx.drawImage(this.floorTexture, 
                                -textureX - x * resultingFloorWidth,
                                -textureY - y * resultingFloorHeight, resultingFloorWidth, resultingFloorHeight)
                }
            }
        }

        // Draw walls
        this.getNeighboringObjects(this._cameraPoint, this._walls).forEach(wall => wall.draw(ctx));

        // Draw enemies
        this.getNeighboringObjects(this._cameraPoint, this._enemies).forEach(enemy => enemy.draw(ctx));

        // Draw bonuses
        this.getNeighboringObjects(this._cameraPoint, this._bonuses).forEach(bonus => bonus.draw(ctx));

        // Draw player
        this._player.draw(ctx);

        // Draw darkness overlay
        this.drawDarknessOverlay(ctx);

        // Draw UI
        this.drawUI(ctx);
    }

    private drawDarknessOverlay(ctx: CanvasRenderingContext2D): void {
        if (!this._player.isAlive()) {
            ctx.fillStyle = config.COLOR_DARK;
            ctx.fillRect(0, 0, config.SCREEN_WIDTH, config.SCREEN_HEIGHT);
            return;
        }

        const torchRadius = this._torchRadius * 0.97 + Math.random() * this._torchRadius * 0.06;

        const torchPoint = this.worldToScreenCoordinates(this._player.getTorchPoint());

        const gradient = ctx.createRadialGradient(
            torchPoint.x, torchPoint.y, 0,
            torchPoint.x, torchPoint.y, torchRadius,
        );

        if (this._player.nightVisionTimer > 0) {
            const color = this._player.nightVisionTimer < 2 && this._player.nightVisionTimer % 0.2 < 0.1 ? config.COLOR_NIGHT_VISION_FADING : config.COLOR_NIGHT_VISION;

            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color);
        } else {
            gradient.addColorStop(0, config.COLOR_TRANSPARENT);
            gradient.addColorStop(1, config.COLOR_DARK);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, config.SCREEN_WIDTH, config.SCREEN_HEIGHT);
    }

    public worldToScreenCoordinates(point: IPoint): IPoint {
        return point
            .movedBy(config.SCREEN_WIDTH / 2 - this._cameraPoint.x, config.SCREEN_HEIGHT / 2 - this._cameraPoint.y);
    }

    handleInput(keys: Set<string>, dt: number): void {
        this._player.handleInput(keys, dt);
    }

    togglePause(): void {
        this._paused = !this.paused;
    }

    restart(): void {
        this._gameOver = false;
        this._enemies = [];
        this._bonuses = [];
        this._player = new this._Player(this, new Point2D(0, 0));
        this.chunks.clear();
        this.generatedChunks.clear();
        this.initializeLevel();
    }

    private initializeLevel(): void {
        // Generate initial chunks
        const playerChunk = this.getPlayerChunkLeftTop();
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                this.generateWallsForChunk(playerChunk.movedBy(dx, dy));
            }
        }
    }

    private drawUI(ctx: CanvasRenderingContext2D): void {
        ctx.textAlign = 'left';

        if (this.gameOver) {
            ctx.fillStyle = 'white';
            ctx.font = `48px ${config.HEADER_FONT_NAME}`;
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', config.SCREEN_WIDTH / 2, config.SCREEN_HEIGHT / 2);
            ctx.font = `24px ${config.FONT_NAME}`;
            ctx.fillStyle = 'yellow';
            ctx.fillText(`Your posthumous royalties: ${this._player.money.toFixed(0)}$`, config.SCREEN_WIDTH / 2, config.SCREEN_HEIGHT / 2 + 40);
            ctx.fillStyle = 'magenta';
            ctx.fillText('Press R to Restart', config.SCREEN_WIDTH / 2, config.SCREEN_HEIGHT / 2 + 80);
        } else {
            ctx.fillStyle = 'white';
            ctx.font = `22px ${config.FONT_NAME}`;
            ctx.fillText(`Lives: ${Array(this._player.lives).fill('❤️').join(' ')}`, 10, 30);
            ctx.fillStyle = 'yellow';
            ctx.fillText(`Rewards: ${this._player.money.toFixed(0)}$`, 10, 60);
            ctx.fillStyle = 'cyan';
            ctx.fillText(`Bullets: ${Array(this._player.bulletsLeft).fill('⏽').join('')}`, 10, 90);
            if (this._player.nightVisionTimer > 0) {
                ctx.fillStyle = '#90ff90';
                ctx.fillText(`Night Vision: ${this._player.nightVisionTimer.toFixed(0)}`, 10, 120);
            }
        }

        this.player.drawUI(ctx);

        if (this.debug) {
            ctx.fillStyle = 'white';
            ctx.font = `12px ${config.FONT_NAME}`;
            ctx.fillText(`Chunk: ${this.getChunkLeftTop(this.cameraPoint)}`, 10, config.SCREEN_HEIGHT - 52);
            ctx.fillText(`Number of world objects: ${ScreenObject.id}`, 10, config.SCREEN_HEIGHT - 66);
            ctx.fillText(`Camera position: ${this.cameraPoint}`, 10, config.SCREEN_HEIGHT - 80);
        }
    }

    spawnBonus(type: BonusType, point: IPoint): void {
        const bonus = new this._Bonus(this, point, type);
        this._bonuses.push(bonus);
    }
}
