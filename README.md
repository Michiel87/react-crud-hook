react-crud-hook
=============

[React](https://reactjs.org/) hook for CRUD-operations and record state management.

This package attempts to make it easier to perform CRUD-operations while also providing methods to set attributes and relationships on a record. Records should conform to the JSON:API specs - https://jsonapi.org/.
The react-crud-hook package is fully typed and optimized to prevent unnecessary renders.


Installation
------------

_npm_

```
npm install --save react-crud-hook
```

_yarn_

```
yarn add react-crud-hook
```

API
---

### `CrudManager`

```jsx
import { CrudManager } from 'react-crud-hook'

// First create a CRUD manager.
// The CRUD manager takes a single object with a promise for the createRecord, 
// updateRecord and deleteRecord attributes.
// You can use the extensions attribute to provide an object with custom extensions that
// will be returned in several callbacks later on as you perform CRUD-operations.
const manager = new CrudManager({
  createRecord: Promise<Record>,
  updateRecord: Promise<Record>,
  deleteRecord: Promise<RecordIdentifier>
  extensions: {
    dispatch: redux.dispatch,
    router: react.router,
    modal: modal
  }
})
```

### `Store`

```jsx
import { Store, Dispatcher, Reducer } from 'react-crud-hook'

// The store is not required as it is already provided by default. However if you like to customize how records are
// updated in the store you can provide your own Dispatcher and/or Reducer. 

const store = new Store({
  dispatcher: new Dispatcher(),
  reducer: new Reducer()
})

```

### `<CrudProvider/>`

By default the provider will have a store, where it manages records and subscriptions. However, you can also pass one
yourself.

```jsx
import { CrudProvider } from 'react-crud-hook'

// Store is not required - it will have one by default
ReactDOM.render(
  <CrudProvider manager={manager} store={Store}>
    <App/>
  </CrudProvider>,
  rootElement
)
```

### `useCrud(record, options?)`

```jsx
import { useCrud } from 'react-crud-hook'

const record = {
  type: 'user',
  id: '1',
  attributes: {
    name: 'Exivity'
  }
}

const ReactComponent = () => {
  const record = useCrud(record)

  // Perform mutations on mount
  useEffect(() => {
    record
      .setAttribute('name', 'Exivity rocks!')
      .setAttribute('age', 2)
      .addHasMany('employees', { type: 'employee', id: '2' })
      .addHasMany('clients', { type: 'client', id: '7' })
      .addHasOne('CEO', { type: 'CEO', id: '2' })
      .resetAttributes('age')
      .save({ 

        // Use standard callback enriched with extensions to perform side tasks
        beforeUpdate: (record, extensions) => {
          return extensions.modal('Are you sure you want to proceed with this update?')
        },
        onUpdate: (record, extensions) => {
          extensions.router.push(`/user/${user.id}`)
        }

        // You can also include custom properties that will be passed on to the CRUD-functions 
        // as second argument, such as a include property:
        include: {
          .........
        }
      })
  }, [record.id])
   // State is managed via a functional pattern so you do not have to worry about race conditions etc. 
   // Make sure to use the id instead of record itself as dependencies for useEffect as the record will have a new reference
   // after you call a method on it. Also, if you rely on record attributes or relations in your effect, do not forget to put those
   // in dependencies array.

  // Or perform mutations on events
  return (
    <div>
      <input value={record.attributes.name}
        onChange={(e) => record.setAttribute('name', e.target.value)}/>
      <button onClick={record.save}> Click </button>
    </div>
  )
  
    // Use curried methods
    return (
      <div>
        <input value={record.attributes.name}
          onChange={record.setAttribute('name')}/>
        <button onClick={record.save}> Click </button>
      </div>
    )
}
```

### `options?`

| Name | value | Description
|:---- |:---------- |:-----------
| unSubscribeDelay | number | When useCrud unmounts it deletes the associated record state from store - you can delay this with this option.
| onUnSubscribe | (record) => void | This callback will be called when a record unSubscribes from store. Normally this happens when useCrud unmounts unless the unSubscribeDelay option has been given.


### `Methods`

All the following methods, except for save and delete, can be curried by providing only the first argument.

| Name | Parameters | Description
|:---- |:---------- |:-----------
| setAttribute | attribute, value | Use ```setAttribute``` to update a record attribute.
| addHasMany | relationship, RecordIdentifier | Use ```addHasMany``` to add a **hasMany** related record.
| addHasOne | relationship, RecordIdentifier | Use ```addHasOne``` to add or replace a **hasOne** related record.
| removeRelationship | relationship, relatedId | Use ```removeRelationship``` to remove a **hasOne** or **hasMany** related record.
| reset | none | Use ```reset``` to reset all attributes and relationships to its initial value.
| resetAttributes | string or string[] | Use ```resetAttributes``` to specifically reset attributes only.
| resetRelationships | string or string[] | Use ```resetRelationships``` to specifically reset relationships only.
| save | options? | Use ```save``` to persist a record - ```save``` will determine by the presence of an **id** whether to *create* or *update*. Alongside of the standard callbacks you can provide custom options which will be passed to the provider crud-functions as second argument. 
| delete | options? | Use ```delete``` to delete a record.

### `Parameter types`

| Parameter | Type
|:--------- |:----
| attribute | string
| value | any
| relationship | string
| RecordIdentifier | ```{ id: string, type: string }```
| RelatedId | string
| options | ```{ ...standardCallbacks, ...customOptions }``` 

### `Standard callbacks and custom options`

Callbacks are handled by the manager and enriched with the extensions you provide to the CrudManager. Custom options are passed to each crud function (provided to the CrudManager) as second argument. You can use the following callbacks:

| Callback | arguments | Description
|:---------|:-----------|:-----------
| beforeCreate | record, extensions | You can return a Promise that either returns a new record which it then will use for the create operation or a truthy or falsy value. Instead of a Promise you can also just directly return a truthy/falsy value A truthy value will let the operation proceed and a falsy value will abort it.
| onCreate | record, extensions | onCreate will be called on fulfillment of the operation.
| beforeUpdate | record, extensions | Works like beforeCreate.
| onUpdate | record, extensions | Works like onCreate.
| beforeDelete | record, extensions | Works like beforeCreate.
| onDelete | recordIdentifier, extensions | Works like onCreate.
| onError | error, record, extensions | If a operation (promise) catches, onError will be called.
 

License
-------

MIT
