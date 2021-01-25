import { createVisualEditorConfig } from "@/packages/visual-editor.utils";

export const visualConfig = createVisualEditorConfig();

visualConfig.registry('text', {
  label: '文本',
  preview: () => '预览文本',
  render: () => '渲染文本',
})

visualConfig.registry('button', {
  label: '按钮',
  preview: () => '预览按钮',
  render: () => '渲染按钮',
})

visualConfig.registry('input', {
  label: '输入框',
  preview: () => '预览输入框',
  render: () => '渲染输入框',
})
