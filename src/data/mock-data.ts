export const mockSql = `-- Depo 101 stok bakiyeleri, ilk 100 kayıt
SELECT TOP 100
       S.STOK_KODU,
       S.STOK_ADI,
       S.GRUP_KODU,
       SUM(H.MIKTAR) AS BAKIYE,
       MAX(H.TARIH) AS SON_HAREKET
FROM TBLSTSABIT S
LEFT JOIN TBLSTHAR H ON H.STOK_KODU = S.STOK_KODU
WHERE H.DEPO_KODU = '101'
GROUP BY S.STOK_KODU, S.STOK_ADI, S.GRUP_KODU
ORDER BY BAKIYE DESC;`;

export interface ResultRow {
  stockCode: string;
  stockName: string;
  groupCode: string | null;
  balance: number;
  lastMovement: string | null;
}

export const mockResults: ResultRow[] = [
  { stockCode: "STK-00412", stockName: "Kablo bağı 200 mm", groupCode: "ELK-01", balance: 18450, lastMovement: "2026-11-18" },
  { stockCode: "STK-00077", stockName: "Vida M6x30 galvaniz", groupCode: "BAG-02", balance: 12200, lastMovement: "2026-11-19" },
  { stockCode: "STK-01530", stockName: "Koli bandı şeffaf", groupCode: "AMB-01", balance: 9340, lastMovement: "2026-11-17" },
  { stockCode: "STK-00981", stockName: "Eldiven nitril L", groupCode: null, balance: 7125, lastMovement: "2026-11-19" },
  { stockCode: "STK-00233", stockName: "Etiket 100x50 termal", groupCode: "AMB-03", balance: 6480, lastMovement: "2026-11-12" },
  { stockCode: "STK-00655", stockName: "Rulman 6204 2RS", groupCode: "MEK-04", balance: 4210, lastMovement: "2026-11-16" },
  { stockCode: "STK-01102", stockName: "Conta NBR 40 mm", groupCode: "MEK-02", balance: 3890, lastMovement: null },
  { stockCode: "STK-00390", stockName: "Streç film 23 mic", groupCode: "AMB-02", balance: 3305, lastMovement: "2026-11-15" },
  { stockCode: "STK-00845", stockName: "Sigorta 16A", groupCode: "ELK-03", balance: 2760, lastMovement: "2026-11-10" },
  { stockCode: "STK-01337", stockName: "Klemens 2.5 mm", groupCode: "ELK-02", balance: 1940, lastMovement: "2026-11-08" },
  { stockCode: "STK-00118", stockName: "Palet streç kapak", groupCode: "AMB-05", balance: 980, lastMovement: "2026-11-04" },
  { stockCode: "STK-01721", stockName: "Paslanmaz pul M8", groupCode: "BAG-04", balance: 640, lastMovement: "2026-10-29" },
];

export type TreeKind = "server" | "database" | "folder" | "table" | "view" | "procedure" | "function";

export interface TreeNodeData {
  id: string;
  label: string;
  kind: TreeKind;
  children?: TreeNodeData[];
}

export const objectTree: TreeNodeData[] = [
  {
    id: "server",
    label: "SQLSRV01\\NETSIS",
    kind: "server",
    children: [
      {
        id: "databases",
        label: "Veritabanları",
        kind: "folder",
        children: [
          {
            id: "cari",
            label: "CARI",
            kind: "database",
            children: [
              { id: "tables", label: "Tablolar", kind: "folder" },
              {
                id: "views",
                label: "Görünümler",
                kind: "folder",
                children: [{ id: "vw-stock", label: "VW_STOK_BAKIYE", kind: "view" }],
              },
              {
                id: "procedures",
                label: "Saklı yordamlar",
                kind: "folder",
                children: [{ id: "sp-depo", label: "SP_DEPO_HUCRE_ABC", kind: "procedure" }],
              },
              {
                id: "functions",
                label: "Fonksiyonlar",
                kind: "folder",
                children: [{ id: "fn-barcode", label: "NTS_WM_BARKOD_KONTROL", kind: "function" }],
              },
            ],
          },
          { id: "master", label: "MASTER", kind: "database" },
        ],
      },
      { id: "security", label: "Güvenlik", kind: "folder" },
      { id: "server-objects", label: "Sunucu nesneleri", kind: "folder" },
    ],
  },
];
