import { Assets } from './assets';
import * as config from './config';
import { Bonus } from './entities/Bonus';
import { Enemy } from './entities/Enemy';
import { Player } from './entities/Player';
import { Wall } from './entities/Wall';
import { AudioManager } from './utils/AudioManager';
import { loadImage } from './utils/loadImage';
import { World } from './World';

export class Game {
    private canvas: HTMLCanvasElement;
    private fontName: string = config.FONT_NAME;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private world: World;
    private activeKeys: Set<string> = new Set();

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.canvas.width = config.SCREEN_WIDTH;
        this.canvas.height = config.SCREEN_HEIGHT;
        
        this.world = new World(Player, Enemy, Wall, Bonus);
        this.setupEventListeners();
    }

    public static async loadResources(): Promise<void> {
        const audioManager = AudioManager.getInstance();

        await Promise.all([
            loadImage(config.TEXTURES.FLOOR),
            loadImage(config.TEXTURES.PLAYER),
            loadImage(config.TEXTURES.ENEMY),
            loadImage(config.TEXTURES.WALL),
            audioManager.loadSound(config.SOUNDS.PLAYER_HURT),
            audioManager.loadSound(config.SOUNDS.ENEMY_HURT),
            audioManager.loadSound(config.SOUNDS.TORCH),
        ]);

        // Load non-critical resources asynchronously
        audioManager.loadSound(config.SOUNDS.PLAYER_BULLET_RECHARGE);
        audioManager.loadSound(config.SOUNDS.BONUS_PICKUP);
        audioManager.loadSound(config.SOUNDS.GAME_OVER);
        audioManager.loadSound(config.SOUNDS.BULLET);
        loadImage(config.TEXTURES.ENEMY_BLOOD);
        loadImage(config.TEXTURES.AID_KIT);
        loadImage(config.TEXTURES.GOGGLES);
    }

    private setupEventListeners(): void {
        window.addEventListener('keydown', (e) => {
            this.activeKeys.add(e.key);
            this.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.activeKeys.delete(e.key);
        });

        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === 'p') {
            this.world.togglePause();
        }
        if (e.key === 'F3') {
            this.world.toggleDebug();
        }
        if (e.key === 'r' || e.key === 'R') {
            this.world.restart();
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Mouse position handling will be used for player rotation
    }

    private handleMouseDown(e: MouseEvent): void {
        if (e.button === 0) { // Left click
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // Shooting will be handled here
        }
    }

    public start(): void {
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    private gameLoop(timestamp: number): void {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.world.handleInput(this.activeKeys, dt);
        this.world.update(dt);
        this.draw();

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    private draw(): void {
        // Clear the canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the world
        this.world.draw(this.ctx);
    }
}
