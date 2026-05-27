export type Bank = {
  code: string;
  name: string;
};

export const BANKS: Bank[] = [
  { code: "khan", name: "Хаан банк" },
  { code: "golomt", name: "Голомт банк" },
  { code: "tdb", name: "Худалдаа хөгжлийн банк" },
  { code: "khas", name: "Хас банк" },
  { code: "state", name: "Төрийн банк" },
  { code: "capitron", name: "Капитрон банк" },
  { code: "bogd", name: "Богд банк" },
  { code: "arig", name: "Ариг банк" },
  { code: "mbank", name: "М банк" },
  { code: "nibank", name: "Үндэсний хөрөнгө оруулалтын банк" },
  { code: "chinggis", name: "Чингис Хаан банк" },
  { code: "transbank", name: "Транс банк" },
];

export function findBankName(code: string | undefined | null): string {
  if (!code) return "";
  const b = BANKS.find((x) => x.code === code);
  return b?.name || code;
}
