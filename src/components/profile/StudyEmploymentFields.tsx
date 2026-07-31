"use client";

import { GraduationCap, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface StudyEmploymentValue {
  isStudent: boolean | null;
  studentClass: string;
  studentCourse: string;
  studentInstitution: string;
  isMuthaallim: boolean | null;
  muthaallimInstitution: string;
  occupation: string;
  workLocation: "" | "india" | "abroad";
}

interface StudyEmploymentFieldsProps {
  value: StudyEmploymentValue;
  onChange: <K extends keyof StudyEmploymentValue>(field: K, value: StudyEmploymentValue[K]) => void;
  errors?: Record<string, string>;
}

const INPUT_CLASS = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-blue-500/20";

export function StudyEmploymentFields({ value, onChange, errors = {} }: StudyEmploymentFieldsProps) {
  return (
    <section className="col-span-1 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:col-span-2 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center gap-2">
        <GraduationCap className="size-5 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Study & Employment</h3>
      </div>

      <BooleanQuestion
        label="Are you a student?"
        value={value.isStudent}
        onChange={(answer) => onChange("isStudent", answer)}
        error={errors.isStudent}
      />

      {value.isStudent && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 dark:border-slate-700 dark:bg-slate-800">
          <TextField label="Class" value={value.studentClass} onChange={(next) => onChange("studentClass", next)} error={errors.studentClass} required />
          <TextField label="Course" value={value.studentCourse} onChange={(next) => onChange("studentCourse", next)} error={errors.studentCourse} required />
          <div className="md:col-span-2">
            <TextField label="Institution" value={value.studentInstitution} onChange={(next) => onChange("studentInstitution", next)} error={errors.studentInstitution} required />
          </div>
        </div>
      )}

      <BooleanQuestion
        label="Are you Mutha'allim?"
        value={value.isMuthaallim}
        onChange={(answer) => onChange("isMuthaallim", answer)}
        error={errors.isMuthaallim}
      />

      {value.isMuthaallim && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <TextField label="Institution" value={value.muthaallimInstitution} onChange={(next) => onChange("muthaallimInstitution", next)} error={errors.muthaallimInstitution} required />
        </div>
      )}

      {value.isStudent === false && value.isMuthaallim === false && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField label="Occupation" value={value.occupation} onChange={(next) => onChange("occupation", next)} error={errors.occupation} required />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Work Location <span className="text-red-500">*</span></span>
            <Select value={value.workLocation} onValueChange={(next) => onChange("workLocation", next as StudyEmploymentValue["workLocation"])}>
              <SelectTrigger className={errors.workLocation ? "h-11 w-full rounded-xl border-red-300 bg-white dark:border-red-500/60 dark:bg-slate-900" : "h-11 w-full rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}>
                <SelectValue placeholder="Select India or Abroad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="abroad">Abroad</SelectItem>
              </SelectContent>
            </Select>
            {errors.workLocation && <p className="text-xs text-red-500">{errors.workLocation}</p>}
          </label>
        </div>
      )}

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Occupation and work location are required only when both answers are No.
      </p>
    </section>
  );
}

function BooleanQuestion({ label, value, onChange, error }: { label: string; value: boolean | null; onChange: (value: boolean) => void; error?: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label} <span className="text-red-500">*</span></legend>
      <div className="flex items-center gap-6">
        {[true, false].map((answer) => (
          <label key={String(answer)} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="radio" checked={value === answer} onChange={() => onChange(answer)} className="size-4 accent-blue-600" />
            {answer ? "Yes" : "No"}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </fieldset>
  );
}

function TextField({ label, value, onChange, error, required }: { label: string; value: string; onChange: (value: string) => void; error?: string; required?: boolean }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}{required && <span className="text-red-500"> *</span>}</span>
      <input type="text" maxLength={160} value={value} onChange={(event) => onChange(event.target.value)} className={error ? `${INPUT_CLASS} border-red-300 dark:border-red-500/60` : INPUT_CLASS} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </label>
  );
}