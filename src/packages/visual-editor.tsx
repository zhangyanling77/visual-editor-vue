import { computed, defineComponent, PropType } from 'vue';
import { VisualEditorConfig, VisualEditorModelValue } from '@/packages/visual-editor.utils';
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
    const containerStyles = computed(() => ({
      width: `${dataModel.value.container.width}px`,
      height: `${dataModel.value.container.height}px`,
    }));

    return () => (
      <div class="visual-editor">
        <div class="visual-editor-menu">
          {
            props.config.componentList.map(component => (
              <div class="visual-editor-menu-item">
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
