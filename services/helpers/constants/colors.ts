import { AuxiliaryColorsTypes, EfficiencyDescriptionTypes } from "helpers/types";

export const colors: EfficiencyDescriptionTypes[] = [
  { background: "#F1E8FF", description: "Cheapest" },
  { background: "#DDF4FF", description: "Cheapest and Energy efficient" },
  { background: "#e1f4eb", description: "Energy efficient" },
];

export const auxiliaryColors: AuxiliaryColorsTypes = {
  cheapAndEfficient: "cheapAndEfficient",
  energyEfficient: "energyEfficient",
  cheapest: "cheapest",
};
