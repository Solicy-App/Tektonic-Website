import { downstreamCoeffValue } from "helpers";
import {
  TableDefaultValues,
  TableStateValues,
  MicroOrganism,
  ReportTypes,
  ReportDataType,
} from "helpers/types";

export const microOrganisms: Array<MicroOrganism> = [
  {
    name: "ANTHRAX",
    sum: 0.031,
  },
  {
    name: "ACINETOBACTER BAUMANII",
    sum: 0.128,
  },
  {
    name: "ASPERGILLUS NIGER",
    sum: 0.00051,
  },
  {
    name: "BACILLUS CEREUS SPORES",
    sum: 0.00564,
  },
  {
    name: "BOTRYTIS CINEREA",
    sum: 0.0092,
  },
  {
    name: "C.DIFF",
    sum: 0.003846,
  },
  {
    name: "CLADOSPORIUM",
    sum: 0.00384,
  },
  {
    name: "CLADOSPORIUM WEMECKI",
    sum: 0.00051,
  },
  {
    name: "LEGIONELLA PNEUMOPHILA",
    sum: 0.0911,
  },
  {
    name: "LISTERIA MONOCYTOGENES",
    sum: 0.0127,
  },
  {
    name: "MRSA",
    sum: 0.22222,
  },
  {
    name: "MUCOR SPORES",
    sum: 0.031,
  },
  {
    name: "PENICILLIUM SPORES",
    sum: 0.00103,
  },
  {
    name: "PSEUDOMONAS AERUGINOSA",
    sum: 0.1047,
  },
  {
    name: "STACHYBOTRYS CHARTARUM",
    sum: 0.00041,
  },
  {
    name: "TUBERCULOSIS",
    sum: 0.031,
  },
  {
    name: "VRE",
    sum: 0.03598,
  },
];

export const tableDefaultValues: TableDefaultValues = {
  widthX: 1600,
  heightY: 1600,
  downstreamCoeff: downstreamCoeffValue.valueMin,
  maxDistToCoil: 1000,
  requiredInactivationRate: 99,
  maxInactivationTime: 60,
  susceptibilityCoefficient: microOrganisms[0].sum,
  minimumUVIrrIntensity: 500,
  reflectionCoeff: 0.5,
  minDistWallX: 30,
  minDistWallY: 100,
  microorganismOption: microOrganisms[0].name,
  optType: "Microorganism",
  optimizeOption: [],
};

export const BiowallDefaultValues: TableStateValues = {
  widthX: 500,
  heightY: 500,
  lengthZ: 500,
  reflectionCoeff: 0.5,
  airFlow: 100,
  susceptibilityCoefficient: [microOrganisms[0].sum],
  inactPasses: 1,
  inactRate: 2,
  microorganismOption: [microOrganisms[0].name],
  optimizeOption: [],
  layersData: [],
  reportName: "",
  isOptimized: false,
};

export const defaultReportData: ReportDataType = {
  reportType: ReportTypes.COILCLEAN,
  projectName: "",
  airHandlingUnit: "",
  customerName: "",
  place: "",
  department: "",
};
