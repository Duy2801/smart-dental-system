"use client";

import { useState } from "react";
import { DashboardIcon } from "../../common/DashboardIcon";
import { PatientProfileEditorModal } from "./PatientProfileEditorModal";
import type { PatientProfileUser } from "../types";

type PatientProfileEditorProps = {
  profile?: PatientProfileUser | null;
  onSaved?: (profile: PatientProfileUser) => void;
};

export function PatientProfileEditor({
  profile,
  onSaved,
}: PatientProfileEditorProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0863c5]"
      >
        <DashboardIcon name="document" className="h-4 w-4" />
        Chinh sua ho so
      </button>

      <PatientProfileEditorModal
        open={open}
        profile={profile}
        onClose={() => setOpen(false)}
        onSaved={onSaved}
      />
    </>
  );
}
