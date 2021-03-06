import { computed, defineComponent, PropType, ref, reactive, provide, inject } from 'vue';
import {
  createNewBlock,
  VisualEditorBlockData,
  VisualEditorComponent,
  VisualEditorConfig,
  VisualEditorModelValue,
  VisualEditorMarkLines,
  VisualDragProvider,
} from '@/packages/visual-editor.utils';
import { useModel } from '@/packages/utils/useModel';
import { VisualEditorBlock } from '@/packages/visual-editor-block';
import { useVisualCommand } from './plugins/visual.command';
import { createEvent } from './plugins/event';
import { $$dialog } from '@/packages/utils/dialog-service';
import { ElMessageBox } from 'element-plus';
import { $$dropdown, DropdownOption } from '@/packages/utils/dropdown-service';
import './visual-editor.scss';
import { VisualOperatorEditor } from '@/packages/visual-editor-operator';

export const VisualEditor = defineComponent({
  props: {
    modelValue: { type: Object as PropType<VisualEditorModelValue>, required: true },
    config: { type: Object as PropType<VisualEditorConfig>, required: true },
    formData: {type: Object as PropType<Record<string, any>>, required: true},
    customProps: {type: Object as PropType<Record<string, any>>},
  },
  emits: {
    'update:modelValue': (val?: VisualEditorModelValue) => true,
  },
  components: {
    VisualEditorBlock,
  },
  setup(props, ctx) {
    /** 双向绑定值，容器中的组件数据 */
    const dataModel = useModel(() => props.modelValue, val => ctx.emit('update:modelValue', val));
    /*conainer节点dom对象的引用 */
    const containerRef = ref({} as HTMLDivElement);
    /*container节点的style样式对象 */
    const containerStyles = computed(() => ({
      width: `${dataModel.value.container.width}px`,
      height: `${dataModel.value.container.height}px`,
    }));
    /*计算选中与未选中的block数据 */
    const focusData = computed(() => {
      let focus: VisualEditorBlockData[] = [];
      let unFocus: VisualEditorBlockData[] = [];
      (dataModel.value.blocks || []).forEach(block => (block.focus ? focus : unFocus).push(block));
      return {
        focus, // 此时选中的数据
        unFocus, // 此时未选中的数据
      }
    });
    const selectIndex = ref(-1);
    const state = reactive({
      selectBlock: computed(() => (dataModel.value.blocks || [])[selectIndex.value]),
      preview: false, // 当前是否正在预览
      editing: true, // 当前是否已经开启了编程
    });

    const classes = computed(() => [
      'visual-editor',
        {
            'visual-editor-not-preview': !state.preview,
        }
    ]);

    const dragstart = createEvent();
    const dragend = createEvent();
    VisualDragProvider.provide({dragstart, dragend});

    /*对外暴露的一些方法 */
    const methods = {
      openEdit: () => state.editing = true,
      clearFocus: (block?: VisualEditorBlockData) => {
        let blocks = (dataModel.value.blocks || []);
        if (blocks.length === 0) return;
        if (!!block) {
          blocks = blocks.filter(item => item !== block);
        }
        blocks.forEach(block => block.focus = false);
      },
      updateBlocks: (blocks?: VisualEditorBlockData[]) => {
        dataModel.value = { ...dataModel.value, blocks };
      },
      showBlockData: (block: VisualEditorBlockData) => {
        $$dialog.textarea(JSON.stringify(block), '节点数据', { editReadonly: true });
      },
      importBlockData: async (block: VisualEditorBlockData) => {
        const text = await $$dialog.textarea('', '请输入节点JSON字符串');
        try {
          const data = JSON.parse(text || '');
          commander.updateBlock(data, block);
        } catch (e) {
          console.error(e);
          ElMessageBox.alert('解析JSON字符串出错');
        }
      }, 
    };
    /*处理从菜单拖拽组件到容器的相关动作 */
    const menuDraggier = (() => {
      let component = null as null | VisualEditorComponent;
      const blockHandler = {
        /* 处理拖拽菜单组件开始事件*/
        dragestart: (e: DragEvent, current: VisualEditorComponent) => {
          containerRef.value.addEventListener('dragenter', containerHandler.dragenter);
          containerRef.value.addEventListener('dragover', containerHandler.dragover);
          containerRef.value.addEventListener('dragleave', containerHandler.dragleave);
          containerRef.value.addEventListener('drop', containerHandler.drop);
          component = current;
          dragstart.emit();
        },
        /*处理拖拽菜单组件结束事件*/
        dragend: (e: DragEvent) => {
          containerRef.value.removeEventListener('dragenter', containerHandler.dragenter);
          containerRef.value.removeEventListener('dragover', containerHandler.dragover);
          containerRef.value.removeEventListener('dragleave', containerHandler.dragleave);
          containerRef.value.removeEventListener('drop', containerHandler.drop);
          component = null;
        },
      };
      const containerHandler = {
        /*拖拽菜单组件，进入容器的时候，设置鼠标为可放置状态*/
        dragenter: (e: DragEvent) => e.dataTransfer!.dropEffect = 'move',
        /*拖拽菜单组件，鼠标在容器中移动的时候，禁用默认事件*/
        dragover: (e: DragEvent) => e.preventDefault(),
        /*如果拖拽过程中，鼠标离开了容器，设置鼠标为不可放置的状态*/
        dragleave: (e: DragEvent) => e.dataTransfer!.dropEffect = 'none',
        /*在容器中放置的时候，通过事件对象的 offsetX，和offsetY添加一条组件数据*/
        drop: (e: DragEvent) => {
          const blocks = [...dataModel.value.blocks || []];
          blocks.push(createNewBlock({ component: component!, top: e.offsetY, left: e.offsetX }));
          methods.updateBlocks(blocks);
          dragend.emit();
        },
      };
      return blockHandler;
    })();
    /*处理block选中的相关动作*/
    const focusHandler = (() => {
      return {
        container: {
          onMousedown: (e: MouseEvent) => {
            if (state.preview) return;
            e.preventDefault();
            if (e.currentTarget !== e.target) return;
            if (!e.shiftKey) {
              /*点击空白处，清空所有选中的block */
              methods.clearFocus();
              selectIndex.value = -1;
            }
          },
        },
        block: {
          onMousedown: (e: MouseEvent, block: VisualEditorBlockData, index: number) => {
            if (state.preview) return;
            if (e.shiftKey) {
              /*如果摁住了shift键，如果此时没有选中的block，就选中这个block，否则令这个block的选中状态取反*/
              if (focusData.value.focus.length <= 1) {
                  block.focus = true
              } else {
                  block.focus = !block.focus
              }
            } else {
              /*如果点击的这个block没有被选中，才清空其他选中的block，否则不做任何事情。防止拖拽多个block，取消其他block的选中状态*/
              if (!block.focus) {
                block.focus = true;
                methods.clearFocus(block);
              }
            }
            selectIndex.value = index;
            blockDraggier.mousedown(e);
          },
        },
      }
    })();
    /*处理block在container中拖拽移动的相关动作 */
    const blockDraggier = (() => {
      // 标记
      const mark = reactive({
        x: null as null | number,
        y: null as null | number,
      });

      let dragState = {
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        startPos: [] as { top: number, left: number }[],
        dragging: false,
        markLines: {} as VisualEditorMarkLines,
      };
      const mousedown = (e: MouseEvent) => {
        dragState = {
          startX: e.clientX,
          startY: e.clientY,
          startLeft: state.selectBlock!.left,
          startTop: state.selectBlock!.top,
          startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
          dragging: false,
          markLines: (() => {
            const { unFocus } = focusData.value;
            const { width, height } = state.selectBlock!;
            let lines: VisualEditorMarkLines = { x: [], y: [] };
            [...unFocus, {
                top: 0,
                left: 0,
                width: dataModel.value.container.width,
                height: dataModel.value.container.height,
            }].forEach(block => {
              const { top: t, left: l, width: w, height: h} = block;
              // 辅助线
              lines.y.push({ top: t, showTop: t }); // 顶部对齐顶部
              lines.y.push({ top: t + h , showTop: t + h }); // 顶部对齐底部
              lines.y.push({ top: t + h / 2 - height / 2, showTop: t + h /2 }); // 中间对齐中间，垂直
              lines.y.push({ top: t - height, showTop: t }); // 底部对齐顶部
              lines.y.push({ top: t + h - height, showTop: t + h }); //  底部对齐底部

              lines.x.push({ left: l, showLeft: l });
              lines.x.push({ left: l + w , showLeft: l + w });
              lines.x.push({ left: l + w / 2 - width / 2, showLeft: l + w /2 });
              lines.x.push({ left: l - width, showLeft: l });
              lines.x.push({ left: l + w - width, showLeft: l + w });
            });
            return lines;
          })(),
        }
        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
      }

      const mousemove = (e: MouseEvent) => {
        if (!dragState.dragging) {
          dragState.dragging = true;
          dragstart.emit();
        }
        let { clientX: moveX, clientY: moveY } = e;
        const { startX, startY } = dragState;

        if (e.shiftKey) {
          if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
            moveX = startX;
          } else {
            moveY = startY;
          }
        }
        const currentLeft = dragState.startLeft + moveX - startX;
        const currentTop = dragState.startTop + moveY - startY;
        const currentMark = {
          x: null as null | number,
          y: null as null | number,
        };

        for (let i = 0; i < dragState.markLines.y.length; i++) {
          const {top, showTop} = dragState.markLines.y[i];
          if (Math.abs(top - currentTop) < 5) {
            moveY = top + startY - dragState.startTop;
            currentMark.y = showTop;
            break
          }
        }

        for (let i = 0; i < dragState.markLines.x.length; i++) {
          const {left, showLeft} = dragState.markLines.x[i];
          if (Math.abs(left - currentLeft) < 5) {
            moveX = left + startX - dragState.startLeft;
            currentMark.x = showLeft;
            break;
          }
        }

        mark.x = currentMark.x;
        mark.y = currentMark.y;

        const durX = moveX - startX;
        const durY = moveY - startY;

        focusData.value.focus.forEach((block, index) => {
          block.top = dragState.startPos[index].top + durY;
          block.left = dragState.startPos[index].left + durX;
        });
      }

      const mouseup = (e: MouseEvent) => {
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
        mark.x = null;
        mark.y = null;
        if (dragState.dragging) {
          dragend.emit();
        }
      }

      return { mark, mousedown };
    })();

    /** 其他的一些事件 */
    const handler = {
      onContextmenuBlock: (e: MouseEvent, block: VisualEditorBlockData) => {
        e.preventDefault();
        e.stopPropagation();

        $$dropdown({
          reference: e,
          content: () => (<>
            <DropdownOption label="置顶节点" icon="icon-place-top" {...{ onClick: commander.placeTop }} />
            <DropdownOption label="置底节点" icon="icon-place-bottom" {...{ onClick: commander.placeBottom }} />
            <DropdownOption label="删除节点" icon="icon-delete" {...{ onClick: commander.delete }} />
            <DropdownOption label="查看数据" icon="icon-browse" {...{ onClick: () => methods.showBlockData(block) }} />
            <DropdownOption label="导入节点" icon="icon-import" {...{ onClick: () => methods.importBlockData(block) }} />
          </>),
        })
      }
    };
    
    const commander = useVisualCommand({
      focusData,
      updateBlocks: methods.updateBlocks,
      dataModel,
      dragstart,
      dragend,
    });

    const buttons = [
      {label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z'},
      {label: '重做', icon: 'icon-forward', handler: commander.redo, tip: 'ctrl+y, ctrl+shift+z'},
      {
        label: () => state.preview ? '编辑' : '预览',
        icon: () => state.preview ? 'icon-edit' : 'icon-browse',
        handler: () => {
          if (!state.preview) {
            methods.clearFocus()
          }
          state.preview = !state.preview
        },
      },
      {
        label: '导入', icon: 'icon-import', handler: async () => {
          const text = await $$dialog.textarea('', '请输入导入的JSON字符串');
          try {
            const data = JSON.parse(text || '');
            dataModel.value = data;
          } catch (e) {
            console.log(e)
            ElMessageBox.alert('解析JSON字符串出错')
          }
        },
      },
      {
        label: '导出', icon: 'icon-export', handler: () => $$dialog.textarea(JSON.stringify(dataModel.value), '导出的JSON数据', { editReadonly: true })
      },
      {label: '置顶', icon: 'icon-place-top', handler: () => commander.placeTop(), tip: 'ctrl+up'},
      {label: '置底', icon: 'icon-place-bottom', handler: () => commander.placeBottom(), tip: 'ctrl+down'},
      {label: '删除', icon: 'icon-delete', handler: () => commander.delete(), tip: 'ctrl+d, backspace, delete'},
      {label: '清空', icon: 'icon-reset', handler: () => commander.clear()},
      {
        label: '关闭', icon: 'icon-close', handler: () => {
          methods.clearFocus()
          state.editing = false
        },
      },
    ];

    return () => <>
      <div class="visual-editor-container" style={containerStyles.value}>
          {!!dataModel.value.blocks && (
            dataModel.value.blocks.map((block, index) => (
              <VisualEditorBlock
                  config={props.config}
                  block={block}
                  key={index}
                  formData={props.formData}
                  slots={ctx.slots}
                  customProps={props.customProps}
              />
            ))
          )}
          <div class="vue-visual-container-edit-button" onClick={methods.openEdit}>
            <i class="iconfont icon-edit"/>
            <span>编辑组件</span>
          </div>
        </div>

        <div class={classes.value} v-show={state.editing}>
          <div class="visual-editor-menu">
            {props.config.componentList.map(component => (
              <div class="visual-editor-menu-item"
                draggable
                onDragend={menuDraggier.dragend}
                onDragstart={(e) => menuDraggier.dragestart(e, component)}>
                <span class="visual-editor-menu-item-label">{component.label}</span>
                {component.preview()}
              </div>
            ))}
          </div>
          <div class="visual-editor-head">
            {buttons.map((btn, index) => {
                const label = typeof btn.label === "function" ? btn.label() : btn.label;
                const icon = typeof btn.icon === "function" ? btn.icon() : btn.icon;
                const content = (<div key={index} class="visual-editor-head-button" onClick={btn.handler}>
                  <i class={`iconfont ${icon}`}/>
                  <span>{label}</span>
                </div>)
                return !btn.tip ? content : <el-tooltip effect="dark" content={btn.tip} placement="bottom">
                  {content}
                </el-tooltip>
              }
            )}
          </div>
          <VisualOperatorEditor
            block={state.selectBlock}
            config={props.config}
            dataModel={dataModel}
            updateBlock={commander.updateBlock}
            updateModelValue={commander.updateModelvalue}
          />
          <div class="visual-editor-body">
            <div class="visual-editor-content">
                <div class="visual-editor-container"
                  style={containerStyles.value}
                  ref={containerRef}
                  {...focusHandler.container}
                >
                  {!!dataModel.value.blocks && (
                    dataModel.value.blocks.map((block, index) => (
                      <VisualEditorBlock
                        config={props.config}
                        block={block}
                        key={index}
                        formData={props.formData}
                        slots={ctx.slots}
                        customProps={props.customProps}
                        {...{
                          onMousedown: (e: MouseEvent) => focusHandler.block.onMousedown(e, block, index),
                          onContextmenu: (e: MouseEvent) => handler.onContextmenuBlock(e, block)
                        }}
                      />
                    ))
                  )}
                  {blockDraggier.mark.y !== null && (
                    <div class="visual-editor-mark-line-y" style={{top: `${blockDraggier.mark.y}px`}}/>
                  )}
                  {blockDraggier.mark.x !== null && (
                    <div class="visual-editor-mark-line-x" style={{left: `${blockDraggier.mark.x}px`}}/>
                  )}
                </div>
              </div>
          </div>
      </div>
    </>
  }
})
