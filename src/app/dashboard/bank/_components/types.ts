// Question types as the bank shows them. Colors follow the design system: each type owns one.
export type BankQuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "IDENTIFICATION" | "ESSAY";

export const TYPE_META: Record<BankQuestionType, { label: string; short: string; fill: string; btn: string }> = {
    MULTIPLE_CHOICE: { label: "Multiple choice", short: "MC", fill: "bg-px-cyan", btn: "px-btn-cyan" },
    TRUE_FALSE: { label: "True or false", short: "T/F", fill: "bg-px-pink", btn: "px-btn-pink" },
    IDENTIFICATION: { label: "Identification", short: "ID", fill: "bg-px-yellow", btn: "px-btn-yellow" },
    ESSAY: { label: "Essay", short: "Essay", fill: "bg-px-lime", btn: "px-btn-lime" },
};

export const BANK_TYPES = Object.keys(TYPE_META) as BankQuestionType[];

export const isBankType = (t: string | undefined): t is BankQuestionType => !!t && t in TYPE_META;
