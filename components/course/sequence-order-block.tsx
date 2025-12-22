"use client"

import { useState } from "react"
import { SortableList } from "@/components/ui/sortable-list"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface SequenceOrderBlockProps {
  items: Array<{ id: string; text: string }>
  correctOrder: number[]
  onAnswerChange: (order: number[]) => void
  userAnswer?: number[]
}

export function SequenceOrderBlock({
  items,
  correctOrder,
  onAnswerChange,
  userAnswer,
}: SequenceOrderBlockProps) {
  const [currentOrder, setCurrentOrder] = useState<typeof items>(
    userAnswer
      ? userAnswer.map((idx) => items[idx]).filter(Boolean)
      : items
  )

  const handleReorder = (newItems: typeof items) => {
    setCurrentOrder(newItems)
    const newOrder = newItems.map((item) => items.findIndex((i) => i.id === item.id))
    onAnswerChange(newOrder)
  }

  return (
    <div className="space-y-4">
      <SortableList items={currentOrder} onReorder={handleReorder}>
        {(item, index) => (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                {index + 1}
              </div>
              <span>{item.text}</span>
            </div>
          </Card>
        )}
      </SortableList>
      {currentOrder.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Перетащите элементы для изменения порядка
        </p>
      )}
    </div>
  )
}

