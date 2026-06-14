import type { PointEvent } from "@/lib/types";

export default function PointsHistory({ events }: { events: PointEvent[] }) {
  return (
    <section className="space-y-3">
      <h2 className="fc-label text-muted">Points History</h2>
      <div className="border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="fc-label px-4 py-3 text-left text-muted">Date</th>
              <th className="fc-label px-4 py-3 text-left text-muted">Description</th>
              <th className="fc-label px-4 py-3 text-right text-muted">Points</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const earned = e.points >= 0;
              return (
                <tr key={e.id} className="border-b border-border last:border-b-0">
                  <td className="fc-body px-4 py-3 text-muted">
                    {new Date(e.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="fc-body px-4 py-3 text-text">{e.description}</td>
                  <td className={`fc-body px-4 py-3 text-right ${earned ? "text-gold" : "text-muted"}`}>
                    {earned ? "+" : ""}
                    {e.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
