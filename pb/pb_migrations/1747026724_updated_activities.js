/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j")

  // update field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": true,
    "collectionId": "s19fbm1ivu7qtvq",
    "hidden": false,
    "id": "relation1407078887",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "registrations",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j")

  // update field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": true,
    "collectionId": "s19fbm1ivu7qtvq",
    "hidden": false,
    "id": "relation1407078887",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "registrations",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
