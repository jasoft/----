/// <reference path="../pb_data/types.d.ts" />
migrate(
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq");

    // 添加验证规则：确保同一活动中不能出现重复的手机号
    collection.createRule =
      '@request.data.phone?!exists(collection("registrations").activityId=@request.data.activityId&&phone=@request.data.phone)';

    return dao.saveCollection(collection);
  },
  (db) => {
    const dao = new Dao(db);
    const collection = dao.findCollectionByNameOrId("s19fbm1ivu7qtvq");

    collection.createRule = "";

    return dao.saveCollection(collection);
  },
);
