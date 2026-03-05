import { Logger } from "Logger";
import { PROPERTIES_REGEX, TASK_REGEX } from "./constants";
import BasesTasks from "main";
import { App, Editor, getAllTags, Notice, parseYaml, stringifyYaml, Vault } from "obsidian";
import Properties from "Properties";
import { strArraysEqual } from "utils";

/**
 * 
 * @param plugin the main plugin
 * @param notePath the path to the note you want to move the task to
 * @param targetTask the raw text of the task to move
 * @param editor the editor of the current note
 */
export async function moveTaskToNote(
  plugin:BasesTasks, 
  notePath:string,
  targetTask:string,
  editor:Editor,
) {
  plugin.logger?.log(`Moving "${targetTask.slice(6)}" to "${notePath}"`);
  const cursor = editor.getCursor();
  const taskNote = editor.getValue();
  const properties = getProperties(taskNote);
  // Find the daily note
  const file = plugin.app.vault.getFileByPath(notePath);
  if(!file){
    new Notice(notePath+" not found");
    plugin.logger?.log(`"${notePath}" not found`);
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
  await plugin.app.vault.modify(file,updateFileTasks(splitFile.join("\n")));

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
  plugin.logger?.log(`Moved "${targetTask.slice(6)}" to "${notePath}"`);
}

/**
 * Get the properties from a note
 * @param rawFile The raw text of the note to get the properties from
 * @returns the note properties
 */
export function getProperties(rawFile:string):Properties {
  const match = rawFile.match(PROPERTIES_REGEX);
  const properties = match?.[1];
  const parsedProperties = parseYaml(properties||"tasks:") as {tasks:string[]};
  if(!parsedProperties["tasks"])
    return {...parsedProperties, tasks:[]};
  return parsedProperties;
}


/**
 * Takes in the raw contents of a note, and updates the tasks property based on the content
 * @param rawFile the raw note contents
 * @returns the updated note
 */
export function updateFileTasks(rawFile:string) {
  const splitFile = rawFile.split("\n");
  const tasks = splitFile.filter(line=>line.match(TASK_REGEX));
  const properties = getProperties(rawFile);
  if(strArraysEqual(properties["tasks"], tasks))
    return rawFile;
  properties["tasks"] = tasks;
  const propertylessFile = rawFile.replace(PROPERTIES_REGEX,"");
  const newFile = `---\n${stringifyYaml(properties)}\n---\n${propertylessFile}`;
  return newFile;
}

/**
 * Extracts the tasks from the current note body, and saves them as a property
 * @param editor the editor of the current note
 * @returns 
 */
export function saveTasks(editor:Editor) {
  const rawFile = editor.getValue();
  const newFile = updateFileTasks(rawFile);

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

/**
 * Go to each note in a vault, scan it for tasks, and add them as a property.
 * @param vault the vault to search through
 */
export async function syncTasks(vault:Vault, logger?:Logger) {
  logger?.log("Syncing tasks...");
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
    const newFile = updateFileTasks(rawFile);
    if (rawFile == newFile)
      continue;

    await vault.modify(file,newFile);
  }
  notif.hide();
  new Notice("Syncing complete!", 3000);
  logger?.log("Syncing complete!");
}

export function getAllVaultTags(app:App): Set<string> {
  const tags = new Set<string>();
  
  for (const file of app.vault.getMarkdownFiles()) {
    const cache = app.metadataCache.getFileCache(file);
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