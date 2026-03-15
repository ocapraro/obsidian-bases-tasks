import { EditorView, WidgetType } from '@codemirror/view';

export class DragTaskWidget extends WidgetType {

  constructor(private lineNumber:number) {
    super();
  }

  toDOM(view:EditorView): HTMLElement {
    const span = document.createElement('span');
    span.classList.add("task-drag-widget");
    span.draggable = true;

    span.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", String(this.lineNumber));
      e.dataTransfer!.effectAllowed = "move";
    });

    span.addEventListener("dragend", (e)=>{
      e.preventDefault();
      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      if(!pos)
        return;

      const sourceLine = view.state.doc.line(this.lineNumber);
      const targetLine = view.state.doc.lineAt(pos);
      
      if (sourceLine.number === targetLine.number) 
        return;

      view.dispatch({
        changes:[
          {from:sourceLine.from, to:Math.min(sourceLine.to+1, ), insert:""},
          {from:targetLine.from, insert:sourceLine.text+"\n"}
        ]
      });
    })

    return span;
  }
}