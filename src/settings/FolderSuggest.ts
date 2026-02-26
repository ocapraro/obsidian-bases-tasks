import { AbstractInputSuggest, TFolder } from "obsidian";

// Folder suggestion task when searching for a folder
export default class FolderSuggest extends AbstractInputSuggest<TFolder> {  
  private onSelectCallback?: (folder: TFolder, evt: MouseEvent | KeyboardEvent) => void | Promise<void>;
  protected getSuggestions(query: string): TFolder[] | Promise<TFolder[]> {
    return this.app.vault.getAllFolders(true).filter(folder=>folder.name.toLowerCase().includes(query.toLowerCase()));
  }
  renderSuggestion(tFolder: TFolder, el: HTMLElement): void {
    el.setText(tFolder.path);
  }

  onSelect(callback: (folder: TFolder, evt: MouseEvent | KeyboardEvent) => void | Promise<void>): this {
    this.onSelectCallback = callback;
    return this;
  }

  selectSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
    this.setValue(folder.path);
    void this.onSelectCallback?.(folder, evt);
    this.close();
  }
}