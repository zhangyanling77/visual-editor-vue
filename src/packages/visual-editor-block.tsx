import { computed, defineComponent, PropType } from "vue";
import { VisualEditorBlockData } from "./visual-editor.utils";

export const VisualEditorBlock = defineComponent({
  props: {
    block: { type: Object as PropType<VisualEditorBlockData>, required: true },
  },
  setup(props, ctx) {
    const styles = computed(() => ({
      top: `${props.block.top}px`,
      left: `${props.block.left}px`,
    }))

    return () => (
      <div class="visual-editor-block" style={styles.value}>
        visual-editor-block
      </div>
    )
  },
})