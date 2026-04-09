import Phaser from 'phaser';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { HUDButtons } from '../ui/HUDButtons';
import { InventoryUI } from '../ui/InventoryUI';
import { InteractiveObject } from '../entities/InteractiveObject';

export class UIScene extends Phaser.Scene {
  private joystick!: VirtualJoystick;
  private hudButtons!: HUDButtons;
  private inventoryUI!: InventoryUI;

  // Exposed for GraveyardScene to read
  public joystickData = { x: 0, y: 0 };

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Virtual joystick
    this.joystick = new VirtualJoystick(this);

    // HUD Buttons
    this.hudButtons = new HUDButtons(this);

    this.hudButtons.onInteract = () => {
      if (this.inventoryUI.active) return;
      this.events.emit('interact-pressed');
    };

    this.hudButtons.onInventory = () => {
      if (this.inventoryUI.active) {
        this.inventoryUI.close();
      } else {
        this.inventoryUI.open();
        this.events.emit('inventory-pressed');
      }
    };

    // Inventory UI
    this.inventoryUI = new InventoryUI(this);
    this.inventoryUI.onClose = () => {
      // Resume game
    };

    // Listen for interaction state changes from GraveyardScene
    this.events.on('nearest-interactive-changed', (obj: InteractiveObject | null) => {
      if (obj) {
        this.hudButtons.showInteract();
      } else {
        this.hudButtons.hideInteract();
      }
    });

    // Keyboard shortcut for interact (E key)
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-E', () => {
        if (this.inventoryUI.active) return;
        this.events.emit('interact-pressed');
      });

      // Keyboard shortcut for inventory (I key)
      this.input.keyboard.on('keydown-I', () => {
        if (this.inventoryUI.active) {
          this.inventoryUI.close();
        } else {
          this.inventoryUI.open();
          this.events.emit('inventory-pressed');
        }
      });

      // Escape to close overlays
      this.input.keyboard.on('keydown-ESC', () => {
        if (this.inventoryUI.active) {
          this.inventoryUI.close();
        }
      });
    }
  }

  update(): void {
    if (!this.inventoryUI.active) {
      this.joystick.update();
      this.joystickData.x = this.joystick.x;
      this.joystickData.y = this.joystick.y;
    } else {
      this.joystickData.x = 0;
      this.joystickData.y = 0;
    }
  }
}
