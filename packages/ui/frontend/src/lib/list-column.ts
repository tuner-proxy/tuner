export interface ColumnDefinition {
  name: string;
  key: string;
  defaultWidth: number;
  flex?: string;
  align?: 'center' | 'right';
}

export const COLUMNS: ColumnDefinition[] = [
  {
    name: 'Result',
    key: 'result',
    align: 'center',
    defaultWidth: 57,
  },
  {
    name: 'Protocol',
    key: 'protocol',
    defaultWidth: 67,
  },
  {
    name: 'Method',
    key: 'method',
    defaultWidth: 82,
  },
  {
    name: 'Host',
    key: 'host',
    align: 'right',
    defaultWidth: 162,
  },
  {
    name: 'Url',
    key: 'url',
    defaultWidth: 212,
    flex: '1 0 auto',
  },
  {
    name: 'Size',
    key: 'bodySize',
    align: 'right',
    defaultWidth: 72,
  },
  {
    name: 'Type',
    key: 'contentType',
    defaultWidth: 142,
  },
];
