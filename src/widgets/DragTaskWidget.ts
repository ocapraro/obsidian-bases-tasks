import { ChangeSpec } from '@codemirror/state';
import { EditorView, WidgetType } from '@codemirror/view';
import { TASK_REGEX } from '../constants';

/**
 * The widget that controls dragging tasks
 */
export class DragTaskWidget extends WidgetType {
  constructor(private lineNumber:number) {
    super();
  }

  toDOM(view:EditorView): HTMLElement {
    const span = document.createElement('span');
    span.appendText("⋮⋮");
    span.classList.add("task-drag-widget");
    span.draggable = true;


    span.addEventListener("dragstart", (e) => {
      const targetLineElement = (e.target as HTMLElement)?.closest(".cm-line");
      e.dataTransfer?.setData("application/x-bases-task-line", String(this.lineNumber));
      e.dataTransfer!.effectAllowed = "move";
      document.querySelectorAll(`
        .HyperMD-task-line.cm-line,
        #calendar-container tbody td .day
      `).forEach(elem=>{
        elem.addClass("bases-tasks-selectable");
      });
      setTimeout(() => {
        targetLineElement?.addClass("bases-tasks-hidden");
      }, 0);
    });

    span.addEventListener("dragend", (e)=>{
      e.preventDefault();
      const sourceLineElement = (e.target as HTMLElement)?.closest(".cm-line");
      sourceLineElement?.removeClass("bases-tasks-hidden");
      document.querySelectorAll(`
        .HyperMD-task-line.cm-line.bases-tasks-selectable,
        #calendar-container tbody td .day.bases-tasks-selectable
      `).forEach(elem=>{
        elem.addClass("bases-tasks-selectable");
        elem.removeClass("bases-tasks-selecting");
      });

      const rect = view.dom.getBoundingClientRect();
      const insideEditor =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      // Exit out if not dragged to a valid task line
      if(!insideEditor || !pos)
        return;

      const sourceLine = view.state.doc.line(this.lineNumber);
      const targetLine = view.state.doc.lineAt(pos);
      
      // Don't edit if not rearranging tasks, or if no change
      if (sourceLine.number === targetLine.number || !targetLine.text.match(TASK_REGEX)) 
        return;

      const changes:ChangeSpec[] = [{from:sourceLine.from, to:Math.min(sourceLine.to+1, view.state.doc.length), insert:""}];
      // If dragging from above, slot below and visa versa
      if (sourceLine.to<targetLine.from) {
        changes.push({from:targetLine.to, insert:"\n"+sourceLine.text});
      } else {
        changes.push({from:targetLine.from, insert:sourceLine.text+"\n"});
      }
      view.dispatch({
        changes
      });
    })

    return span;
  }
}