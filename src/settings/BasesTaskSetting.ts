import { Setting } from "obsidian";

export default class BasesTaskSetting extends Setting{
  hide() {
    this.setClass("bases-tasks-hidden");
  }

  show() {
    if(this.settingEl.hasClass("bases-tasks-hidden"))
      this.settingEl.classList.remove("bases-tasks-hidden");
  }

  disable() {
    this.setClass("bases-tasks-disabled");
  }

  enable() {
    if(this.settingEl.hasClass("bases-tasks-disabled"))
      this.settingEl.classList.remove("bases-tasks-disabled");
  }

  
}