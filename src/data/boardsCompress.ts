/**
 * boards.json 压缩/展开工具
 * 压缩：去掉价格、缩短字段名，节省约 70% 体积
 * 展开：从压缩格式恢复为完整格式
 */

const M_NUM: Record<string, number> = { sh: 0, sz: 1, chinext: 2, star: 3, bse: 4 };
const M_STR: Record<number, string> = { 0: 'sh', 1: 'sz', 2: 'chinext', 3: 'star', 4: 'bse' };

/** 压缩：完整格式 → 紧凑格式 */
export function compress(boards: Record<string, any>, boardOrder: string[]): any {
  const b: any = {};
  for (const [id, board] of Object.entries(boards)) {
    b[id] = {
      t: board.title,
      s: board.stocks.map((s: any) => ({
        id: s.id, c: s.code, n: s.name, m: M_NUM[s.market] ?? 0,
      })),
    };
  }
  return { b, o: boardOrder };
}

/** 展开：紧凑格式 → 完整格式 */
export function expand(data: any): ServerData {
  const rawBoards = data.b || data.boards || {};
  const rawOrder = data.o || data.boardOrder || [];
  const boards: Record<string, any> = {};
  for (const [id, board] of Object.entries(rawBoards)) {
    const b = board as any;
    boards[id] = {
      id,
      title: b.t || b.title || '',
      stocks: (b.s || b.stocks || []).map((s: any) => ({
        id: s.id || ('stk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
        code: s.c || s.code || '',
        name: s.n || s.name || '',
        market: M_STR[typeof s.m === 'number' ? s.m : M_NUM[s.market] ?? 0] || 'sh',
        price: 0, prevClose: 0, changePercent: 0,
      })),
    };
  }
  return { boards, boardOrder: rawOrder } as ServerData;
}

interface ServerData {
  boards: Record<string, any>;
  boardOrder: string[];
}
