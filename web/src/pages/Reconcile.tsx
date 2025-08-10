import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Reconcile(){
  const { mutate, data, isPending } = useMutation({
    mutationFn: () => api.post(`/api/tenants/${import.meta.env.VITE_TENANT_ID}/reconcile`).then(r=>r.data)
  })

  return (
    <div>
      <button onClick={()=>mutate()} disabled={isPending}>
        {isPending ? "Reconciling..." : "Run Reconciliation"}
      </button>
      {data && <pre style={{marginTop:16}}>{JSON.stringify(data,null,2)}</pre>}
    </div>
  )
}