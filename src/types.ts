export interface SiteCard {
  id: string; // nanoid 生成
  url: string; // 原始 URL
  name: string; // 网站名称
  domain: string; // 自动解析的域名
  desc?: string; // 描述
  thumb?: string; // 缩略图 URL
  thumbType: 'auto' | 'manual' | 'upload' | 'favicon' | 'fallback';
  tags: string[]; // 标签列表
  color?: string; // fallback 背景色
  order: number; // 排序权重
  isPinned?: boolean; // 新增：是否置顶星标
  createdAt: string; // ISO 时间戳
  updatedAt: string;
}

export interface AppData {
  cards: SiteCard[];
  tags: string[]; // 所有标签（去重）
  version: string; // 数据版本，用于迁移
}
