/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("s19fbm1ivu7qtvq")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("s19fbm1ivu7qtvq")

  // update collection data
  unmarshal({
    "deleteRule": "",
    "updateRule": ""
  }, collection)

  return app.save(collection)
})
