import { WidgetType } from '@codemirror/view';

export class DragTaskWidget extends WidgetType {

  constructor(private lineNumber:number) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.classList.add("task-drag-widget");
    span.draggable = true;

    span.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", String(this.lineNumber));
      e.dataTransfer!.effectAllowed = "move";
    });

    return span;
  }
}