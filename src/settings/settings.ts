import BasesTasks from "main";
import { PluginSettingTab, Setting } from "obsidian";
import FolderSuggest from "./search/FolderSuggest";
import BasesTaskSetting from "./BasesTaskSetting";
import TagMultiSelect from "./search/TagMultiSelect";
import { getAllVaultTags, syncTasks } from "commands";

export interface BasesTasksSettings {
  draggableTasks:boolean;
  moveCompleted:boolean;
  dailyNoteFolderPath:string;
  moveToTomorrowOption:boolean;
  moveToDailyOption:boolean;
  moveToDailyWithTags:boolean;
  taskTagsToIgnore:string;
  developerTools:boolean;
  logging:boolean;
}


export const DEFAULT_SETTINGS: BasesTasksSettings = {
  draggableTasks:true,
  moveCompleted:true,
  dailyNoteFolderPath:"",
  moveToTomorrowOption:false,
  moveToDailyOption:false,
  moveToDailyWithTags:false,
  taskTagsToIgnore:"",
  developerTools:false,
  logging:false
}


export class BasesTasksSettingTab extends PluginSettingTab {
  plugin: BasesTasks;

  display(): void {
    const {containerEl} = this;
    containerEl.empty();

    new Setting(containerEl)
    .setName("Sync all tasks")
    .setDesc("Loads all tasks found in notes into properties.")
    .addButton((button)=>button
      .setTooltip("Sync tasks")
      .setIcon("refresh-ccw")
      .onClick(async()=>{await syncTasks(this.plugin.app.vault, this.plugin.logger)})
    );

    new Setting(containerEl)
    .setName("Draggable tasks")
    .setDesc("Enables dragging tasks to rearrange them (you must reload for changes to take effect).")
    .addToggle(t=>t
      .setValue(this.plugin.settings.draggableTasks)
      .onChange(async (value)=> {
        this.plugin.settings.draggableTasks = value;
        await this.plugin.saveSettings();
      })
    );

    new Setting(containerEl)
    .setName("Move tasks when complete")
    .setDesc("Automatically move completed tasks to the bottom of their checklist")
    .addToggle(t=>t
      .setValue(this.plugin.settings.moveCompleted)
      .onChange(async (value)=> {
        this.plugin.settings.moveCompleted = value;
        await this.plugin.saveSettings();
      })
    );

    this.displayDailyNoteSettings(containerEl);
    this.displayDeveloperSettings(containerEl);
    
  }

  displayDailyNoteSettings(containerEl:HTMLElement) {
    new Setting(containerEl)
    .setName("Daily notes integration")
    .setDesc("Task integrations with daily notes")
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

    dailyNoteFolderPath.addToDependencies(
      new BasesTaskSetting(containerEl)
      .setName("Move to tomorrow option")
      .setDesc("Enables the menu option to move tasks to tomorrows daily note")
      .addToggle(t=>t
        .setValue(this.plugin.settings.moveToTomorrowOption)
        .onChange(async (value)=> {
          this.plugin.settings.moveToTomorrowOption = value;
          await this.plugin.saveSettings();
        })
      )
    );

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

    const moveToDailyWithTags = new BasesTaskSetting(containerEl)
    .setName("Keep note tags when moving to daily")
    .setDesc("When moving tasks to daily note, add the tags on the note it came from")
    .addToggle(t=>t
      .setValue(this.plugin.settings.moveToDailyWithTags)
      .onChange(async (value)=> {
        this.plugin.settings.moveToDailyWithTags = value;
        await this.plugin.saveSettings();
        moveToDailyWithTags.showDependencies(this.plugin.settings.moveToDailyWithTags);
        moveToDailyWithTags.hideDependencies(!this.plugin.settings.moveToDailyWithTags);
      })
    );

    moveToDailyWithTags.addToDependencies(
      new BasesTaskSetting(containerEl)
      .setName("Ignored tags")
      .setDesc("A comma separated list of tags to be ignored when moving tasks")
      .addSearch(search => {
        const tags = getAllVaultTags(this.app);
        search
        .setValue(this.plugin.settings.taskTagsToIgnore)
        .setPlaceholder("Add tags")
        .onChange(async (value)=>{
          const queryTags = value.split(",");
          if(queryTags.length>=this.plugin.settings.taskTagsToIgnore.split(",").length)
            return;
          this.plugin.settings.taskTagsToIgnore = queryTags.filter(t=>tags.has(t)).join(",");
          await this.plugin.saveSettings();
        });
        new TagMultiSelect(this.app, search.inputEl, [...tags])
        .onSelect(async (tagList) => {
          this.plugin.settings.taskTagsToIgnore = tagList;
          await this.plugin.saveSettings();
        });
      })
    );

    moveToDailyOption.addToDependencies(moveToDailyWithTags);
    dailyNoteFolderPath.addToDependencies(moveToDailyOption);

    dailyNoteFolderPath.disableDependencies(!this.plugin.settings.dailyNoteFolderPath);
    moveToDailyOption.hideDependencies(!this.plugin.settings.moveToDailyOption);
    moveToDailyWithTags.hideDependencies(!this.plugin.settings.moveToDailyWithTags);
  }

  displayDeveloperSettings(containerEl:HTMLElement) {
    new Setting(containerEl)
    .setName("Developer tools")
    .setDesc("Not needed unless you're trying to devlop this plugin.")
    .setHeading();

    const developerSettings = new BasesTaskSetting(containerEl)
    .setName("Enable developer tools")
    .setDesc("Enables other developer options")
    .addToggle(t =>t
      .setValue(this.plugin.settings.developerTools)
      .onChange(async (value)=> {
        developerSettings.hideDependencies(!value);
        developerSettings.showDependencies(value);
        this.plugin.settings.developerTools = value;
        await this.plugin.saveSettings();
      })
    );

    developerSettings.addToDependencies(new BasesTaskSetting(containerEl)
      .setName("Logging")
      .setDesc("Starts logging actions in the log file found within this plugin folder.")
      .addToggle(t =>t
        .setValue(this.plugin.settings.logging)
        .onChange(async (value)=> {
          this.plugin.settings.logging = value;
          await this.plugin.saveSettings();
        })
      )
    );

    developerSettings.hideDependencies(!this.plugin.settings.developerTools);
  }


}