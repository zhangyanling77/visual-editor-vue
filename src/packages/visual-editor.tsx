import { computed, defineComponent, PropType, ref } from 'vue';
import { createNewBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorModelValue } from '@/packages/visual-editor.utils';
import { useModel } from '@/packages/utils/useModel';
import { VisualEditorBlock } from '@/packages/visual-editor-block';
import './visual-editor.scss';

export const VisualEditor = defineComponent({
  props: {
    modelValue: { type: Object as PropType<VisualEditorModelValue>, required: true },
    config: { type: Object as PropType<VisualEditorConfig>, required: true },
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
    const containerRef = ref({} as HTMLDivElement);
    const containerStyles = computed(() => ({
      width: `${dataModel.value.container.width}px`,
      height: `${dataModel.value.container.height}px`,
    }));
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
        dragenter: (e: DragEvent) => {
          e.dataTransfer!.dropEffect = 'move';
        },
        /*拖拽菜单组件，鼠标在容器中移动的时候，禁用默认事件*/
        dragover: (e: DragEvent) => {
          e.preventDefault();
        },
        /*如果拖拽过程中，鼠标离开了容器，设置鼠标为不可放置的状态*/
        dragleave: (e: DragEvent) => {
          e.dataTransfer!.dropEffect = 'none';
        },
        /*在容器中放置的时候，通过事件对象的 offsetX，和offsetY添加一条组件数据*/
        drop: (e: DragEvent) => {
          const blocks = dataModel.value.blocks || [];
          blocks.push(createNewBlock({
            component: component!,
            top: e.offsetY,
            left: e.offsetX,
          }));
          dataModel.value = {
            ...dataModel.value,
            blocks,
          };
        },
      };
      return blockHandler;
    })();

    const focusHandler = (() => {
      return {
        container: {
          onMousedown: (e: MouseEvent) => {
            (dataModel.value.blocks || []).forEach(block => block.focus = false);
          },
        },
        block: {
          onMousedown: (e: MouseEvent, block: VisualEditorBlockData) => {
            e.stopPropagation();
            e.preventDefault();
            block.focus = !block.focus;
          },
        },
      }
    })();

    return () => (
      <div class="visual-editor">
        <div class="visual-editor-menu">
          {
            props.config.componentList.map(component => (
              <div
                draggable
                class="visual-editor-menu-item"
                onDragstart={(e) => menuDraggier.dragestart(e, component)}
                onDragend={menuDraggier.dragend}
              >
                <span class="visual-editor-menu-item-label">{component.label}</span>
                {component.preview()}
              </div>
            ))
          }
        </div>
        <div class="visual-editor-head">
          visual-editor-head
        </div>
        <div class="visual-editor-operator">
          visual-editor-operator
        </div>
        <div class="visual-editor-body">
          <div class="visual-editor-content">
            <div
              class="visual-editor-container"
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
                    {...{
                      onMousedown: (e: MouseEvent) => focusHandler.block.onMousedown(e, block)
                  }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
})
