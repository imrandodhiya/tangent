"use client"

import Link from "next/link"
import { Target, Settings } from "lucide-react"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Operator = {
  id: string
  // add any other fields you pass in
}

type Props = {
  operator: Operator
}

export default function OperatorPage({ operator }: Props) {
  if (!operator) {
    return null
  }

  return (
    <div>
      {/* Lane assignments tab and link to lane management */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lanes">Lane Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Existing code for overview tab */}
        </TabsContent>

        <TabsContent value="lanes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lane Assignments</CardTitle>
              <CardDescription>Manage lane assignments for scoring operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Lane Assignments</h3>
                <p className="text-gray-600 mb-4">
                  Assign this operator to specific lanes for scoring entry
                </p>
                <Link href={`/operators/${operator.id}/lanes`}>
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Lanes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Existing code for other sections */}
    </div>
  )
}
