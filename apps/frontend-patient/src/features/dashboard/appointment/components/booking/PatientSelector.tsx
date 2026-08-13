"use client";

import { useState } from "react";
import type {
  CreatePatientProfilePayload,
  PatientProfile,
} from "../../api";

type PatientSelectorProps = {
  patients: PatientProfile[];
  selectedPatientId: string;
  isLoading?: boolean;
  isCreating?: boolean;
  onSelectPatient: (patientId: string) => void;
  onCreatePatient: (payload: CreatePatientProfilePayload) => Promise<void>;
};

const relationshipLabels: Record<string, string> = {
  SELF: "Toi",
  CHILD: "Con",
  FATHER: "Bo",
  MOTHER: "Me",
  OTHER: "Nguoi than",
};

export function PatientSelector({
  patients,
  selectedPatientId,
  isLoading,
  isCreating,
  onSelectPatient,
  onCreatePatient,
}: PatientSelectorProps) {
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("UNKNOWN");
  const [relationship, setRelationship] = useState("CHILD");

  async function handleSubmit() {
    const name = fullName.trim();
    if (!name) return;

    await onCreatePatient({
      fullName: name,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      relationship,
    });

    setFullName("");
    setPhone("");
    setDateOfBirth("");
    setGender("UNKNOWN");
    setRelationship("CHILD");
    setShowForm(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Chon nguoi kham</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Lich hen se duoc gan voi ho so nguoi di kham.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="h-9 rounded-xl border border-blue-100 bg-blue-50 px-3 text-xs font-bold text-[#0863c5] transition hover:bg-blue-100"
        >
          + Them
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {patients.map((patient) => {
          const selected = patient.id === selectedPatientId;
          return (
            <button
              key={patient.id}
              type="button"
              disabled={!patient.canBook}
              onClick={() => onSelectPatient(patient.id)}
              className={`rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-[#0863c5] bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {patient.fullName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {relationshipLabels[patient.relationship] ?? "Nguoi than"}
                  </p>
                </div>
                <span
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${
                    selected
                      ? "border-[#0863c5] bg-[#0863c5]"
                      : "border-slate-300 bg-white"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="mt-3 text-xs text-slate-500">Dang tai ho so...</p>
      ) : null}

      {showForm ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Ho ten nguoi kham"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="So dien thoai neu co"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
          />
          <input
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
          />
          <select
            value={relationship}
            onChange={(event) => setRelationship(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
          >
            <option value="CHILD">Con</option>
            <option value="FATHER">Bo</option>
            <option value="MOTHER">Me</option>
            <option value="OTHER">Nguoi than</option>
          </select>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
          >
            <option value="UNKNOWN">Chua ro gioi tinh</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nu</option>
            <option value="OTHER">Khac</option>
          </select>
          <button
            type="button"
            disabled={!fullName.trim() || isCreating}
            onClick={handleSubmit}
            className="h-10 rounded-xl bg-[#0863c5] px-4 text-sm font-bold text-white transition hover:bg-[#0753a8] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? "Dang them..." : "Luu ho so"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
