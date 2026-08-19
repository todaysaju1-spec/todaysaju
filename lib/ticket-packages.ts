export type TicketPackage = {
  id: string;
  category: "standard" | "premium";
  price: number;
  tickets: number;
  label: string;
  discount?: string;
};

export const STANDARD_PACKAGES: TicketPackage[] = [
  { id: "std-1", category: "standard", price: 3900, tickets: 1, label: "1회권" },
  { id: "std-5", category: "standard", price: 17000, tickets: 5, label: "5회권", discount: "12% 할인" },
  { id: "std-10", category: "standard", price: 29000, tickets: 10, label: "10회권", discount: "25% 할인" },
];

export const PREMIUM_PACKAGES: TicketPackage[] = [
  { id: "prm-1", category: "premium", price: 19000, tickets: 1, label: "1회권" },
  { id: "prm-5", category: "premium", price: 85000, tickets: 5, label: "5회권", discount: "10% 할인" },
];

export const ALL_TICKET_PACKAGES: TicketPackage[] = [...STANDARD_PACKAGES, ...PREMIUM_PACKAGES];

export function getTicketPackageById(id: string): TicketPackage | undefined {
  return ALL_TICKET_PACKAGES.find((pkg) => pkg.id === id);
}
