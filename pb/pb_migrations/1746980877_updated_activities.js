/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number2845981692",
    "max": null,
    "min": 0,
    "name": "registrations_count",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j")

  // remove field
  collection.fields.removeById("number2845981692")

  return app.save(collection)
})
