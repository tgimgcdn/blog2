---
title: "基于Cloudflare Pro和Snippets的WAF防护规则"
description: "基于Cloudflare Pro和Snippets的WAF防护规则"
publishDate: "2024-04-30"
updatedDate: "2025-04-30"
tags: ['Cloudflare', 'WAF','Snippets','安全']
author: "cmssky"
---

本文尝试分享一些基于Cloudflare Pro 以及 Snippets 的防护规则/配置/代码。在规则方面，尽可能做到精简。

世界上不可能有两个一模一样的站点（就算内容、程序一样，流量也不可能完全一样），所以也不可能有适配所有网站的通用WAF规则。本文例子中的站点为虚构站点（`f47fb81b34.com`），该网站是使用了开源程序typecho搭建的个人博客，日流量2000 IP左右），以下规则是针对该站点的。

注：以下内容**仅供参考**。

---

# 1. 对搜索引擎等友好爬虫进行过白

后续的WAF规则会对爬虫进行拦截，在这些规则之前，我们需要对友好的爬虫进行过白。假设我们需要将搜索引擎以及指定IP（13.3.3.3）纳入白名单。

点击安全性，选择WAF，创建规则。**请注意，该规则需要放置在后续其他拦截规则之前**。
![image](https://cdn.canjie.org/Dq2jowEO1JyBrTCJP818GI.png)
![image](https://cdn.canjie.org/c0c9ee9952dc8c31.png)
![image](https://cdn.canjie.org/ffa9e492b121cd24.png)

注：Google Search Console的抓取工具属于Google Inspection Tool，该工具在Cloudflare Radar（[https://radar.cloudflare.com/traffic/verified-bots](https://radar.cloudflare.com/traffic/verified-bots) ）的分类中为安全性。
![image](https://cdn.canjie.org/7ffbc847c747ae34.png)
在极少数场景下，Cloudflare 可能对搜索引擎的判断有误，这会导致极少数情况下无法对搜索引擎自动过白，这时候我们需要手动将搜索引擎IP纳入ip list里。

谷歌ip list可参考

```
https://developers.google.com/search/apis/ipranges/googlebot.json
https://developers.google.com/search/apis/ipranges/user-triggered-fetchers.json
https://developers.google.com/search/apis/ipranges/user-triggered-fetchers-google.json
```

必应ip list可参考

```
https://www.bing.com/toolbox/bingbot.json
```

IPlist的创建方法如下：

1. 点击管理账户。
2. 点击配置。
   ![image](https://cdn.canjie.org/c4b3bb13c9486cf2.png)
3. 点击列表，创建一个新的iplist。
   ![image](https://cdn.canjie.org/92f16f75ec9b1ba6.png)
4. 将需要过白的ip或ip段导入。
   如图所示
   ![image](https://cdn.canjie.org/7fa3f37013206c2f.png)

回到刚才的WAF规则，重新编辑whitelist规则。
![image](https://cdn.canjie.org/f35d5f9a32d7cd4c.png)

## 2. 屏蔽恶意bot以及异常的请求

创建一条新规则，放置在whitelist之后，命名为block，采取措施为阻止。
![image](https://cdn.canjie.org/742c8866fca69187.png)
表达式

```
(not len(http.request.headers["accept-language"]) > 0) or (not starts_with(http.user_agent, "Mozilla/5.0")) or (http.user_agent contains "bot") or (ip.src.country in {"T1"}) or (http.user_agent contains "Bot") or (http.user_agent contains "http") or (http.user_agent contains "rawler") or (http.user_agent contains "pider")
```

注：

1. CF防火墙的UA匹配是区分大小写的，部分bot UA会包含bot而部分会包含Bot，所以需要区分开来，而少部分UA可能会包含crawler或Crawler，所以上述规则用rawler匹配两种情况。
2. 正常的浏览器访客的UA都是以Mozilla/5.0开头且accept-language必定不为空。
3. 部分扫描程序的ua会包含http，但不包含bot，用UA包含http可以匹配并封禁掉众多公开扫描程序。比如 Censys
4. 部分Botnet来源于Tor节点，可根据实际情况觉得是否禁止tor用户访问。

```
Mozilla/5.0 (compatible; CensysInspect/1.1; +https://about.censys.io/)
```

## 3. 对部分异常流量进行质询

假设网站大部分用户都来自中文用户，那么可以accept-language进行进一步判断，比如大部分中文访客的accept-language都包含zh，如果请求中accept-language不包含zh，那么有可能为异常流量。且大多访客的http版本为http2和http3，就此我们可以设置一条新规则challenge，放在block规则之下。
![image](https://cdn.canjie.org/4034?7a690a95dfc5e052.png)

注：启用该规则后，正常访客有可能（小概率事件）也被要求完成人机验证。

此外，CF有三种类型的人机验证，分别是交互式质询、托管质询和JS质询，JS质询无需用户点击，由浏览器自动执行脚本并完成验证，交互式质询需要用户点击确认框，而托管质询介于两者之间，根据用户环境，由CF选择对用户实行JS还是交互式质询。

## 4. 对部分疑似恶意的请求进行质询/阻止

该规则组匹配的内容较多，篇幅有限，就不一一说明了。
表达式如下

```
(http.user_agent contains "MSIE") or (not http.request.method in {"GET" "POST" "HEAD"}) or (http.request.full_uri contains "well-known") or (len(http.request.headers["via"]) > 0) or (http.user_agent contains "; +") or (http.request.uri.path contains "//") or (http.x_forwarded_for contains ".") or (len(http.request.headers["x-forwarded-host"]) > 0) or (len(http.request.headers["cdn-loop"]) > 0) or (len(http.request.headers["cf-ew-via"]) > 0) or (http.user_agent contains "\\x09") or (http.user_agent contains "Trident") or (http.user_agent contains "Headless") or (http.request.uri contains "--+") or (http.user_agent contains "{") or (http.user_agent contains "$") or (http.user_agent contains "<") or (http.user_agent contains "script") or (http.request.uri contains "\\x") or (any(http.request.headers["sec-fetch-site"][*] contains "cr") and any(http.request.headers["sec-fetch-mode"][*] contains "no"))
```

此规则组误报率极低，视实际情况，选择质询或阻止。

## 5. 配置超级自动程序攻击模式（Super Bot Fight）

点击安全性，选择自动程序。
![image](https://cdn.canjie.org/6c7f2fcb83dc815e.png)

开启后，CF会对部分模拟浏览器的自动化请求进行拦截（大概率是基于tls指纹，屏蔽了curl、golang等常见的tls指纹）。对低级的自动化请求有一定效果，聊胜于无。Business及以上版本可以开启对 **likely automated** 的请求的识别和阻止。

## 6. 开启托管规则集，并进行微调

![image](https://cdn.canjie.org/9b3224cb51d5dfc3.png)
编辑该规则，参考下图，对部分默认规则进行覆盖。
![image](https://cdn.canjie.org/c3d948d88ef85314.png)
![image](https://cdn.canjie.org/b1aeff99fb34e508.png)

## 7. 开启DDoS规则覆盖，微调默认规则

![image](https://cdn.canjie.org/c321e830472c54e7.png)
![image](https://cdn.canjie.org/958228c236d588e5.png)
点击编辑规则，搜索impersonate，修改部分参数，如下图所示，然后保存。
![image](https://cdn.canjie.org/039582b7aea5a599.png)

## 8. 调整安全级别、开启浏览器完整性检查

点击安全性，选择设置，将安全级别由默认值改为高，并开启浏览器完整性检查。

注：该功能作用甚微。

## 9. 关闭IPv6、Pseudo IPv4以及洋葱路由

![image](https://cdn.canjie.org/d04a6ae94dfcaf8d.png)
![image](https://cdn.canjie.org/5e7a685c03faf9ab.png)
![image](https://cdn.canjie.org/82838d68a94902a8.png)
注：可根据实际情况决定是否关闭。关闭IPv6需借助api。

借助api关闭ipv6后，还需进一步在WAF规则里对 `::/0`进行屏蔽。

## 10. 开启速率限制

在WAF中开启速率限制，具体配置需视情况而定。

![image](https://cdn.canjie.org/2a46c21effb33efa.png)

## 11. 利用Snippets做一个简易的302 cookie验证

当我们请求path.net时，会发现网站会返回307状态码，且在响应头里有一个名为CRANE的cookie，正常浏览器访问会根据网站响应头，设置cookie，这样第二次访问的时浏览器就会携带cookie访问 [path.net](https://www.nodeseek.com/jump?to=http%3A%2F%2Fpath.net)，而低级的自动化程序是无法自动获取并携带cookie去请求网站的，而这将会让程序陷入无尽的307循环，如下图所示。
![image](https://cdn.canjie.org/4035?fe2e6df4a65d463c.png)

据此，我们可以利用Cloudflare的Snippets做一个类似的简易人机验证，我们将访客的IP、访客UA以及自定义key进行组合，然后sha256对组合进行加密，并通过响应头发送给访客，访客访问网站时需携带snippets发送的cookie进行请求，才能顺利访问网站。

点击网站规则，选择Snippets，点击创建片段。

代码如下(仅供参考，自行修改secretKey的值)

```
export default {
    async fetch(request) {
        const clientIp = request.headers.get('cf-connecting-ip') || "";
        const ua = request.headers.get('user-agent') || "";
        const secretKey = "h*dUm|mdS^6=QB)y";

        // 组合并生成哈希值
        const signatureBase = `${clientIp}${ua}${secretKey}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(signatureBase);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        let cookies = request.headers.get('Cookie') || "";

        // 检查是否包含特定的 Cookie
        if (cookies.includes(hashHex)) {
            // 如果已经包含，直接返回原始请求
            return await fetch(request);
        } else {
            // 否则生成重定向响应
            const newResponse = new Response(null, {
                status: 302,
                headers: {
                    "Set-Cookie": `_test=${hashHex}; Path=/; HttpOnly`,
                    "Location": request.url,
                }
            });
            return newResponse;
        }
    },
};
```

根据实际情况，匹配snippets生效规则。
![image](https://cdn.canjie.org/1f80356d529289e8.png)

注：
1.该snippets没有对搜索引擎进行过白，如果需要过白部分请求，需要做额外的处理。
2.该snippets具有一定局限性，可以考虑纳入更多的请求参数，进一步完善snippets。
3.该snippets对高阶的自动化请求无效。

## 12. Snnippets拓展

例如可以利用snippets创建点击验证、验证码验证、hcaptcha验证等。
**一些示例**（需用海外IP访问）

> 点击验证
> [https://iplark.com/playground/captcha/click](https://iplark.com/playground/captcha/click)
> ![image](https://cdn.canjie.org/68f068a924c63a5b.png)

> 图片验证码
> [https://iplark.com/playground/captcha/image](https://iplark.com/playground/captcha/image)
> ![image](https://cdn.canjie.org/d78e02ee389bf3e90491e3fc437df09261791.webp)

> Hcaptcha
> [https://iplark.com/playground/captcha/hcaptcha](https://iplark.com/playground/captcha/hcaptcha)
> ![image](https://cdn.canjie.org/296ef2fb73c5d9d54a4a57ed2dab678956877.webp)

**[首发于NodeSeek，转载请注明出处。](https://www.nodeseek.com/post-221850-1)**

| IPLark | [https://iplark.com/](https://iplark.com/)             |
| ------ | ------------------------------------------------------ |
| IP查询 | [https://iplark.com/search](https://iplark.com/search) |
| 本机IP | [https://iplark.com/myip](https://iplark.com/myip)     |
