import {Editor, MarkdownView, parseYaml, Plugin, stringifyYaml} from 'obsidian';

const DELAY = 300;

/**
 * The main plugin
 */
export default class BasesTasks extends Plugin {
  gettingTasksTimeoutID:NodeJS.Timeout;

  async onload(): Promise<void> {
    this.registerEvent(this.app.workspace.on("editor-change", async(editor, info)=>{
      if (!(info instanceof MarkdownView))
        return;

      // Leave a delay when saving tasks so it doesnt write to the not on every char change
      if(this.gettingTasksTimeoutID !== null)
        clearTimeout(this.gettingTasksTimeoutID);
      this.gettingTasksTimeoutID = setTimeout(()=>{
        this.saveTasks(editor);
      }, DELAY);
    }))
  }

  // Extracts the tasks from a note body and saves them as a property
  saveTasks(editor:Editor) {
    const rawFile = editor.getValue();
    const splitFile = rawFile.split("\n");
    const tasks = splitFile.filter(line=>line.match(/^- \[.\]/));
    const properties = this.getProperties(rawFile) || {tasks:[]};
    if(this.arraysEqual(properties["tasks"], tasks))
      return;
    properties["tasks"] = tasks;
    const propertylessFile = rawFile.replace(/^---\n([\w\W]*)---/m,"");
    editor.setValue(`---\n${stringifyYaml(properties)}\n---${propertylessFile}`);
  }

  // Extracts the properties from a note
  getProperties(rawFile:string) {
    const match = rawFile.match(/^---\n([\w\W]*)---/m);
    const properties = match?.[1];
    if(!properties)
      return null;
    return parseYaml(properties);
  }

  // Compares to arrays to see if each element is equal
  arraysEqual(arr1:any[], arr2:any[]):boolean {
    if(arr1.length !== arr2.length)
      return false;
    return arr1.every((v, i) => v === arr2[i]);
  }
}



