import { Setting } from "obsidian";

export default class BasesTaskSetting extends Setting{
  private dependencies:BasesTaskSetting[] = [];

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

  addToDependencies(setting:BasesTaskSetting) {
    this.dependencies.push(setting);
  }

  hideDependencies() {
    this.dependencies.forEach(d=>d.hide());
  }

  showDependencies() {
    this.dependencies.forEach(d=>d.show());
  }

  disableDependencies() {
    this.dependencies.forEach(d=>d.disable());
  }

  enableDependencies() {
    this.dependencies.forEach(d=>d.enable());
  }

  
}