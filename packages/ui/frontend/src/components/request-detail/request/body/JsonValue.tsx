import { computed, defineComponent } from 'vue';

import ContextMenu from '../../../ContextMenu.vue';

import { provideJsonMgr, useJsonMgr } from './JsonMgr';
import style from './JsonValue.module.scss';

export const JsonValue = defineComponent({
  props: ['value'],
  setup(props, { expose }) {
    const mgr = provideJsonMgr(props.value);

    expose({
      toggleAll() {
        mgr.onToggleAll();
      },
    });

    return () => <>
      <SwitchValue value={props.value} />
      <ContextMenu ref={mgr.onContextMenuRef} />
    </>;
  },
});

function SwitchValue({ value, preview }: { value: any, preview?: boolean }) {
  if (value == null) {
    return <NullValue />;
  }
  if (typeof value === 'number') {
    return <NumberValue value={value} />;
  }
  if (typeof value === 'string') {
    return <StringValue value={value} />;
  }
  if (typeof value === 'boolean') {
    return <BooleanValue value={value} />;
  }
  if (!preview) {
    return <TreeNode value={value} path={[]} />;
  }
  if (Array.isArray(value)) {
    return <ArrayInnerPreview value={value} />;
  }
  return <ObjectInnerPreview value={value} />;
}

const TreeNode = defineComponent({
  name: 'TreeNode',
  props: ['propertyName', 'value', 'path'],
  setup(props) {
    const mgr = useJsonMgr();

    /**
     * Basic properties
     */

    const expandable = props.value && typeof props.value === 'object';
    const keys = expandable ? Object.keys(props.value) : [];

    if (expandable) {
      mgr.onKeys(props.path, keys);
    }
    mgr.onValue(props.path, props.value);

    /**
     * Expand Children
     */

    const expanded = computed(() => mgr.isExpanded(props.path));
    const buildChildren = computed(() => mgr.shouldBuildChildren(props.path));

    let toggleTimestamp = 0;
    function onClick() {
      if (!expandable) {
        return;
      }
      const duration = Date.now() - toggleTimestamp;
      toggleTimestamp = Date.now();
      if (duration < 300) {
        return;
      }
      mgr.onToggle(props.path);
    }

    /**
     * Focus / Context menu
     */

    const focused = computed(() => mgr.isFocused(props.path));

    function onMouseDown() {
      mgr.onFocus(props.path);
    }

    function onContextMenu(event: MouseEvent) {
      event.preventDefault();
      mgr.onContextMenu(event, props.path);
    }

    /**
     * Render
     */

    const title = computed(() => {
      if (props.propertyName == null) {
        return;
      }
      if (!expandable) {
        return String(props.value);
      }
      if (Array.isArray(props.value)) {
        return `Array(${props.value.length})`;
      }
      return 'Object';
    });

    function renderPreview() {
      if (!expandable) {
        return <SwitchValue value={props.value} />;
      }
      if (Array.isArray(props.value)) {
        return <ArrayPreview value={props.value} />;
      }
      return <ObjectPreview keys={keys} value={props.value} />;
    }

    return () => (
      <div class={{ [style.expanded]: expanded.value }}>
        <div
          ref={(el: any) => mgr.onRef(props.path, el)}
          class={[
            style.treeNode,
            {
              [style.expandable]: expandable,
              [style.root]: props.propertyName == null,
              [style.focused]: !!focused.value,
            },
          ]}
          onClick={onClick}
          onMousedown={onMouseDown}
          onContextmenu={onContextMenu}
        >
          <span>
            <PropertyName propertyName={props.propertyName} />
            <span title={title.value}>
              {renderPreview()}
            </span>
          </span>
        </div>
        {buildChildren.value && (
          <div class={style.children}>
            {keys.map((key, index) => (
              <TreeNode
                propertyName={key}
                value={props.value[key]}
                path={[...props.path, index]}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
});

function ArrayPreview({ value }: { value: any[] }) {
  return <>
    {value.length > 1 ? (
      <span class={style.previewPropertyName}>({value.length}) </span>
    ) : null}
    [
    {value.slice(0, 100).map((child, index) => <>
      {index ? ', ' : null}
      <SwitchValue preview value={child} />
    </>)}
    {value.length > 100 ? ', …' : null}
    ]
  </>;
}

function ObjectPreview({ keys, value }: { keys: string[], value: any }) {
  return <>
    {'{'}
    {keys.slice(0, 5).map((key, index) => <>
      {index ? ', ' : null}
      <span class={style.previewPropertyName}>{normalizeKey(key)}</span>
      {': '}
      <SwitchValue preview value={value[key]} />
    </>)}
    {keys.length > 5 ? ', …' : null}
    {'}'}
  </>;
}

function PropertyName({ propertyName }: { propertyName?: string }) {
  if (propertyName == null) {
    return null;
  }
  return <>
    <span class={style.propertyName} title={propertyName}>{normalizeKey(propertyName)}</span>
    {': '}
  </>;
}

function NullValue() {
  return (
    <span class={style.nullValue}>null</span>
  );
}

function NumberValue({ value }: { value: number }) {
  return (
    <span class={style.numberValue}>{value}</span>
  );
}

function BooleanValue({ value }: { value: boolean }) {
  return (
    <span class={style.numberValue}>{String(value)}</span>
  );
}

function StringValue({ value }: { value: string }) {
  const normalizedValue = JSON.stringify(value);
  return (
    <span class={style.stringValue}>{normalizedValue}</span>
  );
}

function ArrayInnerPreview({ value }: { value: any[] }) {
  return <>
    Array({value.length})
  </>;
}

function ObjectInnerPreview({}: { value: any }) {
  return <>
    {'{…}'}
  </>;
}

function normalizeKey(key: string) {
  if (/^[\d\w$]+$/.test(key)) {
    return key;
  }
  return JSON.stringify(key);
}
