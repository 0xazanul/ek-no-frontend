import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

// Define the expected shape of a finding
interface Finding {
  severity: string;
  [key: string]: any;
}

interface VisualSummaryDashboardProps {
  findings: Finding[];
}

const COLORS = ["#FF6384", "#FFCE56", "#36A2EB", "#4BC0C0", "#9966FF", "#FF9F40"];

// Utility to group findings by severity
function groupBySeverity(findings: Finding[]) {
  const counts: Record<string, number> = {};
  findings.forEach(f => {
    const sev = f.severity || "Unknown";
    counts[sev] = (counts[sev] || 0) + 1;
  });
  return Object.entries(counts).map(([severity, value]) => ({ name: severity, value }));
}

const VisualSummaryDashboard: React.FC<VisualSummaryDashboardProps> = ({ findings }) => {
  const data = groupBySeverity(findings);

  if (data.length === 0) {
    return <div className="p-4 text-center text-gray-500">No findings to summarize.</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto my-6">
      <h2 className="text-lg font-semibold mb-4 text-center">Findings by Severity</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            fill="#8884d8"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VisualSummaryDashboard;
