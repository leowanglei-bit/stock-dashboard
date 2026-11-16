/**
 * 静态资源路径：GitHub Pages 项目站点部署在 /<repo>/ 子路径下（CI 注入 NEXT_PUBLIC_BASE_PATH），
 * 本地 dev / 预览不设该变量即为空串。纯 <img src> 不会自动带前缀，统一走这里拼。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const asset = (path: string) => `${BASE_PATH}${path}`;

/** 站点图标 / 品牌 logo：public/Icon-60@3x.png（180×180） */
export const SITE_ICON = asset('/Icon-60@3x.png');
