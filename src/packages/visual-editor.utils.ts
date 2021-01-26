export interface VisualEditorBlockData {
  componentKey: string;
  top: number;
  left: number;
}

export interface VisualEditorModelValue {
  container: {
    width: number;
    height: number;
  },
  blocks?: VisualEditorBlockData[],
}
  
export interface VisualEditorComponent {
  key: string;
  label: string;
  preview: () => JSX.Element;
  render: () => JSX.Element;
}

export function createVisualEditorConfig() {
  // 菜单列表显示的
  const componentList: VisualEditorComponent[] = [];
  // 方便访问组件的
  const componentMap: Record<string, VisualEditorComponent> = {};
  return {
    componentList,
    componentMap,
    registry: (key: string, component: Omit<VisualEditorComponent, 'key'>) => {
      const comp = {...component, key }
      componentList.push(comp);
      componentMap[key] = comp;
    }
  }
}

export type VisualEditorConfig = ReturnType<typeof createVisualEditorConfig>
  
