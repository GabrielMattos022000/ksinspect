import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Download, ArrowLeft } from "lucide-react";
import { getPublicUrl } from "@/components/CharacteristicImageUpload";

interface MeasurementRow {
  id: string;
  characteristic_id: string;
  measured_value: number | null;
  deviation: number | null;
  within_limits: boolean | null;
  char_name: string;
  char_unit: string;
  char_nominal: number;
  char_limit_min: number;
  char_limit_max: number;
  char_sort_order: number;
  char_is_critical: boolean;
  char_device_image_path: string | null;
  char_drawing_image_path: string | null;
  char_type: "variable" | "attribute";
}

interface CycleInfo {
  id: string;
  line_name: string;
  product_formatted_name: string;
  product_pb: string;
  product_ks: string;
  cav: string;
  week_cast: string;
  operator_badge: string;
  status: string;
  overall_result: string | null;
  finished_at: string | null;
}

function generateTxt(cycle: CycleInfo, rows: MeasurementRow[]): { filename: string; content: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const lineName = cycle.line_name.replace(/\s+/g, "");
  const overallResult = rows.some((r) => !r.within_limits) ? "REPROVADO" : "APROVADO";

  const filename = `${lineName}_${cycle.product_pb}_${cycle.product_ks}_CAV${cycle.cav}_${cycle.week_cast}_OP${cycle.operator_badge}_${dateStr}_${timeStr}.txt`;

  const header = [
    `Máquina: ${cycle.line_name} (aberto)`,
    `Produto: PB: ${cycle.product_pb} KS: ${cycle.product_ks}`,
    `Semana de Produção Fundida: ${cycle.week_cast}`,
    `Operador: ${cycle.operator_badge}`,
    `DataHora: ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    `Resultado: ${overallResult}`,
    `Cavidade: ${cycle.cav}`,
    "",
    "Características:",
  ].join("\n");

  const charLines = rows
    .sort((a, b) => a.char_sort_order - b.char_sort_order)
    .map((r) => {
      const status = r.within_limits ? "APROVADO" : "REPROVADO";
      return `${r.char_name};${r.char_unit};${r.char_nominal};${r.char_limit_max};${r.char_limit_min};${r.measured_value};${status}`;
    })
    .join("\n");

  return { filename, content: header + "\n" + charLines };
}

function downloadTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CyclePage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState<CycleInfo | null>(null);
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [finishing, setFinishing] = useState(false);

  const fetchData = useCallback(async () => {
    // Fetch cycle with joins
    const { data: cycleData } = await supabase
      .from("measurement_cycles")
      .select("*, lines(name), machines(name), products(formatted_name, pb, ks, cav, maq)")
      .eq("id", cycleId!)
      .maybeSingle();

    if (!cycleData) { setLoading(false); return; }

    const info: CycleInfo = {
      id: cycleData.id,
      line_name: (cycleData as any).lines?.name ?? "",
      product_formatted_name: (cycleData as any).products?.formatted_name ?? "",
      product_pb: (cycleData as any).products?.pb ?? "",
      product_ks: (cycleData as any).products?.ks ?? "",
      cav: (cycleData as any).cav ?? "",
      week_cast: cycleData.week_cast,
      operator_badge: cycleData.operator_badge,
      status: cycleData.status,
      overall_result: cycleData.overall_result,
      finished_at: cycleData.finished_at,
    };
    setCycle(info);

    // Fetch measurements with characteristics
    const { data: mData } = await supabase
      .from("measurements")
      .select("*, characteristics(name, unit, nominal, limit_min, limit_max, sort_order, is_critical, device_image_path, drawing_image_path, characteristic_type)")
      .eq("cycle_id", cycleId!)
      .order("id");

    const mapped: MeasurementRow[] = (mData ?? []).map((m: any) => ({
      id: m.id,
      characteristic_id: m.characteristic_id,
      measured_value: m.measured_value,
      deviation: m.deviation,
      within_limits: m.within_limits,
      char_name: m.characteristics?.name ?? "",
      char_unit: m.characteristics?.unit ?? "",
      char_nominal: m.characteristics?.nominal ?? 0,
      char_limit_min: m.characteristics?.limit_min ?? 0,
      char_limit_max: m.characteristics?.limit_max ?? 0,
      char_sort_order: m.characteristics?.sort_order ?? 0,
      char_is_critical: m.characteristics?.is_critical ?? false,
      char_device_image_path: m.characteristics?.device_image_path ?? null,
      char_drawing_image_path: m.characteristics?.drawing_image_path ?? null,
      char_type: m.characteristics?.characteristic_type ?? "variable",
    }));

    mapped.sort((a, b) => a.char_sort_order - b.char_sort_order);
    setRows(mapped);

    // Initialize input values
    const vals: Record<string, string> = {};
    mapped.forEach((r) => {
      vals[r.id] = r.measured_value != null ? String(r.measured_value) : "";
    });
    setInputValues(vals);
    setLoading(false);
  }, [cycleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleValueChange = async (row: MeasurementRow, val: string) => {
    setInputValues((prev) => ({ ...prev, [row.id]: val }));

    const numVal = parseFloat(val);
    if (isNaN(numVal)) return;

    const deviation = row.char_type === "attribute" ? 0 : parseFloat((numVal - row.char_nominal).toFixed(6));
    const withinLimits = row.char_type === "attribute"
      ? numVal === 1
      : numVal >= row.char_limit_min && numVal <= row.char_limit_max;

    await supabase.from("measurements").update({
      measured_value: numVal,
      deviation,
      within_limits: withinLimits,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);

    // Update local state
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, measured_value: numVal, deviation, within_limits: withinLimits }
          : r
      )
    );
  };

  const handleAttributeChange = async (row: MeasurementRow, approved: boolean) => {
    const numVal = approved ? 1 : 0;
    setInputValues((prev) => ({ ...prev, [row.id]: String(numVal) }));

    await supabase.from("measurements").update({
      measured_value: numVal,
      deviation: 0,
      within_limits: approved,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);

    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, measured_value: numVal, deviation: 0, within_limits: approved }
          : r
      )
    );
  };

  const filledCount = rows.filter((r) => r.measured_value != null).length;
  const nokCount = rows.filter((r) => r.within_limits === false).length;
  const allFilled = filledCount === rows.length && rows.length > 0;
  const overallOk = nokCount === 0 && allFilled;
  const isFinished = cycle?.status === "FINISHED";

  const handleFinish = async () => {
    if (!allFilled || !cycle) return;
    setFinishing(true);
    const result = overallOk ? "OK" : "NOK";

    const { filename, content } = generateTxt(cycle, rows);
    downloadTxt(filename, content);

    await supabase.from("measurement_cycles").update({
      status: "FINISHED",
      finished_at: new Date().toISOString(),
      overall_result: result,
      txt_path: filename,
    }).eq("id", cycle.id);

    toast.success("Ciclo finalizado! TXT baixado.");
    setCycle((prev) => prev ? { ...prev, status: "FINISHED", overall_result: result } : prev);
    setFinishing(false);
  };

  if (loading) return <div className="p-4 text-muted-foreground">Carregando...</div>;
  if (!cycle) return <div className="p-4 text-destructive">Ciclo não encontrado.</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate("/cycle/new")} className="gap-1">
        <ArrowLeft className="h-4 w-4" />
        Novo Ciclo de Medição
      </Button>
      {/* Summary */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold">{cycle.line_name}</p>
              <p className="text-sm text-muted-foreground">{cycle.product_formatted_name}</p>
              <p className="text-sm text-muted-foreground">Semana: {cycle.week_cast} | OP: {cycle.operator_badge}</p>
            </div>
            <div className="flex items-center gap-2 text-base">
              <span className="font-medium">{filledCount}/{rows.length}</span>
              {allFilled && (
                <Badge className={`text-sm ${overallOk ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
                  {overallOk ? "APROVADO" : "REPROVADO"}
                </Badge>
              )}
              {isFinished && (
                <Badge variant="secondary" className="text-sm">Finalizado</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Measurement rows */}
      <div className="space-y-3">
        {rows.map((row) => {
          const val = inputValues[row.id] ?? "";
          const hasValue = row.measured_value != null;
          const isOk = row.within_limits === true;
          const isNok = row.within_limits === false;

          return (
            <Card
              key={row.id}
              className={
                isNok ? "border-destructive/50 bg-destructive/5" :
                isOk ? "border-success/50 bg-success/5" : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold">
                      {row.char_name}
                      {row.char_is_critical && <span className="ml-2 text-xs font-bold text-destructive uppercase">Crítica</span>}
                      <span className="ml-2 text-xs font-medium text-muted-foreground uppercase">
                        {row.char_type === "attribute" ? "Atributo" : "Variável"}
                      </span>
                    </p>
                    {row.char_type === "variable" && (
                      <p className="text-sm text-muted-foreground">
                        {row.char_unit} | Nom: {row.char_nominal} | [{row.char_limit_min} – {row.char_limit_max}]
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {row.char_type === "variable" ? (
                      <>
                        <Input
                          type="number"
                          step="any"
                          className="w-32 h-10 text-base"
                          value={val}
                          onChange={(e) => setInputValues((prev) => ({ ...prev, [row.id]: e.target.value }))}
                          onBlur={(e) => handleValueChange(row, e.target.value)}
                          disabled={isFinished}
                          placeholder="Valor"
                        />
                        {hasValue && (
                          <>
                            <span className="text-sm w-20 text-right tabular-nums font-medium">
                              Δ {row.deviation?.toFixed(3)}
                            </span>
                            {isOk ? (
                              <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
                            ) : (
                              <XCircle className="h-6 w-6 text-destructive shrink-0" />
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant={row.within_limits === true ? "default" : "outline"}
                          size="sm"
                          className={row.within_limits === true ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
                          onClick={() => handleAttributeChange(row, true)}
                          disabled={isFinished}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprovado
                        </Button>
                        <Button
                          variant={row.within_limits === false ? "default" : "outline"}
                          size="sm"
                          className={row.within_limits === false ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}
                          onClick={() => handleAttributeChange(row, false)}
                          disabled={isFinished}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reprovado
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {(row.char_device_image_path || row.char_drawing_image_path) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {row.char_device_image_path && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1.5">Dispositivo</p>
                        <img
                          src={getPublicUrl(row.char_device_image_path)!}
                          alt="Dispositivo de medição"
                          className="w-full object-contain rounded-md border bg-muted p-1"
                          style={{ minHeight: 355, minWidth: 364 }}
                        />
                      </div>
                    )}
                    {row.char_drawing_image_path && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1.5">Desenho Técnico</p>
                        <img
                          src={getPublicUrl(row.char_drawing_image_path)!}
                          alt="Dimensão no desenho"
                          className="w-full object-contain rounded-md border bg-muted p-1"
                          style={{ minHeight: 355, minWidth: 364 }}
                        />
                      </div>
                    )}
                   </div>
                 )}
               </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      {!isFinished && (
        <Button
          onClick={handleFinish}
          disabled={!allFilled || finishing}
          className="w-full"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          {finishing ? "Finalizando..." : "Finalizar Ciclo e Baixar TXT"}
        </Button>
      )}

      {isFinished && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => {
            const { filename, content } = generateTxt(cycle, rows);
            downloadTxt(filename, content);
          }}>
            <Download className="mr-2 h-4 w-4" />
            Baixar TXT novamente
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => navigate("/cycle/new")}>
            Novo Ciclo
          </Button>
        </div>
      )}
    </div>
  );
}
