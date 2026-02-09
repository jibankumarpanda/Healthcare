"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const staffData = [
  { id: 1, name: "Dr. Sarah Johnson", role: "Senior Doctor", schedule: "Mon-Wed", status: "On Duty" },
  { id: 2, name: "Nurse Emily Davis", role: "Registered Nurse", schedule: "Tue-Thu", status: "On Duty" },
  { id: 3, name: "Dr. Michael Chen", role: "Specialist", schedule: "Wed-Fri", status: "On Leave" },
  { id: 4, name: "Nurse James Wilson", role: "Nurse Assistant", schedule: "Mon-Fri", status: "On Duty" },
  { id: 5, name: "Dr. Lisa Anderson", role: "Consultant", schedule: "Thu-Sat", status: "On Duty" },
]

const suppliesData = [
  { id: 1, name: "Surgical Masks", level: 95, threshold: 50, unit: "boxes" },
  { id: 2, name: "Oxygen Cylinders", level: 78, threshold: 30, unit: "units" },
  { id: 3, name: "Antibiotics", level: 45, threshold: 40, unit: "bottles" },
  { id: 4, name: "PPE Kits", level: 88, threshold: 60, unit: "sets" },
  { id: 5, name: "Bandages", level: 62, threshold: 50, unit: "rolls" },
]

export default function Resources() {
  const [staffList, setStaffList] = useState(staffData)
  const [suppliesList, setSuppliesList] = useState(suppliesData)
  const [editingStaff, setEditingStaff] = useState<number | null>(null)

  const handleDownloadCSV = (data: any[], filename: string) => {
    const csv = [Object.keys(data[0]).join(","), ...data.map((row) => Object.values(row).join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Resource Management</h1>
          <p className="text-muted-foreground">Manage staff schedules and inventory levels</p>
        </div>

        {/* Staff Planner */}
        <Card className="border-border mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Staff Planner</CardTitle>
              <CardDescription>Manage doctor and nurse schedules</CardDescription>
            </div>
            <button
              onClick={() => handleDownloadCSV(staffList, "staff-schedule.csv")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Download CSV
            </button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Schedule</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground">{staff.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{staff.role}</td>
                      <td className="py-3 px-4 text-muted-foreground">{staff.schedule}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            staff.status === "On Duty"
                              ? "bg-green-500/20 text-green-600"
                              : "bg-yellow-500/20 text-yellow-600"
                          }`}
                        >
                          {staff.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setEditingStaff(editingStaff === staff.id ? null : staff.id)}
                          className="text-primary hover:underline text-sm font-medium"
                        >
                          {editingStaff === staff.id ? "Done" : "Edit"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Supplies Dashboard */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Supplies Dashboard</CardTitle>
              <CardDescription>Inventory status and auto-reorder alerts</CardDescription>
            </div>
            <button
              onClick={() => handleDownloadCSV(suppliesList, "supplies-inventory.csv")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Download CSV
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {suppliesList.map((supply) => {
                const percentage = (supply.level / 100) * 100
                const needsReorder = supply.level <= supply.threshold

                return (
                  <div key={supply.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{supply.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {supply.level} {supply.unit} (Threshold: {supply.threshold})
                        </p>
                      </div>
                      {needsReorder && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                          Reorder Alert
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          needsReorder ? "bg-destructive" : percentage > 75 ? "bg-green-500" : "bg-yellow-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
