import { Logger } from "Logger";
import { PROPERTIES_REGEX, TASK_REGEX } from "./constants";
import BasesTasks from "main";
import { App, Editor, EditorPosition, EditorSelection, getAllTags, Notice, parseYaml, stringifyYaml, Vault } from "obsidian";
import Properties from "Properties";
import { strArraysEqual } from "utils";

/**
 * 
 * @param plugin the main plugin
 * @param notePath the path to the note you want to move the task to
 * @param targetTasks the raw text of the task to move
 * @param editor the editor of the current note
 */
export async function moveTaskToNote(
  plugin:BasesTasks, 
  notePath:string,
  editor:Editor,
) {
  const cursor = editor.getCursor();
  const editorSelection:EditorSelection = editor.listSelections()[0] || {anchor:cursor,head:cursor};
  const selectedLines:[EditorPosition, EditorPosition] = [
    {
      line: Math.min(editorSelection.anchor.line, editorSelection.head.line),
      ch:0
    }, 
    {
      line: Math.max(editorSelection.anchor.line, editorSelection.head.line)+1,
      ch:0
    }
  ];
  const taskNote = editor.getValue();
  const properties = getProperties(taskNote);
  const targetLines = editor
    .getRange(...selectedLines)
    .split("\n")
  ;
  const targetTasks = targetLines.filter(l=>l&&l.match(TASK_REGEX));
  targetTasks.forEach(task=>
    plugin.logger?.log(`Moving "${task.slice(6)}" to "${notePath}"`)
  );

  // Find the target note
  const file = plugin.app.vault.getFileByPath(notePath);
  if(!file){
    new Notice(notePath+" not found");
    plugin.logger?.log(`"${notePath}" not found`);
    return;
  }

  // Add the note tags to the tasks being moved
  let newTasks:string[] = [];
  targetTasks.forEach(task=>{
    let filteredTags = properties.tags?.filter(t=>!task.match(new RegExp(`#${t}\\b`)))||[];
    // Filter out user specified tags
    if(plugin.settings.taskTagsToIgnore)
      filteredTags = filteredTags.filter(t=>!plugin.settings.taskTagsToIgnore.split(",").includes("#"+t));
    // Don't add them if the setting is not enabled
    if(plugin.settings.moveToDailyWithTags && filteredTags.length)
      task += " #" + filteredTags.join(" #");
    newTasks.push(task);
  });
  

  // Splice in the targeted task after the last task in the target note or at the end
  const rawFile = await plugin.app.vault.read(file);
  const splitFile = rawFile.split("\n");
  splitFile.reverse();
  let match = false;
  for (let i = 0; i < splitFile.length; i++){
    const line = splitFile[i];
    if(!line?.match(TASK_REGEX))
      continue;
    splitFile.splice(i,0,newTasks.join("\n"));
    match = true;
    break;
  }
  splitFile.reverse();
  if(!match)
    splitFile.push(newTasks.join("\n"));

  // Update the properties, then update the note
  await plugin.app.vault.modify(file,updateRawFileTasks(splitFile.join("\n")));

  // Remove task from current note
  editor.replaceRange(
    targetLines.filter(l=>!l.match(TASK_REGEX)).join("\n"), 
    ...selectedLines
  );
  const line = Math.min(cursor.line, editor.getValue().split("\n").length);
  const ch = Math.min(cursor.ch, editor.getLine(line).length);

  editor.setCursor({line,ch});
  new Notice("Task moved");
  plugin.logger?.log(`Moved ${targetTasks.length} task(s) to "${notePath}"`);
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
 * Gets the properties from a note and updates the task list based on the content
 * @param rawFile the raw text of the note to get the properties from
 * @returns the updated properties object based on the 
 */
function getUpdatedProperties(rawFile:string): Properties {
  const splitFile = rawFile.split("\n");
  const tasks = splitFile.filter(line=>line.match(TASK_REGEX));
  const properties = getProperties(rawFile);
  properties["tasks"] = tasks;
  return properties;
}


/**
 * Takes in the raw contents of a note, and updates the tasks property based on the content
 * @param rawFile the raw note contents
 * @returns the updated note
 */
export function updateRawFileTasks(rawFile:string):string {
  const splitFile = rawFile.split("\n");
  const tasks = splitFile.filter(line=>line.match(TASK_REGEX));
  const properties = getUpdatedProperties(rawFile);
  if(strArraysEqual(properties["tasks"], tasks))
    return rawFile;
  const propertylessFile = rawFile.replace(PROPERTIES_REGEX,"");
  const newFile = `---\n${stringifyYaml(properties)}\n---\n${propertylessFile}`;
  return newFile;
}

/**
 * Updates the tasks properties for the currently open file
 * @param editor the editor of the current file
 */
export function updateCurrentFileTasks(editor:Editor):void {
  const rawFile = editor.getValue();
  const oldProperties = getProperties(rawFile);
  const newProperties = getUpdatedProperties(rawFile);
  // If no new tasks, exit out
  if(strArraysEqual(oldProperties["tasks"], newProperties["tasks"]))
    return;
  const endLine = (rawFile.match(PROPERTIES_REGEX)?.[0].split("\n").length||1)-1;
  editor.replaceRange(
    `---\n${stringifyYaml(newProperties)}\n---\n`,
    {line:0,ch:0},
    {line:endLine,ch:0}
  );
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
    const newFile = updateRawFileTasks(rawFile);
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