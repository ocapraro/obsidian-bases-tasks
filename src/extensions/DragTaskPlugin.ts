import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, PluginSpec, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { TASK_REGEX } from '../constants';
import { DragTaskWidget } from 'widgets/DragTaskWidget';

class DragTaskPlugin implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  destroy() {}

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const doc = view.state.doc;
    
    for (let i = 1; i <= doc.lines; i++) {
      const line = doc.line(i);
      const text = line.text;

      if(!text.match(TASK_REGEX))
        continue;

      builder.add(
        line.from,
        line.from,
        Decoration.widget({
          widget: new DragTaskWidget(i),
          side: -1,
        })
      );
    }

    return builder.finish();
  }
}

const pluginSpec: PluginSpec<DragTaskPlugin> = {
  decorations: (value: DragTaskPlugin) => value.decorations,
};

export const dragTaskPlugin = ViewPlugin.fromClass(
  DragTaskPlugin,
  pluginSpec
);