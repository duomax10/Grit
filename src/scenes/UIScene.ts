import Phaser from 'phaser';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { HUDButtons } from '../ui/HUDButtons';
import { InventoryUI } from '../ui/InventoryUI';
import { StickyNote } from '../ui/StickyNote';
import { InteractiveObject } from '../entities/InteractiveObject';
import { MissionSystem } from '../systems/MissionSystem';

export class UIScene extends Phaser.Scene {
  private joystick!: VirtualJoystick;
  private hudButtons!: HUDButtons;
  private inventoryUI!: InventoryUI;
  private stickyNote!: StickyNote;

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
      if (this.inventoryUI.active || this.stickyNote.isVisible) return;
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

    this.hudButtons.onMission = () => {
      if (this.stickyNote.isVisible) {
        this.stickyNote.dismiss();
      } else {
        this.stickyNote.show();
        this.events.emit('inventory-pressed'); // stop player movement
      }
    };

    // Inventory UI
    this.inventoryUI = new InventoryUI(this);
    this.inventoryUI.onClose = () => {
      // Resume game
    };

    // Sticky note (mission display)
    this.stickyNote = new StickyNote(this);

    // Listen for objective completions to refresh the note
    MissionSystem.getInstance().on('objective-completed', () => {
      this.stickyNote.refresh();
    });
    MissionSystem.getInstance().on('mission-changed', () => {
      this.stickyNote.refresh();
    });

    // Show the sticky note on level start
    this.events.once('show-mission', () => {
      this.stickyNote.show(() => {
        // After the first dismissal (level start), fire an event so
        // the GraveyardScene can proceed with the intro dialog
        this.events.emit('mission-note-dismissed');
      });
    });

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
