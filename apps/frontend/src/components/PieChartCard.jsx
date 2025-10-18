import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Card from "../components/Card";

export default function PieChartCard({ data }){
  const colors = ["#2563EB", "#F59E0B", "#EF4444"]; // confirmadas/pendientes/canceladas
  return (
    <Card title="Estado general">
      <div className="h-60">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
              {data.map((_,i)=>(<Cell key={i} fill={colors[i % colors.length]} />))}
            </Pie>
            <Tooltip/><Legend/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
