/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("s19fbm1ivu7qtvq")

  // remove field
  collection.fields.removeById("4brlpmyn")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("s19fbm1ivu7qtvq")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "4brlpmyn",
    "max": 0,
    "min": 0,
    "name": "activityId",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
