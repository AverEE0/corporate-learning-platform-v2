"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, TrendingUp } from "lucide-react"

interface XPDisplayProps {
  total_xp: number
  level: number
  xp_to_next_level: number
  current_level_xp: number
}

export function XPDisplay({ total_xp, level, xp_to_next_level, current_level_xp }: XPDisplayProps) {
  const progressPercentage = (current_level_xp / xp_to_next_level) * 100

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Уровень {level}
            </CardTitle>
            <CardDescription>Опыт: {total_xp.toLocaleString('ru-RU')} XP</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{level}</div>
            <div className="text-xs text-muted-foreground">Уровень</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Прогресс до следующего уровня</span>
          <span className="font-medium">{current_level_xp} / {xp_to_next_level} XP</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>Всего XP: {total_xp.toLocaleString('ru-RU')}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>До уровня {level + 1}: {xp_to_next_level - current_level_xp} XP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

