"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, MapPin, RefreshCw } from "lucide-react"

const Ball = ({ index }: { index: number }) => {
  const size = Math.random() * 20 + 10
  const initialX = Math.random() * window.innerWidth
  const initialY = Math.random() * window.innerHeight

  return (
    <motion.div
      key={index}
      className="absolute rounded-full bg-white opacity-30"
      style={{
        width: size,
        height: size,
      }}
      initial={{ x: initialX, y: initialY }}
      animate={{
        x: [initialX, initialX + Math.random() * 200 - 100, initialX],
        y: [initialY, initialY + Math.random() * 200 - 100, initialY],
      }}
      transition={{
        duration: Math.random() * 10 + 10,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
    />
  )
}

export default function StatusPage() {
  const [status, setStatus] = useState<string>("読み込み中...")
  const [lastUpdated, setLastUpdated] = useState<string>("読み込み中...")
  const [isLoading, setIsLoading] = useState(false)

  // GitHub Pagesの location.json から現在の状態を取得
  const fetchStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("location.json")
      const data = await response.json()
      setStatus(data.status)
      setLastUpdated(data.last_updated)
    } catch (error) {
      setStatus("データを取得できませんでした")
      setLastUpdated("-")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4 overflow-hidden relative">
      {[...Array(20)].map((_, index) => (
        <Ball key={index} index={index} />
      ))}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative z-10"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">現在の状態</h1>
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="flex items-center space-x-3"
            >
              <MapPin className="text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">場所・状態</p>
                <p className="text-lg font-semibold text-gray-800">{status}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center space-x-3">
            <Clock className="text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">最終更新</p>
              <p className="text-lg font-semibold text-gray-800">{lastUpdated}</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchStatus}
          disabled={isLoading}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out flex items-center justify-center"
        >
          {isLoading ? (
            <RefreshCw className="animate-spin" />
          ) : (
            <>
              <RefreshCw className="mr-2" />
              更新
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  )
}