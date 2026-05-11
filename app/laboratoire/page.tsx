import { HubFrame } from "@/components/hub/HubFrame";
import { CompileLab } from "@/components/shared/CompileLab";

const STARTER_JAVA = `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        // Le Laboratoire — bac à sable libre.
        // Compile et exécute Java 21. Timeout : 10 s.

        List<String> couches = new ArrayList<>();
        couches.add("Objet");
        couches.add("Inférentielle");
        couches.add("Signal");

        Map<String, Integer> agentsParCouche = new HashMap<>();
        for (String c : couches) {
            agentsParCouche.put(c, c.length());
        }

        for (Map.Entry<String, Integer> e : agentsParCouche.entrySet()) {
            System.out.println(e.getKey() + " -> " + e.getValue());
        }
    }
}
`;

export default function LaboratoirePage() {
  return (
    <HubFrame
      title="LE LABORATOIRE"
      subtitle="// accès libre — pas de dossier attaché"
    >
      <p
        className="text-[0.92rem] leading-relaxed mb-6 max-w-prose"
        style={{ color: "var(--ink-dim)" }}
      >
        Bac à sable de compilation. Sortez vos hypothèses du brouillon, exécutez,
        observez. L&apos;Interpréteur ne consigne rien d&apos;ici. Faites comme
        si l&apos;on ne regardait pas — parce qu&apos;effectivement, on ne
        regarde pas.
      </p>
      <CompileLab initialCode={STARTER_JAVA} language="java" />
    </HubFrame>
  );
}
