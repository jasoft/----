/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq");

    // remove photo field
    collection.schema.removeField("wcmxmqh3");

    // add phone field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "phone_field",
        name: "phone",
        type: "text",
        required: true,
        options: {
          min: 11,
          max: 11,
          pattern: "^1[3-9]\\d{9}$",
        },
      }),
    );

    // update name field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "28yrlrda",
        name: "name",
        type: "text",
        required: true,
        options: {
          min: 2,
          max: 20,
          pattern: "",
        },
      }),
    );

    // update activityId field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "4brlpmyn",
        name: "activityId",
        type: "text",
        required: true,
        options: {
          min: null,
          max: null,
          pattern: "",
        },
      }),
    );

    // add validation rule for duplicate phone
    collection.createRule =
      "@collection.registrations.phone?!~@request.data.phone";

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq");

    // add back photo field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "wcmxmqh3",
        name: "photo",
        type: "file",
        required: false,
        options: {
          mimeTypes: ["image/png", "image/jpeg"],
          thumbs: ["100x100"],
          maxSelect: 1,
          maxSize: 5242880,
          protected: false,
        },
      }),
    );

    // remove phone field
    collection.schema.removeField("phone_field");

    // revert name field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "28yrlrda",
        name: "name",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: "",
        },
      }),
    );

    // revert activityId field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "4brlpmyn",
        name: "activityId",
        type: "text",
        required: false,
        options: {
          min: null,
          max: null,
          pattern: "",
        },
      }),
    );

    // remove validation rule
    collection.createRule = "";

    return dao.saveCollection(collection);
  },
);
