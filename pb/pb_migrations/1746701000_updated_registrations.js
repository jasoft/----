/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq");

    // remove photo field
    collection.schema.removeField("wcmxmqh3");

    // update activityId field to required
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "4brlpmyn",
        name: "activityId",
        type: "text",
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: "",
        },
      }),
    );

    // update name field to required
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "28yrlrda",
        name: "name",
        type: "text",
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: 2,
          max: 20,
          pattern: "",
        },
      }),
    );

    // add phone field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "phone_field",
        name: "phone",
        type: "text",
        required: true,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: "^1[3-9]\\d{9}$",
        },
      }),
    );

    // keep isWinner field
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "zkl6mdq5",
        name: "isWinner",
        type: "bool",
        required: false,
        presentable: false,
        unique: false,
        options: {},
      }),
    );

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
        presentable: false,
        unique: false,
        options: {
          mimeTypes: ["image/png", "image/jpeg"],
          thumbs: ["100x100"],
          maxSelect: 1,
          maxSize: 5242880,
          protected: false,
        },
      }),
    );

    // revert other fields to original state
    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "4brlpmyn",
        name: "activityId",
        type: "text",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: "",
        },
      }),
    );

    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "28yrlrda",
        name: "name",
        type: "text",
        required: false,
        presentable: false,
        unique: false,
        options: {
          min: null,
          max: null,
          pattern: "",
        },
      }),
    );

    collection.schema.removeField("phone_field");

    collection.schema.addField(
      new SchemaField({
        system: false,
        id: "zkl6mdq5",
        name: "isWinner",
        type: "bool",
        required: false,
        presentable: false,
        unique: false,
        options: {},
      }),
    );

    return dao.saveCollection(collection);
  },
);
