import { Setting } from "obsidian";

/**
 * A settings class with some more functionality, like adding dependencies for other settings, or hiding/disabling them
 */
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

  hideDependencies(conditional=true) {
    if(conditional)
      this.dependencies.forEach(d=>{
        d.hide();
        d.hideDependencies();
      });
  }

  showDependencies(conditional=true) {
    if(conditional)
      this.dependencies.forEach(d=>{
        d.show();
        d.showDependencies();
      });
  }

  disableDependencies(conditional=true) {
    if(conditional)
      this.dependencies.forEach(d=>{
        d.disable();
        d.disableDependencies();
      });
  }

  enableDependencies(conditional=true) {
    if(conditional)
      this.dependencies.forEach(d=>{
        d.enable();
        d.enableDependencies();
      });
  }

  
}