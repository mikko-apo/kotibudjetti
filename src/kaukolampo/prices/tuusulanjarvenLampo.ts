import type { ContractPricing } from "../kaukolampoTypes";

export const tuusulanjarvenLampo: ContractPricing = {
  id: "tula-pepi",
  companyName: "Tuusulanjärven Lämpö",
  contractTypeName: "Peruslämpö Pientalo",
  monthlyPricing: [
    {
      year: 2022,
      month: 1,
      price: {
        monthlyFee: 35.3,
        powerPricePerMW: 68.57,
      },
    },
    {
      year: 2023,
      month: 6,
      price: {
        monthlyFee: 40.25,
        powerPricePerMW: 78.17,
      },
    },
    {
      year: 2024,
      month: 1,
      price: {
        monthlyFee: 45.88,
        powerPricePerMW: 89.12,
      },
    },
    {
      year: 2024,
      month: 9,
      price: {
        monthlyFee: 46.44,
        powerPricePerMW: 90.2,
      },
    },
    {
      year: 2025,
      month: 1,
      price: {
        monthlyFee: 59.55,
        powerPricePerMW: 90.2,
      },
    },
    {
      year: 2025,
      month: 7,
      price: {
        monthlyFee: 59.55,
        powerPricePerMW: 86.04,
      },
    },
  ],
};
