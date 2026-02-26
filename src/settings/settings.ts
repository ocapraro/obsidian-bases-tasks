import BasesTasks from "main";
import { PluginSettingTab, Setting } from "obsidian";
import FolderSuggest from "./FolderSuggest";

export interface BasesTasksSettings {
  dailyNoteFolderPath:string;
  moveToDailyOption:boolean;
}


export const DEFAULT_SETTINGS: BasesTasksSettings = {
  dailyNoteFolderPath:"",
  moveToDailyOption:false
}


export class BasesTasksSettingTab extends PluginSettingTab {
  plugin: BasesTasks;
  dailyNotesSettings:Setting[] = [];

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

    new Setting(containerEl)
    .setName("Daily notes folder")
    .setDesc("The path to your daily notes folder to enable daily notes integration.")
    .addSearch(search => {search
      .setValue(this.plugin.settings.dailyNoteFolderPath)
      .setPlaceholder("Search for a folder")
      .onChange(async (value)=>{
        if(value){
          this.enableSettings(this.dailyNotesSettings);
          return;
        }
        this.disableSettings(this.dailyNotesSettings);
        this.plugin.settings.dailyNoteFolderPath = "";
        await this.plugin.saveSettings();
      });

      new FolderSuggest(this.app, search.inputEl)
      .onSelect(async (folder)=>{
        this.plugin.settings.dailyNoteFolderPath = folder.path;
        await this.plugin.saveSettings();
        this.dailyNotesSettings.forEach(setting =>{ 
          if(setting.settingEl.hasClass("bases-tasks-disabled"))
            setting.settingEl.classList.remove("bases-tasks-disabled");
        });
      });
    });

    this.dailyNotesSettings.push(new Setting(containerEl)
    .setName("Move to daily note option")
    .setDesc("Enables the menu option to move tasks to todays daily note.")
    .setClass("bases-tasks-daily-notes-option")
    .addToggle(t=>t
      .setValue(this.plugin.settings.moveToDailyOption)
      .onChange(async (value)=> {
        this.plugin.settings.moveToDailyOption = value;
        await this.plugin.saveSettings();
      })
    ));

    if(!this.plugin.settings.dailyNoteFolderPath) {
      this.disableSettings(this.dailyNotesSettings);
    }
    
  }

  enableSettings(settings:Setting[]) {
    settings.forEach(setting =>{ 
      if(setting.settingEl.hasClass("bases-tasks-disabled"))
        setting.settingEl.classList.remove("bases-tasks-disabled");
    });
  }

  disableSettings(settings:Setting[]) {
    settings.forEach(setting =>{ 
      setting.setClass("bases-tasks-disabled");
    });
  }


}