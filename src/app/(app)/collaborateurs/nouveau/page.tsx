import { EmployeeForm } from "../EmployeeForm";
import { createEmployee } from "../actions";

export default function NouveauCollaborateurPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-900">Ajouter un collaborateur</h1>
      <EmployeeForm action={createEmployee} submitLabel="Créer le collaborateur" />
    </div>
  );
}
