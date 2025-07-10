// 文件名应该是: /functions/[[default]].js
export async function onRequest(context) {
  const logs = [];

  function log(message, data = null) {
    const logEntry = data ? `${message}: ${JSON.stringify(data)}` : message;
    logs.push(logEntry);
  }

  try {
    log('=== Pages Functions 开始执行 ===');

    const { request } = context;
    log('请求 URL', request.url);
    log('请求方法', request.method);

    // 验证 User-Agent
    const userAgent = request.headers.get('User-Agent');
    log('User-Agent', userAgent);

    // 解析 URL
    const url = new URL(request.url);
    log('URL pathname', url.pathname);
    log('URL search', url.search);
    log('URL hash', url.hash);

    let targetUrl = url.pathname.slice(1); // 去掉开头的 /
    log('去掉开头 / 后的 targetUrl', targetUrl);

    // 如果还有查询参数，也要包含进来
    if (url.search) {
      targetUrl += url.search;
      log('添加查询参数后的 targetUrl', targetUrl);
    }

    if (!targetUrl) {
      log('targetUrl 为空，返回 400');
      return new Response('页面为空\n\n调试日志:\n' + logs.join('\n'), {
        status: 400,
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }

    log('开始验证目标 URL');

    // 确保 URL 格式正确
    let fullTargetUrl = targetUrl;
    log('原始 fullTargetUrl', fullTargetUrl);

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      fullTargetUrl = 'https://' + targetUrl;
      log('添加 https:// 前缀后的 fullTargetUrl', fullTargetUrl);
    }

    const targetURL = new URL(fullTargetUrl);
    log('目标 URL href', targetURL.href);
    log('目标 URL protocol', targetURL.protocol);

    if (!['http:', 'https:'].includes(targetURL.protocol)) {
      log('协议无效，返回 400');
      return new Response('无效的URL\n\n调试日志:\n' + logs.join('\n'), {
        status: 400,
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }

    log('开始创建新请求');

    // 创建新请求，直接使用目标 URL
    const newRequest = new Request(targetURL.href, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    log('新请求创建成功，URL', newRequest.url);
    log('新请求方法', newRequest.method);

    log('开始发起 fetch 请求');

    // 发起请求并返回响应
    const response = await fetch(newRequest);

    log('fetch 请求完成');
    log('响应状态', response.status);
    log('响应状态文本', response.statusText);

    // 如果是调试模式，返回调试信息
    if (url.searchParams.get('debug') === '1') {
      const responseHeaders = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      log('响应头', responseHeaders);

      return new Response('调试信息:\n' + logs.join('\n'), {
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }

    // 创建新响应并添加 CORS 头
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    log('CORS 头设置完成，准备返回响应');

    return newResponse;

  } catch (error) {
    log('=== 发生错误 ===');
    log('错误类型', error.name);
    log('错误消息', error.message);
    log('错误堆栈', error.stack);

    return new Response(`代理请求失败: ${error.message}\n\n调试日志:\n` + logs.join('\n'), {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    });
  }
}