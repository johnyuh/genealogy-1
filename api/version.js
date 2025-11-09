// api/version.js
export default function handler(req, res) {
  const data = {
    project: "genealogy-1",             // 專案代碼（genealogy-x 時改這裡）
    title: "g1宗譜",             	 // 專案名稱
    version: "1.0.0",                   // 版本號（自行管理）
    updated: "2025-11-08",              // 最近更新日期
    sponsor: "OS星火",                  // 製作單位
    donate: "15mJmocR3yikpojcn13chojVfRNtFJJF8z3sia4GEm2jFm9Q"
  };
  res.status(200).json(data);
}
