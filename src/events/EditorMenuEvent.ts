import { moveTaskToDailyNote } from "commands";
import { TASK_REGEX } from "../constants";
import BasesTasks from "main";
import { Menu, Editor, MarkdownView } from "obsidian";

/**
 * Register an editor-menu event
 */
export default class EditorMenuEvent {
  plugin:BasesTasks;

  constructor(plugin:BasesTasks) {
    this.plugin = plugin;
    this.register();
  }


  register() {
    // Add editor menu items
    this.plugin.registerEvent(
      this.plugin.app.workspace.on(
        "editor-menu",
        (menu: Menu, editor: Editor) => {
          const cursor = editor.getCursor();
          const targetLine = editor.getLine(cursor.line);
          const dailyNotePath = `${this.plugin.settings.dailyNoteFolderPath}/${new Date().toLocaleDateString("en-CA")}.md`;
          const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
          this.addMoveToDailyNote(menu,editor,targetLine,dailyNotePath,view||undefined);
          
        }
      )
    );
  }

  addMoveToDailyNote(
    menu:Menu, 
    editor:Editor,
    targetLine:string, 
    dailyNotePath:string,
    view?: MarkdownView
  ) {
    if(
      this.plugin.settings.dailyNoteFolderPath && // Make sure the user has enabled the move to daily note option
      this.plugin.settings.moveToDailyOption && 
      targetLine.match(TASK_REGEX) && // they are clicking on a task
      (view?.file?.path !== dailyNotePath) // and they are not already in the daily note
    )
      menu.addItem((item) => {
        // move to daily note menu option
        item
          .setTitle("Move to daily note")
          .setIcon("calendar")
          .onClick(async () => {
            await moveTaskToDailyNote(this.plugin, dailyNotePath, targetLine, editor);
          });
      });
  }
}