import {Editor, MarkdownView, Notice, parseYaml, Plugin, stringifyYaml, Vault} from 'obsidian';
import { BasesTasksSettings, BasesTasksSettingTab, DEFAULT_SETTINGS } from 'settings';

const DELAY = 350;

/**
 * The main plugin
 */
export default class BasesTasks extends Plugin {
  settings:BasesTasksSettings;
  gettingTasksTimeoutID:number;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Save tasks to properties
    this.registerEvent(this.app.workspace.on("editor-change", async(editor, info)=>{
      if (!(info instanceof MarkdownView))
        return;

      // Leave a delay when saving tasks so it doesnt write to the not on every char change
      if(this.gettingTasksTimeoutID !== null)
        clearTimeout(this.gettingTasksTimeoutID);
      this.gettingTasksTimeoutID = setTimeout(()=>{
        this.saveTasks(editor);
      }, DELAY) as unknown as number;
    }));

    this.addSettingTab(new BasesTasksSettingTab(this.app, this));
  }

  // takes in the raw contents of a note, and updates the tasks property based on the content
  updateFileTasks(rawFile:string) {
    const splitFile = rawFile.split("\n");
    const tasks = splitFile.filter(line=>line.match(/^- \[.\]/));
    const properties = this.getProperties(rawFile);
    if(this.strArraysEqual(properties["tasks"], tasks))
      return rawFile;
    properties["tasks"] = tasks;
    const propertylessFile = rawFile.replace(/^---\n([\w\W]*)---\n?/m,"");
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
  getProperties(rawFile:string):{tasks:string[]} {
    const match = rawFile.match(/^---\n([\w\W]*)---/m);
    const properties = match?.[1];
    const parsedProperties = parseYaml(properties||"tasks:") as {tasks:string[]};
    if(!parsedProperties["tasks"])
      return {...parsedProperties, tasks:[]};
    return parsedProperties;
  }

  async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<BasesTasksSettings>);
	}

  // Compares to arrays to see if each element is equal
  strArraysEqual(arr1:string[], arr2:string[]):boolean {
    if(arr1.length !== arr2.length)
      return false;
    return arr1.every((v, i) => v === arr2[i]);
  }

  // Go to each file and add it 
  async syncTasks(vault:Vault) {
    // Alert user that synicing has started
    let notif = new Notice("Syncing Tasks...");
    const allFiles = vault.getFiles().filter(f=>f.extension==="md");
    for (let i = 0; i < allFiles.length; i++) {
      notif.hide();
      notif = new Notice(`Syncing Tasks: ${i+1}/${allFiles.length}`);
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
    new Notice("Syncing Complete!", 3000);
  }
}



