import BasesTasks from "main";
import { PluginSettingTab, Setting } from "obsidian";
import FolderSuggest from "./FolderSuggest";
import BasesTaskSetting from "./BasesTaskSetting";

export interface BasesTasksSettings {
  dailyNoteFolderPath:string;
  moveToDailyOption:boolean;
  moveToDailyWithTags:boolean;
}


export const DEFAULT_SETTINGS: BasesTasksSettings = {
  dailyNoteFolderPath:"",
  moveToDailyOption:false,
  moveToDailyWithTags:false
}


export class BasesTasksSettingTab extends PluginSettingTab {
  plugin: BasesTasks;

  display(): void {
    const {containerEl} = this;
    containerEl.empty();

    new Setting(containerEl)
    .setName("Sync all tasks")
    .setDesc("Loads all tasks found in notes into properties.")
    .addButton((button)=>{
      button
      .setTooltip("Sync tasks")
      .setIcon("refresh-ccw")
      .onClick(async()=>{await this.plugin.syncTasks(this.plugin.app.vault)})});

    new Setting(containerEl)
    .setName("Daily notes integration")
    .setHeading()

    const dailyNoteFolderPath = new BasesTaskSetting(containerEl)
    .setName("Daily notes folder")
    .setDesc("The path to your daily notes folder to enable daily notes integration.")
    .addSearch(search => {search
      .setValue(this.plugin.settings.dailyNoteFolderPath)
      .setPlaceholder("Search for a folder")
      .onChange(async (value)=>{
        if(value){
          dailyNoteFolderPath.enableDependencies();
          return;
        }
        dailyNoteFolderPath.disableDependencies();
        this.plugin.settings.dailyNoteFolderPath = "";
        await this.plugin.saveSettings();
      });

      new FolderSuggest(this.app, search.inputEl)
      .onSelect(async (folder)=>{
        this.plugin.settings.dailyNoteFolderPath = folder.path;
        await this.plugin.saveSettings();
        dailyNoteFolderPath.enableDependencies();
      });
    });

    const moveToDailyOption = new BasesTaskSetting(containerEl)
    .setName("Move to daily note option")
    .setDesc("Enables the menu option to move tasks to todays daily note.")
    .addToggle(t=>t
      .setValue(this.plugin.settings.moveToDailyOption)
      .onChange(async (value)=> {
        this.plugin.settings.moveToDailyOption = value;
        await this.plugin.saveSettings();
        moveToDailyOption.showDependencies(this.plugin.settings.moveToDailyOption);
        moveToDailyOption.hideDependencies(!this.plugin.settings.moveToDailyOption);
      })
    );

    moveToDailyOption.addToDependencies(
      new BasesTaskSetting(containerEl)
      .setName("Keep note tags when moving to daily")
      .setDesc("When moving tasks to daily note, add the tags on the note it came from")
      .addToggle(t=>t
        .setValue(this.plugin.settings.moveToDailyWithTags)
        .onChange(async (value)=> {
          this.plugin.settings.moveToDailyWithTags = value;
          await this.plugin.saveSettings();
        })
      )
    );

    dailyNoteFolderPath.addToDependencies(moveToDailyOption);

    dailyNoteFolderPath.disableDependencies(!this.plugin.settings.dailyNoteFolderPath);
    moveToDailyOption.hideDependencies(!this.plugin.settings.moveToDailyOption);
    
  }


}