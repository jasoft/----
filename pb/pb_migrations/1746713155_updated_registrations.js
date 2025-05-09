/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq")

  collection.createRule = ""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq")

  collection.createRule = "\n    let hasExisting = false;\n    for rec in collection(\"registrations\").records {\n      if rec.activityId = @request.data.activityId && rec.phone = @request.data.phone {\n        hasExisting = true;\n        break;\n      }\n    }\n    return !hasExisting;\n  "

  return dao.saveCollection(collection)
})
