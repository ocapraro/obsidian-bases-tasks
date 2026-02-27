import { AbstractInputSuggest, App } from "obsidian";

/**
 * A input suggestor to select multiple tags
 */
export default class TagMultiSelect extends AbstractInputSuggest<string> {
  private onSelectCallback?: (tag: string, evt: MouseEvent | KeyboardEvent) => void | Promise<void>;
  private tags:string[];

  constructor(app:App, textInputEl: HTMLInputElement | HTMLDivElement, tags?:string[]) {
    super(app,textInputEl);
    this.tags = tags||[];
  }

  onSelect(callback: (tag: string, evt: MouseEvent | KeyboardEvent) => any): this {
    this.onSelectCallback = callback;
    return this;
  }

  protected getSuggestions(query: string): string[] | Promise<string[]> {
    const splitQuery = query.split(",").map(t=>t.trim());
    splitQuery.reverse();
    return this.tags.filter(t=>t.toLowerCase().includes(splitQuery[0]?.toLowerCase()||""))
  }

  renderSuggestion(tag: string, el: HTMLElement): void {
    el.setText(tag);
  }

  selectSuggestion(tag: string, evt: MouseEvent | KeyboardEvent): void {
    this.setValue(this.getValue()+","+tag);
    this.onSelectCallback?.(tag,evt);
    this.close();
  }

}