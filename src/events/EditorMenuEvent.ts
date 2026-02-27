import { TASK_REGEX } from "../constants";
import BasesTasks from "main";
import { Menu, Editor, MarkdownView, Notice, EditorPosition } from "obsidian";

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
          const properties = this.plugin.getProperties(editor.getValue());
          this.addMoveToDailyNote(menu,editor,cursor,targetLine,dailyNotePath,properties,view||undefined);
          
        }
      )
    );
  }

  addMoveToDailyNote(
    menu:Menu, 
    editor:Editor,
    cursor:EditorPosition,
    targetLine:string, 
    dailyNotePath:string, 
    properties: {
      tasks: string[];
      tags?: string[];
    },
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
            // Find the daily note
            const file = this.plugin.app.vault.getFileByPath(dailyNotePath);
            if(!file){
              new Notice("No daily note found");
              return;
            }
            let newTask = targetLine;
            let filteredTags = properties.tags?.filter(t=>!newTask.match(new RegExp(`#${t}\\b`)))||[];
            if(this.plugin.settings.taskTagsToIgnore)
              filteredTags = filteredTags.filter(t=>!this.plugin.settings.taskTagsToIgnore.split(",").includes("#"+t));
            if(this.plugin.settings.moveToDailyWithTags && filteredTags.length)
              newTask += " #" + filteredTags.join(" #");
            // splice in the targeted task after the last task in the daily note or at the end
            const rawFile = await this.plugin.app.vault.read(file);
            const splitFile = rawFile.split("\n");
            splitFile.reverse();
            let match = false;
            for (let i = 0; i < splitFile.length; i++){
              const line = splitFile[i];
              if(!line?.match(TASK_REGEX))
                continue;
              splitFile.splice(i,0,newTask);
              match = true;
              break;
            }
            splitFile.reverse();
            if(!match)
              splitFile.push(newTask);

            // update the properties, then update the note
            await this.plugin.app.vault.modify(file,this.plugin.updateFileTasks(splitFile.join("\n")));

            // remove task from current note
            editor.replaceRange(
              "", 
              { line:cursor.line, ch: 0 },
              { line: cursor.line + 1, ch: 0 }
            );
            const line = Math.min(cursor.line, editor.getValue().split("\n").length);
            const ch = Math.min(cursor.ch, editor.getLine(line).length);

            editor.setCursor({line,ch});
            new Notice("Task moved");
          });
      });
  }
}