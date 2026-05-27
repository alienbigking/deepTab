import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Checkbox, Empty, Input, Modal, Radio, Select, Tag } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import addAppModalStyles from '@/pages/appGrid/addAppModal.module.less'
import styles from './widgets.module.less'
import widgetsContainerService from './services/widgetsContainer'
import type { ITodoItem } from './types/widgetsContainer'

type TodoFilter = 'all' | 'active' | 'completed'

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

const priorityMeta: Record<NonNullable<ITodoItem['priority']>, { label: string; color: string }> = {
  high: { label: '高', color: 'red' },
  medium: { label: '中', color: 'gold' },
  low: { label: '低', color: 'blue' }
}

const TodoWidget: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [todos, setTodos] = useState<ITodoItem[]>([])
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<NonNullable<ITodoItem['priority']>>('medium')
  const [filter, setFilter] = useState<TodoFilter>('all')

  const loadTodos = async () => {
    const list = await widgetsContainerService.getTodoList()
    setTodos(list)
  }

  useEffect(() => {
    void loadTodos()
  }, [])

  const activeTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)
  const filteredTodos = useMemo(() => {
    const nextList =
      filter === 'active' ? activeTodos : filter === 'completed' ? completedTodos : todos
    return [...nextList].sort((a, b) => Number(a.completed) - Number(b.completed))
  }, [activeTodos, completedTodos, filter, todos])

  const addTodo = async () => {
    const value = text.trim()
    if (!value) return
    await widgetsContainerService.saveTodoItem({
      id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: value,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      completed: false,
      priority
    })
    setText('')
    await loadTodos()
  }

  const toggleTodo = async (todo: ITodoItem) => {
    await widgetsContainerService.updateTodoItem(todo.id, { completed: !todo.completed })
    await loadTodos()
  }

  const deleteTodo = async (id: string) => {
    await widgetsContainerService.deleteTodoItem(id)
    await loadTodos()
  }

  const clearCompleted = async () => {
    await Promise.all(completedTodos.map((todo) => widgetsContainerService.deleteTodoItem(todo.id)))
    await loadTodos()
  }

  const renderPriority = (todo: ITodoItem) => {
    const meta = priorityMeta[todo.priority || 'medium']
    return <Tag color={meta.color}>{meta.label}</Tag>
  }

  return (
    <>
      <Card className={styles.widgetCard} variant='borderless' onClick={() => setOpen(true)}>
        <div className={styles.todoWidget}>
          <div className={styles.todoCompactHeader}>
            <div>
              <span>待办事项</span>
              <strong>{activeTodos.length}</strong>
            </div>
            <em>{completedTodos.length} 已完成</em>
          </div>

          <div className={styles.todoCompactList}>
            {activeTodos.length === 0 ? (
              <div className={styles.todoCompactEmpty}>暂无待办</div>
            ) : (
              activeTodos.slice(0, 3).map((todo) => (
                <div key={todo.id} className={styles.todoCompactItem}>
                  <i />
                  <span>{todo.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <Modal
        title='待办事项'
        open={open}
        onCancel={() => setOpen(false)}
        rootClassName={`${addAppModalStyles.addAppModalRoot} ${styles.widgetModalRoot}`}
        className={styles.widgetModal}
        centered
        width={1000}
        transitionName=''
        maskTransitionName=''
        styles={{ body: { overflow: 'hidden' } }}
        footer={null}
        destroyOnHidden
      >
        <div className={styles.widgetModalBody}>
          <div className={styles.todoModalLayout}>
            <section className={styles.todoSummaryPanel}>
              <div className={styles.todoSummaryMain}>
                <span>未完成</span>
                <strong>{activeTodos.length}</strong>
              </div>
              <div className={styles.todoSummaryStats}>
                <div>
                  <span>全部</span>
                  <strong>{todos.length}</strong>
                </div>
                <div>
                  <span>已完成</span>
                  <strong>{completedTodos.length}</strong>
                </div>
                <div>
                  <span>完成率</span>
                  <strong>
                    {todos.length ? Math.round((completedTodos.length / todos.length) * 100) : 0}%
                  </strong>
                </div>
              </div>
            </section>

            <section className={styles.todoMainPanel}>
              <div className={styles.todoComposer}>
                <Input
                  value={text}
                  placeholder='添加新的待办事项'
                  onChange={(event) => setText(event.target.value)}
                  onPressEnter={() => void addTodo()}
                />
                <Select
                  value={priority}
                  options={priorityOptions}
                  className={styles.todoPrioritySelect}
                  onChange={setPriority}
                />
                <Button type='primary' icon={<PlusOutlined />} onClick={() => void addTodo()}>
                  添加
                </Button>
              </div>

              <div className={styles.todoToolbar}>
                <Radio.Group
                  size='small'
                  value={filter}
                  buttonStyle='solid'
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <Radio.Button value='all'>全部</Radio.Button>
                  <Radio.Button value='active'>未完成</Radio.Button>
                  <Radio.Button value='completed'>已完成</Radio.Button>
                </Radio.Group>
                <Button
                  size='small'
                  disabled={completedTodos.length === 0}
                  onClick={() => void clearCompleted()}
                >
                  清理已完成
                </Button>
              </div>

              <div className={styles.todoModalList}>
                {filteredTodos.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无待办' />
                ) : (
                  filteredTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`${styles.todoModalItem} ${todo.completed ? styles.completed : ''}`}
                    >
                      <Checkbox checked={todo.completed} onChange={() => void toggleTodo(todo)} />
                      <div className={styles.todoModalText}>
                        <strong>{todo.text}</strong>
                        <span>{todo.time}</span>
                      </div>
                      {renderPriority(todo)}
                      <Button
                        size='small'
                        shape='circle'
                        icon={<DeleteOutlined />}
                        onClick={() => void deleteTodo(todo.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default TodoWidget
