/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
})
