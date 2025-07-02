"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export function useNavigationHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleNavigationMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE') {
        const { path, target } = event.data.payload
        
        if (pathname !== path) {
          document.body.classList.add('waiting-navigation')
          
          setTimeout(() => {
            router.push(path)
            localStorage.setItem('scrollTarget', target)
            
            setTimeout(() => {
              document.body.classList.remove('waiting-navigation')
            }, 1000)
          }, 3000)
        } else {
          setTimeout(() => {
            scrollToTarget(target)
          }, 300)
        }
      }
    }

    const scrollToTarget = (targetId: string) => {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start' 
        })
        element.classList.add('ring-2', 'ring-blue-500', 'transition-all')
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500')
        }, 3000)
      }
    }

    const target = localStorage.getItem('scrollTarget')
    if (target) {
      localStorage.removeItem('scrollTarget')
      setTimeout(() => scrollToTarget(target), 500)
    }

    window.addEventListener('message', handleNavigationMessage)

    return () => {
      window.removeEventListener('message', handleNavigationMessage)
    }
  }, [pathname, router])
}