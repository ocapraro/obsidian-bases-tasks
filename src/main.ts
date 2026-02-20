import {MarkdownView, Plugin} from 'obsidian';

/**
 * The main plugin
 */

const DELAY = 500;

export default class BasesTasks extends Plugin {
  gettingTasksTimeoutID:NodeJS.Timeout;

  async onload(): Promise<void> {
    this.registerEvent(this.app.workspace.on("editor-change", async(editor, info)=>{
      if (!(info instanceof MarkdownView))
        return;
      if(this.gettingTasksTimeoutID !== null)
        clearTimeout(this.gettingTasksTimeoutID);
      this.gettingTasksTimeoutID = setTimeout(()=>{
        this.getTasks(editor.getValue());
      }, DELAY);
    }))
  }

  async getTasks(rawFile:string) {
    const splitFile = rawFile.split("\n");
    const tasks = splitFile.filter(line=>line.match(/^- \[.\]/));
    
  }
}



