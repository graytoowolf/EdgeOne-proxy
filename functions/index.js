export async function onRequest(context) {
  const { request } = context;

  // 验证 User-Agent
  const userAgent = request.headers.get("User-Agent");
  //if (!userAgent?.includes('MiniSkins')) {
  //  return new Response('Not Found', { status: 404 });
  //}

  // 解析 URL
  const url = new URL(request.url);
  let targetUrl = url.pathname.slice(1); // 去掉开头的 /

  // 如果还有查询参数，也要包含进来
  if (url.search) {
    targetUrl += url.search;
  }

  if (!targetUrl) {
    return new Response("页面为空", { status: 400 });
  }

  // 验证目标 URL
  try {
    // 确保 URL 格式正确
    let fullTargetUrl = targetUrl;
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      fullTargetUrl = "https://" + targetUrl;
    }

    const targetURL = new URL(fullTargetUrl);
    if (!["http:", "https:"].includes(targetURL.protocol)) {
      return new Response("无效的URL", { status: 400 });
    }

    // 创建新请求，直接使用目标 URL
    const newRequest = new Request(targetURL.href, {
      method: request.method,
      headers: request.headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? request.body
          : null,
    });

    // 发起请求并返回响应
    const response = await fetch(newRequest);

    // 创建新响应并添加 CORS 头
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    newResponse.headers.set("Access-Control-Allow-Origin", "*");

    return newResponse;
  } catch (error) {
    console.error("代理请求错误:", error);
    return new Response(`代理请求失败: ${error.message}`, { status: 500 });
  }
}
