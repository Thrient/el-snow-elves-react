export type CellModel =
  | 'el-text'
  | 'el-switch'
  | 'el-input-number'
  | 'el-key-input'
  | 'el-select'
  | 'el-input'
  | 'el-textarea'
  | 'el-checkbox'
  | 'el-checkbox-group'
  | 'el-radio'
  | 'el-slider'
  | 'el-date-picker'
  | 'el-color-picker'

export type CellOption = {
  label: string
  value: string | number
}

export type Cell = {
  span: number
  model: CellModel
  text?: string
  store?: string
  // Common
  disabled?: boolean
  placeholder?: string
  size?: 'large' | 'middle' | 'small'
  // InputNumber / Slider
  min?: number
  max?: number
  step?: number
  precision?: number
  controls?: boolean
  readOnly?: boolean
  // Select / CheckboxGroup / Radio
  options?: CellOption[]
  allowClear?: boolean
  mode?: 'multiple' | 'tags'
  showSearch?: boolean
  maxTagCount?: number
  // Switch / Select
  loading?: boolean
  // Input / TextArea
  maxLength?: number
  showCount?: boolean
  rows?: number
  autoSize?: boolean | { minRows: number; maxRows: number }
  // Checkbox
  indeterminate?: boolean
  // Radio
  optionType?: 'default' | 'button'
  buttonStyle?: 'outline' | 'solid'
  // Slider
  dots?: boolean
  marks?: Record<number, string>
  range?: boolean
  vertical?: boolean
  included?: boolean
  // DatePicker
  format?: string
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year'
  showTime?: boolean
  // ColorPicker
  showText?: boolean
}

export type Task = {
  id: string
  name: string
  description: string
  version: string
  author: string
  values: Record<string, unknown>
  layout: Cell[][]
}
