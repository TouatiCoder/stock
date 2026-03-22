// Version simplifiée sans IndexedDB
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    // Vérifier l'expiration
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data as T
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

export const dashboardCache = new SimpleCache()