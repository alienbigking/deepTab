import React from 'react'
import { Card } from 'antd'
import styles from './widgets.module.less'

/**
 * 待办事项小部件
 * 显示待办事项列表（占位）
 */
const TodoWidget: React.FC = () => {
  const mockTodos = [
    { id: 1, text: '完成项目文档', time: '09:00' },
    { id: 2, text: '团队会议讨论', time: '14:00' },
    { id: 3, text: '代码审查', time: '16:30' },
    { id: 4, text: '准备明天的演示', time: '18:00' }
  ]

  return (
    <Card className={styles.widgetCard} bordered={false}>
      <div className={styles.todoWidget}>
        <div className={styles.todoHeader}>
          <span className={styles.todoTitle}>待办事项</span>
        </div>
        <div className={styles.todoList}>
          {mockTodos.map((todo) => (
            <div key={todo.id} className={styles.todoItem}>
              <span className={styles.todoTime}>{todo.time}</span>
              <span className={styles.todoText}>{todo.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default TodoWidget
