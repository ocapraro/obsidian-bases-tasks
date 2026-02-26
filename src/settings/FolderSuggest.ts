import { AbstractInputSuggest, TFolder } from "obsidian";

// Folder suggestion task when searching for a folder
export default class FolderSuggest extends AbstractInputSuggest<TFolder> {  
  private onSelectCallback?: (folder: TFolder, evt: MouseEvent | KeyboardEvent) => void;
  protected getSuggestions(query: string): TFolder[] | Promise<TFolder[]> {
    return this.app.vault.getAllFolders().filter(folder=>folder.name.toLowerCase().includes(query.toLowerCase()));
  }
  renderSuggestion(tFolder: TFolder, el: HTMLElement): void {
    el.setText(tFolder.path);
  }

  onSelect(callback: (folder: TFolder, evt: MouseEvent | KeyboardEvent) => void): this {
    this.onSelectCallback = callback;
    return this;
  }

  selectSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
    this.setValue(folder.path);
    this.onSelectCallback?.(folder, evt)
    this.close();
  }
}