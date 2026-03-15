import { WidgetType } from '@codemirror/view';

export class DragTaskWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.classList.add("task-drag-widget");
    return span;
  }
}