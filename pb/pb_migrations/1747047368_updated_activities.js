/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j")

  // update collection data
  unmarshal({
    "updateRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
})
