import EditorMenuEvent from 'events/EditorMenuEvent';
import { PROPERTIES_REGEX, TASK_REGEX, TYPE_DETECT_DELAY } from './constants';
import {Editor, getAllTags, MarkdownView, Menu, Notice, parseYaml, Plugin, stringifyYaml, Vault} from 'obsidian';
import { BasesTasksSettings, BasesTasksSettingTab, DEFAULT_SETTINGS } from 'settings/settings';
import { strArraysEqual } from 'utils';



/**
 * The main plugin
 */
export default class BasesTasks extends Plugin {
  settings:BasesTasksSettings;
  gettingTasksTimeoutID:number;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Save tasks to properties on editor
    this.registerEvent(this.app.workspace.on("editor-change", async(editor, info)=>{
      if (!(info instanceof MarkdownView))
        return;

      // Leave a delay when saving tasks so it doesnt write to the not on every char change
      if(this.gettingTasksTimeoutID !== null)
        clearTimeout(this.gettingTasksTimeoutID);
      this.gettingTasksTimeoutID = setTimeout(()=>{
        this.saveTasks(editor);
      }, TYPE_DETECT_DELAY) as unknown as number;
    }));

    new EditorMenuEvent(this);
    this.addSettingTab(new BasesTasksSettingTab(this.app, this));
  }

  // takes in the raw contents of a note, and updates the tasks property based on the content
  updateFileTasks(rawFile:string) {
    const splitFile = rawFile.split("\n");
    const tasks = splitFile.filter(line=>line.match(TASK_REGEX));
    const properties = this.getProperties(rawFile);
    if(strArraysEqual(properties["tasks"], tasks))
      return rawFile;
    properties["tasks"] = tasks;
    const propertylessFile = rawFile.replace(PROPERTIES_REGEX,"");
    const newFile = `---\n${stringifyYaml(properties)}\n---\n${propertylessFile}`;
    return newFile;
  }

  // Extracts the tasks from a note body and saves them as a property
  saveTasks(editor:Editor) {
    const rawFile = editor.getValue();
    const newFile = this.updateFileTasks(rawFile);

    // If theres no change, no need to overwrite
    if(rawFile == newFile)
      return

    // Grab line length difference between new and old file, add it to the current cursor position
    const lineDifferential = newFile.split("\n").length - rawFile.split("\n").length;
    const cursorPosition = editor.getCursor();
    cursorPosition.line += lineDifferential;

    // Update file, and set cursor to proper location
    editor.setValue(newFile);
    editor.setCursor(cursorPosition);
  }

  // Extracts the properties from a note
  getProperties(rawFile:string):{tasks:string[], tags?:string[]} {
    const match = rawFile.match(PROPERTIES_REGEX);
    const properties = match?.[1];
    const parsedProperties = parseYaml(properties||"tasks:") as {tasks:string[]};
    if(!parsedProperties["tasks"])
      return {...parsedProperties, tasks:[]};
    return parsedProperties;
  }

  // Go to each file and add it 
  async syncTasks(vault:Vault) {
    // Alert user that synicing has started
    let notif = new Notice("Syncing tasks...");
    const allFiles = vault.getFiles().filter(f=>f.extension==="md");
    for (let i = 0; i < allFiles.length; i++) {
      notif.hide();
      notif = new Notice(`Syncing tasks: ${i+1}/${allFiles.length}`);
      const file = allFiles[i];
      if (!file)
        continue;
      const rawFile = await vault.read(file);
      const newFile = this.updateFileTasks(rawFile);
      if (rawFile == newFile)
        continue;

      await vault.modify(file,newFile);
    }
    notif.hide();
    new Notice("Syncing complete!", 3000);
  }

  // Gets all the tags from the vault
  getAllVaultTags(): Set<string> {
    const tags = new Set<string>();
    
    for (const file of this.app.vault.getMarkdownFiles()) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) 
        continue;
      const fileTags = getAllTags(cache);
      if (!fileTags) 
        continue;
      for (const t of fileTags) 
        tags.add(t);
    }
    return tags;
  }

  async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<BasesTasksSettings>);
	}

  async saveSettings() {
    await this.saveData(this.settings);
  }
}



