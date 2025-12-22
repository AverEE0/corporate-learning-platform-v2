"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Trophy } from "lucide-react"

interface Achievement {
  id: number
  code: string
  name: string
  description: string
  icon: string
  type: string
  points: number
  earned_at?: string
}

interface AchievementsBadgeProps {
  achievements: Achievement[]
  className?: string
}

export function AchievementsBadge({ achievements, className }: AchievementsBadgeProps) {
  if (!achievements || achievements.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-2 ${className || ''}`}>
        {achievements.slice(0, 5).map((achievement) => (
          <Tooltip key={achievement.id}>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-lg cursor-help hover:scale-110 transition-transform"
                title={achievement.name}
              >
                {achievement.icon} {achievement.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">{achievement.name}</p>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                {achievement.earned_at && (
                  <p className="text-xs text-muted-foreground">
                    Получено: {new Date(achievement.earned_at).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        {achievements.length > 5 && (
          <Badge variant="outline" className="text-sm">
            +{achievements.length - 5} еще
          </Badge>
        )}
      </div>
    </TooltipProvider>
  )
}

