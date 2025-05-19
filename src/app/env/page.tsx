export default function EnvPage() {
  // 获取所有环境变量
  const allEnvVars = { ...process.env };

  // 移除敏感信息
  const sensitiveKeys = [
    "DB_PASSWORD",
    "DB_USER",
    "SECRET_KEY",
    "API_KEY",
    "TOKEN",
    "PASSWORD",
    "AUTH",
    "CREDENTIAL",
  ];

  // 过滤掉包含敏感词的键
  Object.keys(allEnvVars).forEach((key) => {
    if (
      sensitiveKeys.some((sensitive) => key.toUpperCase().includes(sensitive))
    ) {
      delete allEnvVars[key];
    }
  });

  // 对环境变量进行分类
  const categories = {
    NEXT: [] as [string, string][],
    NODE: [] as [string, string][],
    APP: [] as [string, string][],
    OTHER: [] as [string, string][],
  };

  Object.entries(allEnvVars).forEach(([key, value]) => {
    if (key.startsWith("NEXT_")) {
      categories.NEXT.push([key, value!]);
    } else if (key.startsWith("NODE_")) {
      categories.NODE.push([key, value!]);
    } else if (key.startsWith("APP_")) {
      categories.APP.push([key, value!]);
    } else {
      categories.OTHER.push([key, value!]);
    }
  });

  return (
    <div className="container mx-auto space-y-6 p-4">
      <h1 className="text-2xl font-bold">环境变量</h1>

      {Object.entries(categories).map(
        ([category, vars]) =>
          vars.length > 0 && (
            <div key={category} className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-3 text-xl font-semibold">{category}</h2>
              <div className="grid gap-2">
                {vars.map(([key, value]) => (
                  <div key={key} className="rounded border bg-gray-50 p-2">
                    <div className="font-medium text-gray-700">{key}</div>
                    <div className="break-all text-gray-600">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ),
      )}
    </div>
  );
}
