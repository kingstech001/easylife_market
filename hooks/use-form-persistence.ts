"use client"

import { useEffect, useCallback } from "react"
import type { UseFormReturn, FieldValues } from "react-hook-form"

interface UseFormPersistenceOptions<T extends FieldValues> {
  form: UseFormReturn<T>
  storageKey: string
  excludeFields?: (keyof T)[]
  debounceMs?: number
}

export function useFormPersistence<T extends FieldValues>({
  form,
  storageKey,
  excludeFields = [],
  debounceMs = 500,
}: UseFormPersistenceOptions<T>) {
  const { watch, reset, getValues } = form

  // Save form data to localStorage
  const saveToStorage = useCallback(
    (data: T) => {
      try {
        // Filter out excluded fields and empty/default values
        const filteredData = Object.entries(data).reduce(
          (acc, [key, value]) => {
            if (excludeFields.includes(key as keyof T)) return acc

            // Skip empty strings, null, undefined, empty arrays, and zero values for numbers
            if (
              value === "" ||
              value === null ||
              value === undefined ||
              (Array.isArray(value) && value.length === 0) ||
              (typeof value === "number" && value === 0)
            ) {
              return acc
            }

            acc[key] = value
            return acc
          },
          {} as Record<string, any>,
        )

        // Only save if there's meaningful data
        if (Object.keys(filteredData).length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(filteredData))
        }
      } catch (error) {
        console.warn("Failed to save form data to localStorage:", error)
      }
    },
    [storageKey, excludeFields],
  )

  // Load form data from localStorage
  const loadFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(storageKey)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        // Reset form with saved data, merging with current default values
        const currentValues = getValues()
        reset({ ...currentValues, ...parsedData })
        return true
      }
    } catch (error) {
      console.warn("Failed to load form data from localStorage:", error)
    }
    return false
  }, [storageKey, reset, getValues])

  // Clear saved data
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn("Failed to clear form data from localStorage:", error)
    }
  }, [storageKey])

  // Load data on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // Watch for form changes and save with debouncing
  useEffect(() => {
    const subscription = watch((data) => {
      const timeoutId = setTimeout(() => {
        saveToStorage(data as T)
      }, debounceMs)

      return () => clearTimeout(timeoutId)
    })

    return () => subscription.unsubscribe()
  }, [watch, saveToStorage, debounceMs])

  return {
    loadFromStorage,
    clearStorage,
    saveToStorage: () => saveToStorage(getValues()),
  }
}
  