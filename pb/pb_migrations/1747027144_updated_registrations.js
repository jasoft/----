/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("s19fbm1ivu7qtvq")

  // add field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "uhotet93tr7yj3j",
    "hidden": false,
    "id": "relation2893285722",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "activity",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("s19fbm1ivu7qtvq")

  // remove field
  collection.fields.removeById("relation2893285722")

  return app.save(collection)
})
