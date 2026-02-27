import { TASK_REGEX } from "./constants";
import BasesTasks from "main";
import { Editor, EditorPosition, Notice } from "obsidian";
import Properties from "Properties";

export async function moveTaskToDailyNote(
  plugin:BasesTasks, 
  dailyNotePath:string,
  targetTask:string,
  properties:Properties,
  editor:Editor,
  cursor:EditorPosition
) {
  // Find the daily note
  const file = plugin.app.vault.getFileByPath(dailyNotePath);
  if(!file){
    new Notice("No daily note found");
    return;
  }
  let newTask = targetTask;
  let filteredTags = properties.tags?.filter(t=>!newTask.match(new RegExp(`#${t}\\b`)))||[];
  if(plugin.settings.taskTagsToIgnore)
    filteredTags = filteredTags.filter(t=>!plugin.settings.taskTagsToIgnore.split(",").includes("#"+t));
  if(plugin.settings.moveToDailyWithTags && filteredTags.length)
    newTask += " #" + filteredTags.join(" #");
  // splice in the targeted task after the last task in the daily note or at the end
  const rawFile = await plugin.app.vault.read(file);
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
  await plugin.app.vault.modify(file,plugin.updateFileTasks(splitFile.join("\n")));

  // remove task from current note
  editor.replaceRange(
    "", 
    { line: cursor.line, ch: 0 },
    { line: cursor.line + 1, ch: 0 }
  );
  const line = Math.min(cursor.line, editor.getValue().split("\n").length);
  const ch = Math.min(cursor.ch, editor.getLine(line).length);

  editor.setCursor({line,ch});
  new Notice("Task moved");
}