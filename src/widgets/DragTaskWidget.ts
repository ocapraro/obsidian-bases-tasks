import { ChangeSpec } from '@codemirror/state';
import { EditorView, WidgetType } from '@codemirror/view';
import { TASK_REGEX } from '../constants';

export class DragTaskWidget extends WidgetType {

  constructor(private lineNumber:number) {
    super();
  }

  toDOM(view:EditorView): HTMLElement {
    const span = document.createElement('span');
    span.appendText("⋮⋮");
    span.classList.add("task-drag-widget");
    span.draggable = true;

    const line = view.state.doc.line(this.lineNumber);

    let draggingLineNumber:number|null = null;

    document.querySelectorAll(".HyperMD-task-line.cm-line").forEach(line=>{
      line.addEventListener("dragover",()=>{
        if(draggingLineNumber !== null)
          line.addClass("bases-tasks-selectable");
      });
      line.addEventListener("dragleave",()=>{
        if(draggingLineNumber !== null)
          line.removeClass("bases-tasks-selectable");
      });
    });

    span.addEventListener("dragstart", (e) => {
      const targetLineElement = (e.target as HTMLElement)?.closest(".cm-line");
      e.dataTransfer?.setData("text/plain", String(this.lineNumber));
      e.dataTransfer!.effectAllowed = "move";
      draggingLineNumber = this.lineNumber;
      setTimeout(() => {
        targetLineElement?.addClass("bases-tasks-hidden");
      }, 0);
    });

    span.addEventListener("dragend", (e)=>{
      e.preventDefault();
      const sourceLineElement = (e.target as HTMLElement)?.closest(".cm-line");
      draggingLineNumber = null;
      sourceLineElement?.removeClass("bases-tasks-hidden");
      document.querySelectorAll(".HyperMD-task-line.cm-line.bases-tasks-selectable").forEach(line=>{
        line.removeClass("bases-tasks-selectable");
      });
      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      if(!pos)
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