# 一次性讲清楚事件循环机制

JavaScript 是单线程语言，同一时刻只能执行一段同步代码。但浏览器还要处理点击、定时器、网络请求和页面渲染，所以需要事件循环来协调这些任务。

> 核心规则：同步代码先执行，微任务清空后，再取一个宏任务。

## 四个核心角色

- 调用栈：执行同步代码。
- Web APIs：处理定时器、网络请求、DOM 事件。
- 微任务队列：保存 Promise 回调、queueMicrotask。
- 宏任务队列：保存 setTimeout、事件回调、I/O。

## 微任务和宏任务

| 队列 | 常见来源 | 优先级 |
| --- | --- | --- |
| 微任务 | Promise.then、await 后续代码 | 高 |
| 宏任务 | setTimeout、setInterval、事件回调 | 低 |

## 经典题目

```js
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("sync");
```

执行顺序是：

1. sync
2. promise
3. timeout

因为整段同步代码先跑完，然后清空微任务，最后才进入宏任务阶段。
