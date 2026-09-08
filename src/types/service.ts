// ============================================================
// 样式服务统一接口
// ============================================================
// 所有样式服务（背景/侧栏/编辑器/文件浏览器）均实现该生命周期：
//   - enable(): 启用并注册监听器，注入样式
//   - disable(): 停用并清理注入的样式/监听器
//   - apply(): 按最新设置刷新门控类与 CSS 变量（幂等）
// 由 StyleServiceRegistry 统一以 enableAll/applyAll/disableAll 循环驱动，
// 使 main.ts 不必感知具体服务，新增服务只需在 registry 数组追加一行。
export interface StyleService {
  enable(): void;
  disable(): void;
  apply(): void;
}
