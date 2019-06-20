import { useContext, useState, useEffect, useRef, useMemo } from 'react'

import { Record, IRecord, createRecord } from 'resma'
import { Options } from 'lemon-curd'
import { CrudContext } from '../Provider'

export interface CrudRecord extends Record {
  save: (options?: Options) => void
  delete: (options?: Options) => void
}

const assign = (ob: any, ...o: any) => {
  o.forEach((obj: any) =>{if (typeof obj !== 'undefined')
    Object.defineProperties(ob, Object.getOwnPropertyDescriptors(obj))})
  return ob
}

export function useCrud (record: IRecord): CrudRecord {
  const crudManager = useContext(CrudContext)
  const [reference, forceRender] = useState({})

  return useMemo(() => {
    const CrudRecord = new Record(record, forceRender) as CrudRecord

    CrudRecord.save = function (options?: Options) {
      return crudManager.save(CrudRecord._record, options)
    }

    CrudRecord.delete = function (options?: Options) {
      return crudManager.delete(CrudRecord._record, options)
    }

    return assign({}, CrudRecord)
  }, [reference, record])
}
//
// export function useCrud (record: IRecord): CrudRecord {
//   const previousRecord = usePrevious(record)
//   const crudManager = useContext(CrudContext)
//   const [initialrec, initialLis] = createRecord(record)
//   const [stateRecord, setRecord] = useState(initialrec)
//   const [stateLis, setLis] = useState(initialLis)
//
//   console.log('render')
//
//   useEffect(() => {
//     if (previousRecord && previousRecord !== record) {
//       const [rec, lis] = createRecord(record)
//       setRecord(rec)
//       setLis(lis)
//       console.log('reset')
//     }
//   }, [record])
//
//   useEffect(() => {
//     console.log(stateLis())
//     console.log('effect', stateRecord, stateLis)
//     return stateLis((updatedRecord: Record) => {
//       console.log('listener', updatedRecord)
//       const [rec, lis] = createRecord(updatedRecord)
//       setRecord(rec)
//       setLis(lis)
//     })
//   }, [stateRecord, setLis])
//
//   return useMemo(() => {
//     stateRecord.save = function (options?: Options) {
//       return crudManager.save(stateRecord.record, options)
//     }
//
//     stateRecord.delete = function (options?: Options) {
//       return crudManager.delete(stateRecord.record, options)
//     }
//
//     console.log('meme', stateRecord)
//     return stateRecord
//   }, [stateRecord])
// }