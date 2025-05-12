/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j");

    collection.options = {
      query: "@request.collection.registrations.len() = registrations_count",
    };

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("uhotet93tr7yj3j");

    collection.options = {};

    return app.save(collection);
  },
);
