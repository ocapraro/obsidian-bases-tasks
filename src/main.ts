import EditorMenuEvent from './events/EditorMenuEvent';
import { TYPE_DETECT_DELAY } from './constants';
import {getAllTags, MarkdownView, Notice, Plugin} from 'obsidian';
import { BasesTasksSettings, BasesTasksSettingTab, DEFAULT_SETTINGS } from 'settings/settings';
import { moveTaskToDailyNote, saveTasks } from 'commands';



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
        saveTasks(editor);
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
        const dailyNotePath = `${this.settings.dailyNoteFolderPath}/${new Date().toLocaleDateString("en-CA")}.md`;
        await moveTaskToDailyNote(this, dailyNotePath, targetLine, editor)
      }
    });
    this.addSettingTab(new BasesTasksSettingTab(this.app, this));
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



