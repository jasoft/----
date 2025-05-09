/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq");

    // 添加验证规则：确保同一活动中不能出现重复的手机号
    collection.createRule = `
    let hasExisting = false;
    for rec in collection("registrations").records {
      if rec.activityId = @request.data.activityId && rec.phone = @request.data.phone {
        hasExisting = true;
        break;
      }
    }
    return !hasExisting;
  `;

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq");

    collection.createRule = "";

    return dao.saveCollection(collection);
  },
);
