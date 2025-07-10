export async function onRequest(context) {
  console.log('=== Pages Functions 开始执行 ===');

  const { request } = context;
  console.log('请求对象:', request);
  console.log('请求 URL:', request.url);
  console.log('请求方法:', request.method);

  // 验证 User-Agent
  const userAgent = request.headers.get('User-Agent');
  console.log('User-Agent:', userAgent);
  //if (!userAgent?.includes('MiniSkins')) {
  //  return new Response('Not Found', { status: 404 });
  //}

  // 解析 URL
  const url = new URL(request.url);
  console.log('解析后的 URL 对象:', url);
  console.log('URL pathname:', url.pathname);
  console.log('URL search:', url.search);
  console.log('URL hash:', url.hash);

  let targetUrl = url.pathname.slice(1); // 去掉开头的 /
  console.log('去掉开头 / 后的 targetUrl:', targetUrl);

  // 如果还有查询参数，也要包含进来
  if (url.search) {
    targetUrl += url.search;
    console.log('添加查询参数后的 targetUrl:', targetUrl);
  }

  if (!targetUrl) {
    console.log('targetUrl 为空，返回 400');
    return new Response('页面为空', { status: 400 });
  }

  // 验证目标 URL
  try {
    console.log('开始验证目标 URL');

    // 确保 URL 格式正确
    let fullTargetUrl = targetUrl;
    console.log('原始 fullTargetUrl:', fullTargetUrl);

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      fullTargetUrl = 'https://' + targetUrl;
      console.log('添加 https:// 前缀后的 fullTargetUrl:', fullTargetUrl);
    }

    const targetURL = new URL(fullTargetUrl);
    console.log('解析后的目标 URL 对象:', targetURL);
    console.log('目标 URL href:', targetURL.href);
    console.log('目标 URL protocol:', targetURL.protocol);

    if (!['http:', 'https:'].includes(targetURL.protocol)) {
      console.log('协议无效，返回 400');
      return new Response('无效的URL', { status: 400 });
    }

    console.log('开始创建新请求');

    // 创建新请求，直接使用目标 URL
    const newRequest = new Request(targetURL.href, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    console.log('新请求创建成功:', newRequest);
    console.log('新请求 URL:', newRequest.url);
    console.log('新请求方法:', newRequest.method);

    console.log('开始发起 fetch 请求');

    // 发起请求并返回响应
    const response = await fetch(newRequest);

    console.log('fetch 请求完成');
    console.log('响应状态:', response.status);
    console.log('响应状态文本:', response.statusText);
    console.log('响应头:', response.headers);

    // 创建新响应并添加 CORS 头
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    console.log('新响应创建成功');

    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    console.log('CORS 头设置完成');

    console.log('=== 准备返回响应 ===');
    return newResponse;

  } catch (error) {
    console.error('=== 发生错误 ===');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.error('完整错误对象:', error);

    return new Response(`代理请求失败: ${error.message}`, {
      status: 500,
      headers: {
        'content-type': 'text/plain; charset=utf-8'
      }
    });
  }
}