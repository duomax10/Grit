import Phaser from 'phaser';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { HUDButtons } from '../ui/HUDButtons';
import { InventoryUI } from '../ui/InventoryUI';
import { StickyNote } from '../ui/StickyNote';
import { ObjectiveToast } from '../ui/ObjectiveToast';
import { InteractiveObject } from '../entities/InteractiveObject';
import { MissionSystem } from '../systems/MissionSystem';
import { DialogSystem } from '../systems/DialogSystem';

export class UIScene extends Phaser.Scene {
  private joystick!: VirtualJoystick;
  private hudButtons!: HUDButtons;
  private inventoryUI!: InventoryUI;
  private stickyNote!: StickyNote;
  private objectiveToast!: ObjectiveToast;
  public dialogSystem!: DialogSystem;

  // When locked, HUD button callbacks are suppressed and joystickData
  // is zeroed. Toggled by GraveyardScene during scripted sequences.
  public inputLocked = false;

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
      if (this.inputLocked) return;
      if (this.inventoryUI.active || this.stickyNote.isVisible) return;
      this.events.emit('interact-pressed');
    };

    this.hudButtons.onInventory = () => {
      if (this.inputLocked) return;
      if (this.inventoryUI.active) {
        this.inventoryUI.close();
      } else {
        this.inventoryUI.open();
        this.events.emit('inventory-pressed');
      }
    };

    this.hudButtons.onMission = () => {
      if (this.inputLocked) return;
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

    // Dialog system lives here so it renders above HUD buttons
    this.dialogSystem = new DialogSystem(this);

    // Objective completion toast
    this.objectiveToast = new ObjectiveToast(this);

    // Listen for objective completions to refresh the note
    MissionSystem.getInstance().on('objective-completed', () => {
      this.stickyNote.refresh();
    });
    MissionSystem.getInstance().on('mission-changed', () => {
      this.stickyNote.refresh();
    });

    // Show the sticky note at the start of each level. Using `on`
    // (not `once`) so every level the player enters gets its own
    // note pop — UIScene is persistent across level scenes.
    this.events.on('show-mission', () => {
      this.stickyNote.show(() => {
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

    // Input lock events from gameplay scene (scripted sequences)
    this.events.on('input-lock', (locked: boolean) => {
      this.inputLocked = locked;
      if (locked) {
        this.joystickData.x = 0;
        this.joystickData.y = 0;
        this.joystick.reset();
      }
    });

    // Keyboard shortcut for interact (E key)
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-E', () => {
        if (this.inputLocked) return;
        if (this.inventoryUI.active) return;
        this.events.emit('interact-pressed');
      });

      // Keyboard shortcut for inventory (I key)
      this.input.keyboard.on('keydown-I', () => {
        if (this.inputLocked) return;
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
    if (this.inputLocked) {
      this.joystickData.x = 0;
      this.joystickData.y = 0;
      return;
    }
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
