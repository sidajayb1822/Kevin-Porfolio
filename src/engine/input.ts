import type { Dir } from "./types";

// Shared input state: keyboard + virtual buttons (touch) both write here.
export class InputState {
  private held = new Set<Dir>();
  private order: Dir[] = [];
  private lastPressDir: Dir | null = null;
  private lastPressTime = 0;
  actionQueued = false;
  cancelQueued = false;

  private keyMap: Record<string, Dir> = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const dir = this.keyMap[e.code];
    if (dir) {
      e.preventDefault();
      this.press(dir);
    } else if (e.code === "Space" || e.code === "Enter" || e.code === "KeyE") {
      e.preventDefault();
      if (!e.repeat) this.actionQueued = true;
    } else if (e.code === "Escape") {
      this.cancelQueued = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const dir = this.keyMap[e.code];
    if (dir) this.release(dir);
  };

  attach() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.held.clear();
    this.order = [];
  }

  press(dir: Dir) {
    this.lastPressDir = dir;
    this.lastPressTime =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (!this.held.has(dir)) {
      this.held.add(dir);
      this.order.push(dir);
    }
  }

  release(dir: Dir) {
    this.held.delete(dir);
    this.order = this.order.filter((d) => d !== dir);
  }

  releaseAll() {
    this.held.clear();
    this.order = [];
  }

  queueAction() {
    this.actionQueued = true;
  }

  // most recently pressed direction still held
  currentDir(): Dir | null {
    return this.order.length ? this.order[this.order.length - 1] : null;
  }

  // held direction, or a very recent tap (buffered) so quick key presses register
  bufferedDir(): Dir | null {
    const cur = this.currentDir();
    if (cur) return cur;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.lastPressDir && now - this.lastPressTime < 160) {
      const d = this.lastPressDir;
      this.lastPressDir = null; // consume so it only moves one tile
      return d;
    }
    return null;
  }

  consumeAction(): boolean {
    const v = this.actionQueued;
    this.actionQueued = false;
    return v;
  }

  consumeCancel(): boolean {
    const v = this.cancelQueued;
    this.cancelQueued = false;
    return v;
  }
}
