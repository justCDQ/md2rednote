export function updateSystemInfo(els, system) {
  els.systemVersion.textContent = system.version || "未知";
  els.systemPlatform.textContent = `${system.platform || "unknown"} / ${system.arch || "unknown"}`;
  els.systemPort.textContent = system.port ? String(system.port) : "未知";
  els.systemOutput.textContent = system.defaultOutput || "未获取";
  if (system.chromePath) {
    els.systemChrome.textContent = `已检测到：${system.chromePath}`;
    els.systemChrome.className = "system-ok";
  } else {
    els.systemChrome.textContent = "未检测到，请安装 Chrome/Edge 或手动填写路径";
    els.systemChrome.className = "system-warn";
  }
}

export function diagnosticsText({ systemInfo, payload, lastError }) {
  const data = payload();
  return [
    "md2rednote 诊断信息",
    `版本: ${systemInfo?.version || "unknown"}`,
    `系统: ${systemInfo?.platform || "unknown"} / ${systemInfo?.arch || "unknown"}`,
    `端口: ${systemInfo?.port || "unknown"}`,
    `默认输出目录: ${systemInfo?.defaultOutput || "unknown"}`,
    `当前输出目录: ${data.outputDir || systemInfo?.defaultOutput || "default"}`,
    `检测到的 Chrome/Edge: ${systemInfo?.chromePath || "未检测到"}`,
    `当前 Chrome/Edge 路径: ${data.chromePath || "留空"}`,
    `最近一次错误: ${lastError || "无"}`,
  ].join("\n");
}
