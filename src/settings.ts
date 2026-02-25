import BasesTasks from "main";
import { PluginSettingTab, Setting } from "obsidian";

export interface BasesTasksSettings {
  exportToDailyOption:boolean;
}


export const DEFAULT_SETTINGS: BasesTasksSettings = {
  exportToDailyOption:false
}


export class BasesTasksSettingTab extends PluginSettingTab {
  plugin: BasesTasks;

  display(): void {
    const {containerEl} = this;

    containerEl.empty();
    new Setting(containerEl)
    .setName("Bases Tasks")
    .setHeading()

    new Setting(containerEl)
    .setName("Sync all tasks")
    .setDesc("Loads all tasks found in notes into properties")
    .addButton((button)=>{
      button
      .setTooltip("Sync tasks")
      .setIcon("refresh-ccw")
      .onClick(()=>{this.plugin.syncTasks(this.plugin.app.vault)})});
  }
}