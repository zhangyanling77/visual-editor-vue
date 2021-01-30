import { useCommander } from "./command.plugin";
import { VisualEditorBlockData, VisualEditorModelValue } from "../visual-editor.utils";
import deepcopy from 'deepcopy';

// 注册命令
export function useVisualCommand({
  focusData,
  updateBlocks,
  dataModel,
  dragstart,
  dragend,
}: {
  focusData: {
    value: { focus: VisualEditorBlockData[], unFocus: VisualEditorBlockData[] },
  },
  updateBlocks: (blocks: VisualEditorBlockData[]) => void,
  dataModel: { value: VisualEditorModelValue },
  dragstart: { on: (cb: () => void) => void, off: (cb: () => void) => void },
  dragend: { on: (cb: () => void) => void, off: (cb: () => void) => void },
}) {
  const commander = useCommander();
  /** 注册删除命令 */
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
          updateBlocks(deepcopy(data.after));
        },
        undo: () => {
          updateBlocks(deepcopy(data.before));
        },
      }
    }
  });

  /**
   * 拖拽命令，适用于三种情况：
   * 1.从菜单拖拽组件到容器画布
   * 2.在容器中拖拽组件调整位置
   * 3.拖拽调整组件的宽度和高度
  */
  commander.registry({
    name: 'drag',
    init() {
      this.data = { before: null as null | VisualEditorBlockData[] };
      const handler = {
        dragstart: () => this.data.before = deepcopy(dataModel.value.blocks || []),
        dragend: () => commander.state.commands.drag(),
      }
      dragstart.on(handler.dragstart);
      dragend.on(handler.dragend);
      return () => {
        dragstart.off(handler.dragstart);
        dragend.off(handler.dragend);
      }
    },
    execute() {
      let before = this.data.before;
      let after = deepcopy(dataModel.value.blocks || []);
      return {
        redo: () => {
          updateBlocks(deepcopy(after));
        },
        undo: () => {
          updateBlocks(deepcopy(before));
        },
      }
    }
  });

  commander.registry({
    name: 'clear',
    execute: () => {
      let data = {
        before: deepcopy(dataModel.value.blocks || []),
        after: deepcopy([]),
      }
      return {
        redo: () => {
          updateBlocks(deepcopy(data.after));
        },
        undo: () => {
          updateBlocks(deepcopy(data.before));
        }
      }
    }
  });

  commander.registry({
    name: 'placeTop',
    keyboard: 'ctrl+up',
    execute: () => {
      let data = {
        before: deepcopy(dataModel.value.blocks || []),
        after: deepcopy((() => {
          const { focus, unFocus } = focusData.value;
          const maxZIndex = unFocus.reduce((prev, block) => Math.max(prev, block.zIndex), -Infinity) + 1;
          focus.forEach(block => block.zIndex = maxZIndex);
          return deepcopy(dataModel.value.blocks || []);
        })()),
      };
      return {
        redo: () => {
          updateBlocks(deepcopy(data.after));
        },
        undo: () => {
          updateBlocks(deepcopy(data.before));
        },
      }
    },
  });

  commander.registry({
    name: 'placeBottom',
    keyboard: 'ctrl+down',
    execute: () => {
      let data = {
        before: deepcopy(dataModel.value.blocks || []),
        after: deepcopy((() => {
          const { focus, unFocus } = focusData.value;
          let minZIndex = unFocus.reduce((prev, block) => Math.min(prev, block.zIndex), Infinity) - 1;
          if (minZIndex < 0) {
            const dur = Math.abs(minZIndex);
            unFocus.forEach(block => block.zIndex += dur);
            minZIndex = 0;
          }
          focus.forEach(block => block.zIndex = minZIndex);
          return deepcopy(dataModel.value.blocks || []);
        })()),
      };
      return {
        redo: () => {
          updateBlocks(deepcopy(data.after));
        },
        undo: () => {
          updateBlocks(deepcopy(data.before));
        },
      }
    },
  });

  commander.registry({
    name: 'updateBlock',
    execute: (newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => {
      let blocks = deepcopy(dataModel.value.blocks || []);
      let data = {
        before: blocks,
        after: (() => {
          blocks = [...blocks];
          const index = dataModel.value.blocks!.indexOf(oldBlock);
          if (index > -1) {
            blocks.splice(index, 1, newBlock);
          }
          return deepcopy(blocks);
        })(),
      }
      return {
        redo: () => {
          updateBlocks(deepcopy(data.after))
        },
        undo: () => {
            updateBlocks(deepcopy(data.before))
        },
      }
    }
  });

  commander.init();

  return {
    undo: () => commander.state.commands.undo(),
    redo: () => commander.state.commands.redo(),
    delete: () => commander.state.commands.delete(),
    clear: () => commander.state.commands.clear(),
    placeTop: () => commander.state.commands.placeTop(),
    placeBottom: () => commander.state.commands.placeBottom(),
    updateBlock: (newBlock: VisualEditorBlockData, oldBlock: VisualEditorBlockData) => commander.state.commands.updateBlock(newBlock, oldBlock),
  }
}
