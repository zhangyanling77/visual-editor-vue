import { defineComponent, PropType } from "vue";
import { VisualEditorBlockData } from "./visual-editor.utils";

export const VisualEditorBlock = defineComponent({
  props: {
    block: { type: Object as PropType<VisualEditorBlockData>, required: true }
  },
  setup(props, ctx) {
    return () => (
      <div>
        visual-editor-block
      </div>
    )
  },
})
