import { useCommander } from "./plugins/command.plugin";
import { VisualEditorBlockData } from "./visual-editor.utils";
import { VisualEditorModelValue } from '@/packages/visual-editor.utils';

// 注册命令
export function useVisualCommand({
  focusData,
  updateBlocks,
  dataModel,
}: {
  focusData: {
    value: {
      focus: VisualEditorBlockData[],
      unFocus: VisualEditorBlockData[],
    }
  },
  updateBlocks: (blocks: VisualEditorBlockData[]) => void,
  dataModel: { value: VisualEditorModelValue },
}) {
  const commander = useCommander();

  commander.registry({
    name: 'delete',
    keyboard: [
      'backspace',
      'delete',
      'ctrl+d'
    ],
    execute: () => {
      let data = {
        before: dataModel.value.blocks || [],
        after: focusData.value.unFocus,
      }
      return {
        redo: () => {
          updateBlocks(data.after);
        },
        undo: () => {
          updateBlocks(data.before);
        },
      }
    }
  });

  return {
    undo: () => commander.state.commands.undo(),
    redo: () => commander.state.commands.redo(),
    delete: () => commander.state.commands.delete(),
  }
}
