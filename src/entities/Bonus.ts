import { IBonus, IWorld, BonusType, IPoint } from "../types";
import { ScreenObject } from "./ScreenObject";
import { loadImage } from "../utils/loadImage";
import * as config from '../config';
import { AudioManager } from "../utils/AudioManager";

export class Bonus extends ScreenObject implements IBonus {
    public type: BonusType;
    private image: HTMLImageElement | null = null;

    constructor(private world: IWorld, point: IPoint, type: BonusType) {
        // Load appropriate texture
        let texturePath: string = '';
        let size: number = 0;

        if (type === 'aid_kit') {
            texturePath = config.TEXTURES.AID_KIT;
            size = config.AID_KIT_SIZE;
        } else if (type === 'goggles') {
            texturePath = config.TEXTURES.GOGGLES;
            size = config.GOGGLES_SIZE;
        }

        super(point, size, size);

        this.type = type;

        loadImage(texturePath).then(img => {
            this.image = img;
        });

        AudioManager.getInstance().loadSound(config.SOUNDS.BONUS_PICKUP);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.image) {
            return;
        }

        const screenPoint = this.world.worldToScreenCoordinates(this.getPosition());

        ctx.save();
        ctx.translate(screenPoint.x, screenPoint.y);
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }

    update(dt: number): void {
        const player = this.world.player;
        
        if (this.checkCollisionWithObject(player)) {
            AudioManager.getInstance().playSound(config.SOUNDS.BONUS_PICKUP);
            if (this.type === 'aid_kit') {
                player.heal(config.AID_KIT_HEAL_AMOUNT);
            } else if (this.type === 'goggles') {
                player.addNightVision();
            }

            this.world.bonuses.splice(this.world.bonuses.findIndex(bonus => bonus.id === this.id), 1);
        }
    }
}
