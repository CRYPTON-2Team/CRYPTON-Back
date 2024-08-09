export const RedisKeys = {
  fileAccessKey: (fileId: number) => `fileShare:${fileId}:accessKey`,
  fileRequestNotification: (requestId: number) =>
    `fileRequest:${requestId}:notification`,
  // 필요에 따라 다른 키들을 추가할 수 있습니다.
};
