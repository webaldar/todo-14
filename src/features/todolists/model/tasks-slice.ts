import { createTodolistTC, deleteTodolistTC } from "./todolists-slice"
import { createAppSlice } from "@/common/utils"
import { tasksApi } from "@/features/todolists/api/tasksApi.ts"
import { TaskStatus } from "@/common/enums"
import { DomainTask, UpdateTaskModel } from "@/features/todolists/api/tasksApi.types.ts"
import { RootState } from "@/app/store.ts"
import { changeStatusAC } from "@/app/app-slice.ts"

export const tasksSlice = createAppSlice({
  name: "tasks",
  initialState: {} as TasksState,
  selectors: {
    selectTasks: (state) => state,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTodolistTC.fulfilled, (state, action) => {
        state[action.payload.todolist.id] = []
      })
      .addCase(deleteTodolistTC.fulfilled, (state, action) => {
        delete state[action.payload.id]
      })
  },
  reducers: (create) => ({
    fetchTasksTC: create.asyncThunk(
      async (todolistId: string, thunkAPI) => {
        try {
          thunkAPI.dispatch(changeStatusAC({status: 'loading'}))
          const res = await tasksApi.getTasks(todolistId)
          thunkAPI.dispatch(changeStatusAC({status: 'succeeded'}))
          return { todolistId, tasks: res.data.items }
        } catch (error) {
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          state[action.payload.todolistId] = action.payload.tasks
        },
      },
    ),
    deleteTaskTC: create.asyncThunk(
      async ( payload: {todolistId: string, taskId: string }, thunkAPI) => {
        try {
          thunkAPI.dispatch(changeStatusAC({status: 'loading'}))
          await tasksApi.deleteTask(payload)
          thunkAPI.dispatch(changeStatusAC({status: 'succeeded'}))
          return payload
        }catch (error) {
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const tasks = state[action.payload.todolistId]
          const index = tasks.findIndex((task) => task.id === action.payload.taskId)
          if (index !== -1) {
            tasks.splice(index, 1)
          }
        }
      }
    ),
    createTaskTC: create.asyncThunk(
      async (payload: { todolistId: string; title: string }, thunkAPI) => {
        try {
          thunkAPI.dispatch(changeStatusAC({status: 'loading'}))
          const res = await tasksApi.createTask(payload)
          thunkAPI.dispatch(changeStatusAC({ status: "succeeded" }))
          return { task: res.data.data.item }
        } catch (error) {
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          state[action.payload.task.todoListId].unshift(action.payload.task)
        },
      },
    ),
    changeTaskStatusTC: create.asyncThunk(
      async ( payload: {todolistId: string, taskId: string, status: TaskStatus }, thunkAPI) => {
        const {todolistId, taskId, status} = payload
        const allTodolistTasks = (thunkAPI.getState() as RootState).tasks[todolistId]
        const task = allTodolistTasks.find((task) => task.id === taskId)

        if (!task) {
          return thunkAPI.rejectWithValue(null)
        }

        const model: UpdateTaskModel = {
          description: task.description,
          title: task.title,
          priority: task.priority,
          startDate: task.startDate,
          deadline: task.deadline,
          status,
        }
        try {
          thunkAPI.dispatch(changeStatusAC({status: 'loading'}))
          const res = await tasksApi.updateTask({todolistId, taskId, model})
          thunkAPI.dispatch(changeStatusAC({status: 'succeeded'}))
          return {task: res.data.data.item}
        }catch (error) {
          return thunkAPI.rejectWithValue(null)
        }
      },
      {
        fulfilled: (state, action) => {
          const task = state[action.payload.task.todoListId].find((task) => task.id === action.payload.task.id)
          if (task) {
            task.status = action.payload.task.status
          }
        }

      },
    ),
    changeTaskTitleAC: create.reducer<{ todolistId: string; taskId: string; title: string }>((state, action) => {
      const task = state[action.payload.todolistId].find((task) => task.id === action.payload.taskId)
      if (task) {
        task.title = action.payload.title
      }
    }),
  }),
})

export const { selectTasks } = tasksSlice.selectors
export const { createTaskTC, changeTaskTitleAC, fetchTasksTC, deleteTaskTC, changeTaskStatusTC } = tasksSlice.actions
export const tasksReducer = tasksSlice.reducer

export type TasksState = Record<string, DomainTask[]>
// VAT5718f31d-a1be-4146-b23a-3130e7b2543b'
// VAK452ac437-ae90-4145-aa98-e2d8d75a6d3d'