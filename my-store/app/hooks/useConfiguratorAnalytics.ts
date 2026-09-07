"use client"

import { useEffect, useRef } from "react"
import {
  extractStepChoices,
  stepLabelForProduct,
  type ConfiguratorFormSnapshot,
} from "@/lib/configurator-analytics"
import {
  getConfiguratorClientSessionId,
  resetConfiguratorClientSessionId,
  trackConfiguratorEvent,
} from "@/lib/configurator-analytics-client"

type UseConfiguratorAnalyticsParams = {
  enabled: boolean
  productSlug: string
  currentStep: number
  contentStep: number
  formData: ConfiguratorFormSnapshot
}

export const useConfiguratorAnalytics = ({
  enabled,
  productSlug,
  currentStep,
  contentStep,
  formData,
}: UseConfiguratorAnalyticsParams) => {
  const stepEnteredAtRef = useRef<number>(Date.now())
  const previousRef = useRef<{ contentStep: number; currentStep: number } | null>(null)
  const sessionStartedRef = useRef(false)
  const formDataRef = useRef(formData)
  formDataRef.current = formData

  useEffect(() => {
    if (!enabled) return

    const clientSessionId = getConfiguratorClientSessionId()
    if (!sessionStartedRef.current) {
      trackConfiguratorEvent({
        eventType: "session_start",
        clientSessionId,
        productSlug,
      })
      sessionStartedRef.current = true
    }

    const previous = previousRef.current
    if (previous && previous.contentStep !== contentStep) {
      const durationMs = Math.max(Date.now() - stepEnteredAtRef.current, 0)
      trackConfiguratorEvent({
        eventType: "step_leave",
        clientSessionId,
        stepKey: String(previous.contentStep),
        stepLabel: stepLabelForProduct(String(previous.contentStep), productSlug),
        stepIndex: previous.currentStep,
        durationMs,
        choices: extractStepChoices(String(previous.contentStep), formDataRef.current),
      })
    }

    trackConfiguratorEvent({
      eventType: "step_enter",
      clientSessionId,
      stepKey: String(contentStep),
      stepLabel: stepLabelForProduct(String(contentStep), productSlug),
      stepIndex: currentStep,
    })

    stepEnteredAtRef.current = Date.now()
    previousRef.current = { contentStep, currentStep }
  }, [enabled, productSlug, currentStep, contentStep])

  return {
    trackCartAdd: () => {
      if (!enabled) return
      trackConfiguratorEvent({
        eventType: "cart_add",
        clientSessionId: getConfiguratorClientSessionId(),
      })
    },
    trackOrderPlaced: () => {
      if (!enabled) return
      trackConfiguratorEvent({
        eventType: "order_placed",
        clientSessionId: getConfiguratorClientSessionId(),
      })
      resetConfiguratorClientSessionId()
      sessionStartedRef.current = false
      previousRef.current = null
    },
  }
}
