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

    // 解析 URL
    const url = new URL(request.url);
    log('URL pathname', url.pathname);

    let targetUrl = url.pathname.slice(1); // 去掉开头的 /
    log('去掉开头 / 后的 targetUrl', targetUrl);

    // 如果还有查询参数，也要包含进来
    if (url.search) {
      targetUrl += url.search;
      log('添加查询参数后的 targetUrl', targetUrl);
    }

    // 处理默认页面（空路径）
    if (!targetUrl) {
      log('targetUrl 为空，返回400错误');
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

    // 创建新的请求头，移除一些可能导致问题的头部
    const newHeaders = new Headers();

    // 复制原始请求头，但跳过一些可能有问题的头部
    const skipHeaders = ['host', 'referer', 'origin', 'x-forwarded-for', 'x-real-ip'];

    for (const [key, value] of request.headers) {
      if (!skipHeaders.includes(key.toLowerCase())) {
        newHeaders.set(key, value);
      }
    }

    // 设置一些常用的请求头
    newHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    newHeaders.set('Accept', '*/*');
    newHeaders.set('Accept-Language', 'en-US,en;q=0.9');
    newHeaders.set('Accept-Encoding', 'gzip, deflate, br');
    newHeaders.set('Connection', 'keep-alive');

    log('处理后的请求头数量', newHeaders.size);

    log('开始发起 fetch 请求');

    // 添加 fetch 选项来处理网络问题
    const fetchOptions = {
      method: request.method,
      headers: newHeaders,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      redirect: 'follow',
    };

    log('Fetch 选项准备完成');

    // 发起请求并返回响应
    const response = await fetch(targetURL.href, fetchOptions);

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

    // 如果是测试模式，尝试访问一个简单的URL
    if (url.searchParams.get('test') === '1') {
      try {
        const testResponse = await fetch('https://httpbin.org/get');
        log('测试请求成功', testResponse.status);
        const testText = await testResponse.text();
        return new Response(`测试成功:\n${testText}\n\n调试日志:\n` + logs.join('\n'), {
          headers: { 'content-type': 'text/plain; charset=utf-8' }
        });
      } catch (testError) {
        log('测试请求失败', testError.message);
        return new Response(`测试失败:\n${testError.message}\n\n调试日志:\n` + logs.join('\n'), {
          headers: { 'content-type': 'text/plain; charset=utf-8' }
        });
      }
    }

    log('开始创建流式响应');

    // 创建新响应头，保留原始响应的重要头部
    const responseHeaders = new Headers();

    // 复制重要的响应头
    const importantHeaders = [
      'content-type',
      'content-length',
      'content-disposition',
      'content-encoding',
      'cache-control',
      'expires',
      'last-modified',
      'etag',
      'accept-ranges'
    ];

    importantHeaders.forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        responseHeaders.set(headerName, headerValue);
      }
    });

    // 添加 CORS 头
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    log('响应头设置完成');

    // 创建流式响应，直接传递响应体
    const streamResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

    log('流式响应创建完成，准备返回');

    return streamResponse;

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