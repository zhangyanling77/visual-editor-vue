import { createVisualEditorConfig } from "@/packages/visual-editor.utils";
import { ElButton, ElInput, ElOption, ElSelect } from 'element-plus';
import {
  createEditorInputProp,
  createEditorColorProp,
  createEditorSelectProp,
  createEditorTableProp,
} from '@/packages/visual-editor.props';
import { NumberRange } from '@/packages/components/number-range/number-range';
import './visual.config.scss';

export const visualConfig = createVisualEditorConfig();

visualConfig.registry('text', {
  label: '文本',
  preview: () => '预览文本',
  render: ({ props }) => <span style={{ color: props.color, fontSize: props.size }}>{props.text || '默认文本'}</span>,
  props: {
    text: createEditorInputProp('显示文本'),
    color: createEditorColorProp('字体颜色'),
    size: createEditorSelectProp('字体大小', [
      {label: '14px', val: '14px'},
      {label: '18px', val: '18px'},
      {label: '24px', val: '24px'},
    ])
  }
})

visualConfig.registry('button', {
  label: '按钮',
  preview: () => <ElButton>按钮</ElButton>,
  render: ({ props, size, custom }) => {
    return (
      <ElButton
        {...custom}
        type={props.type}
        size={props.size}
        style={{
          height: !!size.height ? `${size.height}px` : null,
          width: !!size.width ? `${size.width}px` : null,
        }}
      >
        {props.text || '按钮'}
      </ElButton>
    )
  },
  resize: {
    height: true,
    width: true,
  },
  props: {
    text: createEditorInputProp('显示文本'),
    type: createEditorSelectProp('按钮类型', [
      {label: '基础', val: 'primary'},
      {label: '成功', val: 'success'},
      {label: '警告', val: 'warning'},
      {label: '危险', val: 'danger'},
      {label: '提示', val: 'info'},
      {label: '文本', val: 'text'},
    ]),
    size: createEditorSelectProp('按钮大小', [
      {label: '默认', val: ''},
      {label: '中等', val: 'medium'},
      {label: '小', val: 'small'},
      {label: '极小', val: 'mini'},
    ])
  }
})

visualConfig.registry('select', {
  label: '下拉框',
  preview: () => <ElSelect />,
  render: ({ props, model, custom }) => (
    <ElSelect
      {...custom}
      key={(props.options || []).map((opt: any) => opt.value).join(',')}
      {...model.default}
    >
      {(props.options || []).map((opt: { label: string, value: string }, index: number) => (
        <ElOption label={opt.label} value={opt.value} key={index} />
      ))}
    </ElSelect>
  ),
  props: {
    options: createEditorTableProp('下拉选项', {
      options: [
        {label: '显示值', field: 'label'},
        {label: '绑定值', field: 'value'},
        {label: '备注', field: 'comments'},
      ],
      showKey: 'label',
    })
  },
  model: {
    default: '帮定值',
  }
})

visualConfig.registry('input', {
  label: '输入框',
  preview: () => <ElInput modelValue={""} />,
  render: ({ model, size, custom }) => {
    return <ElInput
      {...custom}
      {...model.default}
      style={{
        width: !!size.width ? `${size.width}px` : null,
      }}
    />
  },
  resize: {
    width: true,
  },
  model: {
    default: '绑定字段',
  },
})

visualConfig.registry('number-range', {
  label: '数字范围输入框',
  resize: {
    width: true,
  },
  preview: () => <NumberRange style={{ width: '100%' }} />,
  render: ({ model, size }) => {
    return <NumberRange
      style={{
        width: !!size.width ? `${size.width}px` : null,
      }}
      {...{
        start: model.start.value,
        'onUpdate:start': model.start.onChange,
        end: model.end.value,
        'onUpdate:end': model.end.onChange,
      }}
    />
  },
  model: {
    start: '起始绑定字段',
    end: '截止绑定字段',
  }
})

visualConfig.registry('image', {
  label: '图片',
  resize: {
    width: true,
    height: true,
  },
  preview: () => (
    <div style="text-align:center;">
      <div
        style="font-size:20px;background-color:#f2f2f2;color:#ccc;display:inline-flex;width:100px;height:50px;align-item:center;justify-content:center;"
      >
        <i class="el-icon-picture" />
      </div>
    </div>
  ),
  render: ({ props, size }) => {
    return (
      <div style={{ height: `${size.height || 100}px`, width: `${size.width || 100}px`}}
        class="visual-block.image"
      >
        <img src={props.url || 'https://cn.vuejs.org/images/log.png'} alt=""/>
      </div>
    )
  },
  props: {
    url: createEditorInputProp('地址'),
  }
})
