import { computed, defineComponent, PropType, ref } from 'vue';
import { VisualEditorComponent, VisualEditorConfig, VisualEditorModelValue } from '@/packages/visual-editor.utils';
import { useModel } from '@/packages/utils/useModel';
import { VisualEditorBlock } from '@/packages/visual-editor-block';
import './visual-editor.scss';
import component from '*.vue';

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

    const menuDraggier = {
      current: {
        component: null as null | VisualEditorComponent,
      },
      dragestart: (e: DragEvent, component: VisualEditorComponent) => {
        containerRef.value.addEventListener('dragenter', menuDraggier.dragenter);
        containerRef.value.addEventListener('dragover', menuDraggier.dragover);
        containerRef.value.addEventListener('dragleave', menuDraggier.dragleave);
        containerRef.value.addEventListener('drop', menuDraggier.drop);
        menuDraggier.current.component = component;
      },
      dragenter: (e: DragEvent) => {
        e.dataTransfer!.dropEffect = 'move';
      },
      dragover: (e: DragEvent) => {
        e.preventDefault();
      },
      dragleave: (e: DragEvent) => {
        e.dataTransfer!.dropEffect = 'none';
      },
      dragend: (e: DragEvent) => {
        containerRef.value.removeEventListener('dragenter', menuDraggier.dragenter);
        containerRef.value.removeEventListener('dragover', menuDraggier.dragover);
        containerRef.value.removeEventListener('dragleave', menuDraggier.dragleave);
        containerRef.value.removeEventListener('drop', menuDraggier.drop);
        menuDraggier.current.component = null;
      },
      drop: (e: DragEvent) => {
        console.log('drop: ', e, menuDraggier.current.component)
        const blocks = dataModel.value.blocks || [];
        blocks.push({
          top: e.offsetY,
          left: e.offsetX,
        });
        dataModel.value = {
          ...dataModel.value,
          blocks,
        };
      },
    }

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
            >
              {!!dataModel.value.blocks && (
                dataModel.value.blocks.map((block, index) => (
                  <VisualEditorBlock block={block} key={index} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
})
