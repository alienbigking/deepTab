import React from 'react'
import {
  defaultAnimateLayoutChanges,
  useSortable,
  type AnimateLayoutChanges
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import cn from 'classnames'
import CalendarWidget from '@/pages/widgetsContainer/calendarWidget'
import WeatherWidget from '@/pages/widgetsContainer/weatherWidget'
import TodoWidget from '@/pages/widgetsContainer/todoWidget'
import HotSearchWidget from '@/pages/widgetsContainer/hotSearchWidget'
import type { AppItem, WidgetKind } from './types/appGrid'
import styles from './appGrid.module.less'

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

interface DroppableWidgetProps {
  widget: AppItem
  kind: WidgetKind
  isEditMode: boolean
  gridGap: number
  onContextMenu: (e: React.MouseEvent, id: string, nodeType: 'widget') => void
}

const widgetComponentMap: Record<WidgetKind, React.ReactNode> = {
  calendar: <CalendarWidget />,
  weather: <WeatherWidget />,
  todo: <TodoWidget />,
  hotSearch: <HotSearchWidget />
}

const iconTrackWidth = 120

const DroppableWidget: React.FC<DroppableWidgetProps> = ({
  widget,
  kind,
  isEditMode,
  gridGap,
  onContextMenu
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging, isOver } = useSortable({
    id: widget.id,
    animateLayoutChanges,
    data: {
      type: 'widget',
      item: widget,
      widgetKind: kind
    }
  })

  const span = widget.widgetSpan === 2 ? 2 : 4
  const gap = Number.isFinite(gridGap) ? gridGap : 24
  const width = span * iconTrackWidth + (span - 1) * gap
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? undefined
      : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease',
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
    gridColumn: `span ${span}`,
    gridRow: 'span 2',
    width,
    minWidth: width,
    maxWidth: width,
    '--dt-widget-node-width': `${width}px`
  } as React.CSSProperties

  return (
    <div
      ref={setNodeRef}
      data-app-grid-id={widget.id}
      style={style}
      className={cn(styles.droppableWidget, styles[`widgetSpan_${kind}`], {
        [styles.widgetDropOver]: isOver && !isDragging,
        [styles.isDragging]: isDragging,
        [styles.editMode]: isEditMode
      })}
      onContextMenu={(event) => {
        event.preventDefault()
        onContextMenu(event, widget.id, 'widget')
      }}
      {...attributes}
      {...listeners}
    >
      {widgetComponentMap[kind]}
    </div>
  )
}

export default DroppableWidget
