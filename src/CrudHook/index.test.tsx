import React from 'react'
import { renderHook, act } from 'react-hooks-testing-library'

import { useCrud } from './index'
import { CrudProvider } from '../Provider'
import { CrudManager } from 'lemon-curd'
import { IRecord, Store, Reducer, Dispatcher } from 'resma'

const fakeRecord = {
  type: 'company',
  attributes: {
    name: 'exivity'
  },
  relationships: {
    ceo: {
      data: {
        type: 'ceo',
        id: '1'
      },
    },
    employees: {
      data: [{ type: 'employee', id: '1' }]
    }
  }
}

const promiseError = 'Unable, Were gonna be in the Hudson.'

const promise = (record: any, options: any) => new Promise<IRecord>((resolve, reject) => {
  const toResolve = options.provideOptionsInsteadOfRecord ? options : record
  // @ts-ignore
  process.nextTick(() =>
    options.shouldResolve
     ? resolve(toResolve)
     : reject(promiseError)
  )
})

const fakeDispatchFunction = () => {}

const manager = new CrudManager({
  createRecord: promise,
  updateRecord: promise,
  deleteRecord: promise,
  extensions: {
    dispatch: fakeDispatchFunction
  }
})

const store = new Store({
  reducer: new Reducer(),
  dispatcher: new Dispatcher()
})

const Wrapper = ({ children }: any) => <CrudProvider manager={manager} store={store}>{children}</CrudProvider>

test('Saving a new record (no id) triggers create callbacks with their arguments', async (done) => {
  const { result, unmount } = renderHook((init) => useCrud(init), { wrapper: Wrapper, initialProps: fakeRecord })

  act(() => {
    result.current.save({
      shouldResolve: true,
      beforeCreate: (record, extensions) => {
        expect(record).toBe(fakeRecord)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        return true
      },
      onCreate: (record, extensions) => {
        expect(record).toBe(fakeRecord)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        done()
      }
    })
  })

  unmount()
})

test('Saving a existing record (with id) triggers update callbacks with their arguments', async (done) => {
  const fakeRecordWithId = {
    id: '1',
     ...fakeRecord
  }

  const { result, unmount } = renderHook(() => useCrud(fakeRecordWithId), { wrapper: Wrapper, initialProps: fakeRecord })

  act(() => {
    result.current.save({
      shouldResolve: true,
      beforeUpdate: (record, extensions) => {
        expect(record).toBe(fakeRecordWithId)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        return true
      },
      onUpdate: (record, extensions) => {
        expect(record).toBe(fakeRecordWithId)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        done()
      }
    })
  })

  unmount()
})

test('Deleting a record triggers delete callbacks with their arguments', async (done) => {
  const fakeRecordWithId = {
    id: '1',
    ...fakeRecord
  }

  const { result, unmount } = renderHook(() => useCrud(fakeRecordWithId), { wrapper: Wrapper, initialProps: fakeRecord })

  act(() => {
    result.current.delete({
      shouldResolve: true,
      beforeDelete: (record, extensions) => {
        expect(record).toBe(fakeRecordWithId)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        return true
      },
      onDelete: (record, extensions) => {
        expect(record).toBe(fakeRecordWithId)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        done()
      }
    })
  })

  unmount()
})

test('If save catches, onError is triggered', async (done) => {
  const fakeRecordWithId = {
    id: '1',
    ...fakeRecord
  }

  const { result, unmount } = renderHook(() => useCrud(fakeRecordWithId), { wrapper: Wrapper, initialProps: fakeRecord })

  act(() => {
    result.current.save({
      shouldResolve: false,
      onError: (error, record, extensions) => {
        expect(error).toBe(promiseError)
        expect(record).toBe(fakeRecordWithId)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        done()
      }
    })
  })

  unmount()
})

test('If delete catches, onError is triggered', async (done) => {
  const fakeRecordWithId = {
    id: '1',
    ...fakeRecord
  }

  const { result, unmount } = renderHook(() => useCrud(fakeRecordWithId), { wrapper: Wrapper, initialProps: fakeRecord })

  act(() => {
    result.current.delete({
      shouldResolve: false,
      onError: (error, record, extensions) => {
        expect(error).toBe(promiseError)
        expect(record).toBe(fakeRecordWithId)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        done()
      }
    })
  })

  unmount()
})

test('Custom options are passed on to promises as second argument - standard callbacks are not', async (done) => {
  const { result, unmount } = renderHook((init) => useCrud(init), { wrapper: Wrapper, initialProps: fakeRecord })

  act(() => {
    result.current.save({
      provideOptionsInsteadOfRecord: true,
      shouldResolve: true,
      onCreate: (customOptions, extensions) => {
        expect(Object.keys(customOptions).length).toBe(2)
        // @ts-ignore
        expect(customOptions.shouldResolve).toBe(true)
        // @ts-ignore
        expect(customOptions.provideOptionsInsteadOfRecord).toBe(true)
        expect(extensions.dispatch).toBe(fakeDispatchFunction)
        done()
      }
    })
  })

  unmount()
})

test('Calling setters triggers a rerender', async (done) => {
  const { result, waitForNextUpdate, unmount } = renderHook((init) => useCrud(init), { wrapper: Wrapper, initialProps: fakeRecord })

  setTimeout(() => act(() => {
    result.current.setAttribute('name', 'Michiel de Vos')
  }), 100)

    // waitForNextUpdate triggers on render
  waitForNextUpdate().then(() => {
    expect(result.current.attributes.name).toBe('Michiel de Vos')
    unmount()
    done()
  })
})

test('Calling setters updates Record instance reference', async (done) => {
  const { result, waitForNextUpdate, unmount } = renderHook((init) => useCrud(init), { wrapper: Wrapper, initialProps: fakeRecord })
  let ref = {}

  setTimeout(() => act(() => {
    ref = result.current
    result.current.setAttribute('name', 'Michiel de Vos')
  }), 100)

  // waitForNextUpdate triggers on render
  waitForNextUpdate().then(() => {
    expect(result.current).not.toBe(ref)
    unmount()
    done()
  })
})

test('unSubscribeDelay prevents store from cleaning up record when unmounting', async (done) => {
  const store = new Store({
    reducer: new Reducer(),
    dispatcher: new Dispatcher()
  })

  const Wrapper = ({ children }: any) => <CrudProvider manager={manager} store={store}>{children}</CrudProvider>

  const unSubscribeDelay = 1000
  const onUnSubscribe = (record: any) => {
    expect(record).toEqual(fakeRecord)
    expect(Object.keys(store._store).length).toBe(0)
    done()
  }

  const options = { unSubscribeDelay, onUnSubscribe }
  const { result, unmount } = renderHook((init) => useCrud(init, options), { wrapper: Wrapper, initialProps: fakeRecord })

  act(() => {
    unmount()
  })

  expect(Object.keys(store._store).length).toBe(1)
})