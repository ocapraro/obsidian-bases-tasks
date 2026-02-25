import {Editor, MarkdownView, parseYaml, Plugin, stringifyYaml} from 'obsidian';
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

  // Extracts the tasks from a note body and saves them as a property
  saveTasks(editor:Editor) {
    const rawFile = editor.getValue();
    const splitFile = rawFile.split("\n");
    const tasks = splitFile.filter(line=>line.match(/^- \[.\]/));
    const properties:{tasks:string[]} = this.getProperties(rawFile);
    if(this.strArraysEqual(properties["tasks"], tasks))
      return;
    properties["tasks"] = tasks;
    const propertylessFile = rawFile.replace(/^---\n([\w\W]*)---/m,"");
    const newFile = `---\n${stringifyYaml(properties)}\n---${propertylessFile}`;

    // Grab line length difference between new and old file, add it to the current cursor position
    const lineDifferential = newFile.split("\n").length - splitFile.length;
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
    const parsedProperties = parseYaml(properties||"") as {tasks:string[]};
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
  async syncTasks() {
    
  }
}



