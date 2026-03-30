import EditorMenuEvent from './events/EditorMenuEvent';
import { TASK_REGEX, TYPE_DETECT_DELAY } from './constants';
import { MarkdownView, Notice, Plugin} from 'obsidian';
import { BasesTasksSettings, BasesTasksSettingTab, DEFAULT_SETTINGS } from 'settings/settings';
import { moveTaskToNote, updateCurrentFileTasks, syncTasks, sortTasks } from 'commands';
import { Logger } from 'Logger';
import { dragTaskPlugin } from 'extensions/DragTaskPlugin';



/**
 * The main plugin
 */
export default class BasesTasks extends Plugin {
  settings:BasesTasksSettings;
  gettingTasksTimeoutID:number;
  logger:Logger|undefined;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.logger?.log("Loaded");
    if(this.settings.draggableTasks) {
      this.registerEditorExtension(dragTaskPlugin);

      // Handles dragover events
      this.registerDomEvent(document, "dragover", (e) => {
        const line = (e.target as HTMLElement).closest(".HyperMD-task-line.cm-line");
        if (line?.hasClass("bases-tasks-selectable")) {
          e.preventDefault();
          e.dataTransfer!.dropEffect = "move";
          line.addClass("bases-tasks-selecting");
        }

        const day = (e.target as HTMLElement).closest("#calendar-container tbody td .day:not(.adjacent-month)");
        if (day) {
          e.preventDefault();
          if (day.hasClass("bases-tasks-selectable"))
            day.addClass("bases-tasks-selecting");
        }
      });

      // Handles dragleave events
      this.registerDomEvent(document, "dragleave", (e) => {
        const line = (e.target as HTMLElement).closest(".HyperMD-task-line.cm-line");
        line?.removeClass("bases-tasks-selecting");

        const day = (e.target as HTMLElement).closest("#calendar-container tbody td .day");
        day?.removeClass("bases-tasks-selecting");
      });

      // Handles drop events
      this.registerDomEvent(document, "drop", async (e) => {
        const line = (e.target as HTMLElement).closest(".HyperMD-task-line.cm-line");
        if(line){
          e.preventDefault();
          e.stopPropagation();
        }

        const day = (e.target as HTMLElement).closest("#calendar-container tbody td .day");
        const year = document.querySelector("#calendar-container .year");
        const month = document.querySelector("#calendar-container .month");
        if (day&&month&&year) {
          const targetDate = new Date(`${month.getText()} ${day.getText()} ${year.getText()}`);
          const dailyNotePath = `${this.settings.dailyNoteFolderPath}/${targetDate.toLocaleDateString("en-CA")}.md`;
          const lineNumber = parseInt(e.dataTransfer?.getData("application/x-bases-task-line")||"0")-1;
          const editor = this.app.workspace.activeEditor?.editor;
          const file = this.app.workspace.activeEditor?.file;
          if(!editor || !file || file.path === dailyNotePath || lineNumber<0)
            return;
          await moveTaskToNote(this, dailyNotePath, editor, [
            {line:lineNumber, ch:0},
            {line:lineNumber+1, ch:0}
          ]);
        }
      });
    }

    // On editor change event
    this.registerEvent(this.app.workspace.on("editor-change", async(editor, info)=>{
      if (!(info instanceof MarkdownView))
        return;

      // Leave a delay when saving tasks so it doesnt write to the not on every char change
      if(this.gettingTasksTimeoutID !== null)
        clearTimeout(this.gettingTasksTimeoutID);
      this.gettingTasksTimeoutID = setTimeout(()=>{
        if(this.settings.moveCompleted)
          sortTasks(editor);
        // Save tasks to properties
        updateCurrentFileTasks(editor);
      }, TYPE_DETECT_DELAY) as unknown as number;
    }));

    new EditorMenuEvent(this);

    this.addCommand({
      id:"move-task-to-daily-note",
      name:"Move task to daily note",
      callback:async()=>{
        const editor = this.app.workspace.activeEditor?.editor;
        if (!editor) {
          new Notice("No active editor");
          return;
        }
        const cursor = editor.getCursor();
        const targetLine = editor.getLine(cursor.line);
        if(!targetLine.match(TASK_REGEX)) {
          new Notice("Selection contains no valid tasks.")
          return;
        }
        const dailyNotePath = `${this.settings.dailyNoteFolderPath}/${new Date().toLocaleDateString("en-CA")}.md`;
        await moveTaskToNote(this, dailyNotePath, editor)
      }
    });

    this.addCommand({
      id:"sync-tasks",
      name:"Sync all vault tasks",
      callback:async()=>{
        await syncTasks(this.app.vault, this.logger);
      }
    });

    this.addSettingTab(new BasesTasksSettingTab(this.app, this));
  }

  async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<BasesTasksSettings>);
    if(this.settings.developerTools && this.settings.logging)
      this.logger = new Logger(this);
	}

  async saveSettings() {
    await this.saveData(this.settings);
  }
}



